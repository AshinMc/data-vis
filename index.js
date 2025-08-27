var map = L.map('map').setView([20, 0], 2);
var internetData = {};
var happinessData = {};
var countriesLayer;
var markerCluster = L.markerClusterGroup();

function getHappinessColor(score) {
    if (!score) return '#2c3e50';
    if (score >= 7.0) return '#27ae60';
    if (score >= 6.5) return '#2ecc71';
    if (score >= 6.0) return '#f39c12';
    if (score >= 5.5) return '#e67e22';
    if (score >= 4.5) return '#e74c3c';
    return '#c0392b';
}

function getMarkerSize(pct) {
    if (!pct) return 4;
    if (pct >= 90) return 12;
    if (pct >= 70) return 10;
    if (pct >= 50) return 8;
    if (pct >= 30) return 6;
    return 4;
}

function getMarkerColor(pct) {
    if (!pct) return '#95a5a6';
    if (pct >= 90) return '#8e44ad';
    if (pct >= 70) return '#3498db';
    if (pct >= 50) return '#16a085';
    if (pct >= 30) return '#f1c40f';
    return '#e67e22';
}

var geojsonData = null;

// Process internet data and create markers
function processInternetData(data) {
    data.forEach(function(row) {
        if (row["Country"] && row["PctOfPopulationUsingInternet"]) {
            var country = row["Country"];
            var internetPct = parseFloat(row["PctOfPopulationUsingInternet"]);
            internetData[country] = internetPct;

            if (row["Latitude"] && row["Longitude"]) {
                var lat = parseFloat(row["Latitude"]);
                var lon = parseFloat(row["Longitude"]);
                L.circleMarker([lat, lon], {
                    radius: getMarkerSize(internetPct),
                    color: '#ffffff',
                    weight: 2,
                    fillColor: getMarkerColor(internetPct),
                    fillOpacity: 0.9
                }).addTo(markerCluster)
                .bindPopup(
                    `<b>${country}</b><br>
                    <br>Internet Usage: ${internetPct}%`
                );
            }
        }
    });

    map.addLayer(markerCluster);

    if (Object.keys(happinessData).length > 0 && geojsonData) {
        showMap(geojsonData);
    }
}

// Process happiness data and optionally mark countries (different popup style)
function processHappinessData(data) {
    data.forEach(function(row) {
        if (row["Country"] && row["Ladder score"]) {
            var country = row["Country"];
            var score = parseFloat(row["Ladder score"]);
            happinessData[country] = score;
        }
    });

    //map.addLayer(markerCluster);

    if (Object.keys(internetData).length > 0 && geojsonData) {
        showMap(geojsonData);
    }
}
// Check how strong the relationship is between internet usage and happiness (need to be studied more)
/*function analyzeCorrelation() {
    let internetValues = [];
    let happinessValues = [];

    for (let country in happinessData) {
        if (internetData[country] !== undefined) {
            internetValues.push(internetData[country]);
            happinessValues.push(happinessData[country]);
        }
    }

    if (internetValues.length > 0) {
        let correlation = ss.sampleCorrelation(internetValues, happinessValues);
        console.log("Correlation:", correlation.toFixed(2));
        alert("Correlation between Internet Usage and Happiness: " + correlation.toFixed(2));
    } else {
        alert("No matching data found to calculate correlation.");
    }
}
// Group countries into clusters based on map location (need to be studied more)
function analyzeSpatialClusters() {
    let points = [];

    markerCluster.eachLayer(layer => {
        if (layer.getLatLng) {
            let loc = layer.getLatLng();
            points.push([loc.lng, loc.lat]); // store longitude and latitude
        }
    });

    if (points.length === 0) {
        alert("No map points found for clustering.");
        return;
    }

    let clusters = ss.kMeans(points, 3); // group into 3 clusters
    console.log("Clusters:", clusters);
    alert("Spatial clustering complete. Check console for details.");
}*/

function showMap(geojsonData) {
  countriesLayer = L.geoJSON(geojsonData, {
    style: feature => ({
      fillColor: getHappinessColor(happinessData[feature.properties.name]),
      weight: 1,
      opacity: 1,
      color: '#34495e',
      fillOpacity: 0.7
    }),
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name;
      const happy = happinessData[name];
      const net = internetData[name];

      layer.on('click', () => {
        let popup = `<div><h3>${name}</h3>`;
        if (happy) popup += `<p>Happiness: ${happy}/10</p>`;
        if (net) popup += `<p>Internet: ${net}%</p>`;
        popup += `</div>`;
        layer.bindPopup(popup).openPopup();
      });
    }
  }).addTo(map);
    createHappinessLegend().addTo(map);
    createInternetLegend().addTo(map);

  L.control.layers(null, {
    "Happiness by Country": countriesLayer,
    "Internet Usage Markers": markerCluster
  }).addTo(map);
}
function createHappinessLegend() {
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function() {
        var div = L.DomUtil.create('div', 'legend happiness-legend');
        div.innerHTML = '<strong>Happiness Score</strong><br>' +
            '<span style="background:' + getHappinessColor(0.1) + '"></span> 0-4.5<br>' +
            '<span style="background:' + getHappinessColor(4.6) + '"></span> 4.5-5.5<br>' +
            '<span style="background:' + getHappinessColor(5.6) + '"></span> 5.5-6.0<br>' +
            '<span style="background:' + getHappinessColor(6.1) + '"></span> 6.0-6.5<br>' +
            '<span style="background:' + getHappinessColor(6.6) + '"></span> 6.5-7.0<br>' +
            '<span style="background:' + getHappinessColor(7.1) + '"></span> 7.0+';
        return div;
    };
    return legend;
}

function createInternetLegend() {
    var legend = L.control({position: 'bottomleft'});
    legend.onAdd = function() {
        var div = L.DomUtil.create('div', 'legend internet-legend');
        var size1 = getMarkerSize(1) + 'px';
        var size2 = getMarkerSize(31) + 'px';
        var size3 = getMarkerSize(51) + 'px';
        var size4 = getMarkerSize(71) + 'px';
        var size5 = getMarkerSize(91) + 'px';
        
        div.innerHTML = '<strong>Internet Usage %</strong><br>' +
            '<span style="background:' + getMarkerColor(1) + '; width:' + size1 + '; height:' + size1 + '"></span> 0-30%<br>' +
            '<span style="background:' + getMarkerColor(31) + '; width:' + size2 + '; height:' + size2 + '"></span> 30-50%<br>' +
            '<span style="background:' + getMarkerColor(51) + '; width:' + size3 + '; height:' + size3 + '"></span> 50-70%<br>' +
            '<span style="background:' + getMarkerColor(71) + '; width:' + size4 + '; height:' + size4 + '"></span> 70-90%<br>' +
            '<span style="background:' + getMarkerColor(91) + '; width:' + size5 + '; height:' + size5 + '"></span> 90%+';
        return div;
    };
    return legend;
}

// Base map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Load GeoJSON
fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonData = data;
        if (Object.keys(internetData).length > 0 && Object.keys(happinessData).length > 0) {
            showMap(geojsonData);
            //analyzeCorrelation();
            //analyzeSpatialClusters();
        }
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Load internet data
fetch('internet-users-by-country-2024.csv')
    .then(response => response.text())
    .then(csvText => {
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processInternetData(results.data);
    })
    .catch(error => console.error('Error loading internet data:', error));

// Load happiness data
fetch('WHR24_Data_Figure_2.1.csv')
    .then(response => response.text())
    .then(csvText => {
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processHappinessData(results.data);
    })
    .catch(error => console.error('Error loading happiness data:', error));
