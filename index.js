// Initialize the Leaflet map centered on the world with zoom level 2
var map = L.map('map').setView([20, 0], 2);

// Global data storage objects
var internetData = {}; // Stores internet usage percentages by country
var happinessData = {}; // Stores happiness scores by country
var countriesLayer; // Will hold the GeoJSON layer for country polygons
var markerCluster = L.markerClusterGroup(); // Groups nearby markers for better performance

// Returns color based on happiness score (green for high, red for low)
function getHappinessColor(score) 
{
    if (!score) return '#2c3e50'; // Dark gray for missing data
    if (score >= 7.0) return '#27ae60'; // Dark green for very happy countries
    if (score >= 6.5) return '#2ecc71'; // Green for happy countries
    if (score >= 6.0) return '#f39c12'; // Orange for moderately happy
    if (score >= 5.5) return '#e67e22'; // Dark orange for below average
    if (score >= 4.5) return '#e74c3c'; // Red for unhappy countries
    return '#c0392b'; // Dark red for very unhappy countries
}

// Returns marker radius based on internet usage percentage
function getMarkerSize(pct) 
{
    if (!pct) return 4; // Small marker for missing data
    if (pct >= 90) return 12; // Largest markers for highest usage
    if (pct >= 70) return 10;
    if (pct >= 50) return 8;
    if (pct >= 30) return 6;
    return 4; // Smallest markers for lowest usage
}

// Returns marker color based on internet usage percentage (purple to orange spectrum)
function getMarkerColor(pct) 
{
    if (!pct) return '#95a5a6'; // Gray for missing data
    if (pct >= 90) return '#8e44ad'; // Purple for highest usage
    if (pct >= 70) return '#3498db'; // Blue for high usage
    if (pct >= 50) return '#16a085'; // Teal for moderate usage
    if (pct >= 30) return '#f1c40f'; // Yellow for low usage
    return '#e67e22'; // Orange for very low usage
}

var geojsonData = null; // Will store the world countries GeoJSON data

// Processes internet usage CSV data and creates circular markers on the map
function processInternetData(data) {
    data.forEach(function(row) {
        // Check if row has required country and internet data
        if (row["Country"] && row["PctOfPopulationUsingInternet"])
        {
            var country = row["Country"];
            var internetPct = parseFloat(row["PctOfPopulationUsingInternet"]);
            internetData[country] = internetPct; // Store data for later use

            // If coordinates are available, create a marker
            if (row["Latitude"] && row["Longitude"]) 
            {
                var lat = parseFloat(row["Latitude"]);
                var lon = parseFloat(row["Longitude"]);
                
                // Create circular marker with size and color based on internet usage
                L.circleMarker([lat, lon], {
                    radius: getMarkerSize(internetPct), // Size reflects usage percentage
                    color: '#ffffff', // White border
                    weight: 2,
                    fillColor: getMarkerColor(internetPct), // Color reflects usage level
                    fillOpacity: 0.9
                }).addTo(markerCluster) // Add to cluster group for performance
                .bindPopup( // Create popup showing country info
                    `<b>${country}</b><br>
                    <br>Internet Usage: ${internetPct}%`
                );
            }
        }
    });

    map.addLayer(markerCluster); // Add all markers to the map

    // If happiness data and world map are loaded, show the complete visualization
    if (Object.keys(happinessData).length > 0 && geojsonData) {
        showMap(geojsonData);
    }
}

// Processes happiness CSV data and stores it for country coloring
function processHappinessData(data) {
    data.forEach(function(row) {
        // Extract happiness score for each country
        if (row["Country"] && row["Ladder score"]) {
            var country = row["Country"];
            var score = parseFloat(row["Ladder score"]);
            happinessData[country] = score; // Store for country polygon coloring
        }
    });

    // If internet data and world map are loaded, show the complete visualization
    if (Object.keys(internetData).length > 0 && geojsonData) {
        showMap(geojsonData);
    }
}

// Creates the main map visualization with country polygons colored by happiness
function showMap(geojsonData) {
  // Create country polygons layer with happiness-based coloring
  countriesLayer = L.geoJSON(geojsonData, {
    // Style each country polygon
    style: feature => ({
      fillColor: getHappinessColor(happinessData[feature.properties.name]), // Color by happiness
      weight: 1, // Border thickness
      opacity: 1,
      color: '#34495e', // Border color (dark gray)
      fillOpacity: 0.7 // Semi-transparent fill
    }),
    // Add click interaction to each country
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name;
      const happy = happinessData[name]; // Get happiness score
      const net = internetData[name]; // Get internet usage

      // Show popup with both metrics when country is clicked
      layer.on('click', () => {
        let popup = `<div><h3>${name}</h3>`;
        if (happy) popup += `<p>Happiness: ${happy}/10</p>`;
        if (net) popup += `<p>Internet: ${net}%</p>`;
        popup += `</div>`;
        layer.bindPopup(popup).openPopup();
      });
    }
  }).addTo(map);
    
    // Add legends explaining the color/size coding
    createHappinessLegend().addTo(map);
    createInternetLegend().addTo(map);

  // Add layer control to toggle between country polygons and markers
  L.control.layers(null, {
    "Happiness by Country": countriesLayer,
    "Internet Usage Markers": markerCluster
  }).addTo(map);
}

// Creates legend explaining happiness score color coding
function createHappinessLegend() {
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function() {
        var div = L.DomUtil.create('div', 'legend happiness-legend');
        // Build HTML showing color scale for happiness scores
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

// Creates legend explaining internet usage marker size and color coding
function createInternetLegend() {
    var legend = L.control({position: 'bottomleft'});
    legend.onAdd = function() {
        var div = L.DomUtil.create('div', 'legend internet-legend');
        // Calculate marker sizes for different usage levels
        var size1 = getMarkerSize(1) + 'px';
        var size2 = getMarkerSize(31) + 'px';
        var size3 = getMarkerSize(51) + 'px';
        var size4 = getMarkerSize(71) + 'px';
        var size5 = getMarkerSize(91) + 'px';
        
        // Build HTML showing size and color scale for internet usage
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

// Add OpenStreetMap base layer as the background map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Load world countries GeoJSON data from external source
fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonData = data; // Store for use once other data loads
        // If both CSV datasets are already loaded, create the visualization
        if (Object.keys(internetData).length > 0 && Object.keys(happinessData).length > 0) {
            showMap(geojsonData);
        }
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Load and parse internet usage CSV data
fetch('internet-users-by-country-2024.csv')
    .then(response => response.text())
    .then(csvText => {
        // Parse CSV with headers and automatic type conversion
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processInternetData(results.data); // Process the parsed data
    })
    .catch(error => console.error('Error loading internet data:', error));

// Load and parse happiness report CSV data
fetch('WHR24_Data_Figure_2.1.csv')
    .then(response => response.text())
    .then(csvText => {
        // Parse CSV with headers and automatic type conversion
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processHappinessData(results.data); // Process the parsed data
    })
    .catch(error => console.error('Error loading happiness data:', error));