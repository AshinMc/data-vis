// This file does the following simple steps:
//  1. Load two CSV files (internet usage and happiness).
//  2. Join them by country name (after tiny name fixes).
//  3. Calculate a Pearson correlation coefficient.
//  4. Draw a scatter plot and a best fit (regression) line and compute R^2.
//  5. Make a VERY BASIC spatial clustering (k=3) just with lat/lon.
//  6. Do a tiny Geographically Weighted Regression style local slope (really simple).
//  7. List “anomalies” (largest residuals from the global line).
//  8. Print a short interpretation + pattern summary.

// Lots of comments and very explicit code so I do not forget what i wrote :]

// An array to hold merged country rows
var merged = [];

// Fix a few country name differences so they match in both files
function fixName(name){
  if(name === 'DR Congo') return 'Congo (Kinshasa)';
  if(name === 'Republic of the Congo') return 'Congo (Brazzaville)';
  if(name === 'Hong Kong') return 'Hong Kong S.A.R. of China';
  return name;
}

// Main load function (nested fetches kept super simple)
function loadData(){
  fetch('internet-users-by-country-2024.csv').then(function(resp){ return resp.text(); }).then(function(internetCSV){
    fetch('WHR24_Data_Figure_2.1.csv').then(function(resp2){ return resp2.text(); }).then(function(happyCSV){

      // Parse CSV text into arrays of objects
      var internetRows = Papa.parse(internetCSV,{header:true,dynamicTyping:true}).data;
      var happyRows    = Papa.parse(happyCSV,{header:true,dynamicTyping:true}).data;

      // Build a simple map from country -> happiness score
      var happyMap = {};
      for(var i=0;i<happyRows.length;i++){
        var hRow = happyRows[i];
        if(hRow && hRow['Country'] && hRow['Ladder score']){
          var cleanName = fixName(String(hRow['Country']).trim());
          happyMap[cleanName] = parseFloat(hRow['Ladder score']);
        }
      }

      // Go through internet rows and if also in happiness map, push merged object
      for(var j=0;j<internetRows.length;j++){
        var iRow = internetRows[j];
        if(iRow && iRow['Country'] && iRow['PctOfPopulationUsingInternet']){
          var name = fixName(String(iRow['Country']).trim());
          if(happyMap[name] !== undefined){
            merged.push({
              country: name,
              internet: parseFloat(iRow['PctOfPopulationUsingInternet']),
              happiness: happyMap[name],
              lat: parseFloat(iRow['Latitude']),
              lon: parseFloat(iRow['Longitude'])
            });
          }
        }
      }

      // Filter out any rows with missing numbers (just to be safe)
      var cleaned = [];
      for(var k=0;k<merged.length;k++){
        var row = merged[k];
        if(isFinite(row.internet) && isFinite(row.happiness)){
          cleaned.push(row);
        }
      }
      merged = cleaned;

      var msg = document.getElementById('loadMsg');
      if(msg){ msg.textContent = 'Merged countries: ' + merged.length; }

      // Run all analyses in try/catch so one failure does not stop the rest
      try{ correlation(); } catch(e){ console.error('Correlation error', e); }
      try{ regression(); } catch(e){ console.error('Regression error', e); }
      try{ clustering(); } catch(e){ console.error('Clustering error', e); }
      try{ gwr(); } catch(e){ console.error('GWR error', e); }
      try{ anomalies(); } catch(e){ console.error('Anomalies error', e); }
      try{ interpret(); } catch(e){ console.error('Interpret error', e); }
    });
  });
}

// 1. Correlation
function correlation(){
  // Build simple arrays for internet and happiness
  var xValues = [];
  var yValues = [];
  for(var i=0;i<merged.length;i++){
    xValues.push(merged[i].internet);
    yValues.push(merged[i].happiness);
  }
  if(xValues.length === 0){ return; }

  // Pearson correlation from library (simple-statistics)
  var r = ss.sampleCorrelation(xValues, yValues);

  // Show results
  var div = document.getElementById('corrStats');
  if(!div) return;
  div.innerHTML='';
  addStat(div,'Pearson r', r.toFixed(3));
  addStat(div,'n', xValues.length);
}

// 2. Regression scatter + line
function regression(){
  if(merged.length === 0){ return; }

  // Get container size
  var container = d3.select('#scatter');
  var width  = container.node().clientWidth;
  var height = container.node().clientHeight;
  var padding = 50;

  // Create SVG
  var svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Find min/max for axes
  var minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
  for(var i=0;i<merged.length;i++){
    var row = merged[i];
    if(row.internet < minX) minX = row.internet;
    if(row.internet > maxX) maxX = row.internet;
    if(row.happiness < minY) minY = row.happiness;
    if(row.happiness > maxY) maxY = row.happiness;
  }

  // Scales
  var xScale = d3.scaleLinear().domain([minX, maxX]).range([padding, width - padding]);
  var yScale = d3.scaleLinear().domain([minY, maxY]).range([height - padding, padding]);

  // Axes
  svg.append('g').attr('transform','translate(0,'+(height - padding)+')').call(d3.axisBottom(xScale));
  svg.append('g').attr('transform','translate('+padding+',0)').call(d3.axisLeft(yScale));

  // Dots
  for(var j=0;j<merged.length;j++){
    var point = merged[j];
    svg.append('circle')
      .attr('cx', xScale(point.internet))
      .attr('cy', yScale(point.happiness))
      .attr('r', 4)
      .attr('fill', '#3498db');
  }

  // Prepare data pairs for regression
  var pairs = [];
  for(var k=0;k<merged.length;k++){
    pairs.push([merged[k].internet, merged[k].happiness]);
  }
  var lr = ss.linearRegression(pairs); // { m: slope? (library uses b), b: intercept? but older version uses {m,b}? we used lr.b earlier } 
  // We used lr.b as slope and lr.a as intercept earlier; keep same structure for consistency
  var f = ss.linearRegressionLine(lr);
  var xStart = minX;
  var yStart = f(xStart);
  var xEnd = maxX;
  var yEnd = f(xEnd);
  svg.append('line')
    .attr('x1', xScale(xStart))
    .attr('y1', yScale(yStart))
    .attr('x2', xScale(xEnd))
    .attr('y2', yScale(yEnd))
    .attr('stroke', 'red')
    .attr('stroke-width', 2);

  // Manual R^2
  var meanY = 0;
  for(var mi=0;mi<merged.length;mi++){ meanY += merged[mi].happiness; }
  meanY = meanY / merged.length;
  var SSE = 0; // sum squared errors
  var SST = 0; // total sum squares
  for(var rIndex=0;rIndex<merged.length;rIndex++){
    var yObserved = merged[rIndex].happiness;
    var yPred     = f(merged[rIndex].internet);
    var err = yObserved - yPred;
    SSE += err * err;
    var dev = yObserved - meanY;
    SST += dev * dev;
  }
  var r2 = (SST === 0) ? 0 : (1 - SSE / SST);

  var box = document.getElementById('regressionStats');
  if(box){
    box.innerHTML = '';
    addStat(box,'Equation','y='+lr.b.toFixed(3)+'x+'+lr.a.toFixed(3));
    addStat(box,'R2', r2.toFixed(3));
  }
}

function addStat(parent, label, value){
  if(!parent) return;
  var box = document.createElement('div');
  box.className = 'stat';
  box.innerHTML = '<b>' + label + ':</b> ' + value;
  parent.appendChild(box);
}

// 3. VERY SIMPLE k-means (k=3) just on lat/lon to show spatial grouping
function clustering(){
  var mapDiv = document.getElementById('clusterMap');
  if(!mapDiv) return;
  var summaryBox = document.getElementById('clusterSummary');

  // Collect only rows with coordinates
  var pts = [];
  for(var i=0;i<merged.length;i++){
    if(isFinite(merged[i].lat) && isFinite(merged[i].lon)){
      pts.push(merged[i]);
    }
  }
  if(pts.length < 3){
    if(summaryBox){ summaryBox.textContent = 'Not enough location data to form clusters (need at least 3).'; }
    return;
  }

  var k = 3; // number of clusters
  var centers = [];
  // Start centers as first k points
  for(var c=0;c<k;c++){
    centers.push([pts[c].lat, pts[c].lon]);
  }

  // Run a few (5) rounds of assignment + update
  for(var round=0; round<5; round++){
    // Assign each point to nearest center
    for(var p=0;p<pts.length;p++){
      var bestCluster = -1;
      var bestDist = 1e99;
      for(var ci=0;ci<k;ci++){
        var dx = pts[p].lat - centers[ci][0];
        var dy = pts[p].lon - centers[ci][1];
        var distSq = dx*dx + dy*dy;
        if(distSq < bestDist){ bestDist = distSq; bestCluster = ci; }
      }
      pts[p].cluster = bestCluster;
    }
    // Recompute centers
    var sums = [];
    for(var init=0;init<k;init++){ sums[init] = {x:0,y:0,n:0}; }
    for(var p2=0;p2<pts.length;p2++){
      var cl = pts[p2].cluster;
      sums[cl].x += pts[p2].lat;
      sums[cl].y += pts[p2].lon;
      sums[cl].n += 1;
    }
    for(var ci2=0;ci2<k;ci2++){
      if(sums[ci2].n > 0){
        centers[ci2][0] = sums[ci2].x / sums[ci2].n;
        centers[ci2][1] = sums[ci2].y / sums[ci2].n;
      }
    }
  }

  // Draw map with colored markers
  var cmap = L.map('clusterMap').setView([20,0],2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:5}).addTo(cmap);
  var colors = ['#e74c3c','#27ae60','#8e44ad'];
  for(var m=0;m<pts.length;m++){
    L.circleMarker([pts[m].lat, pts[m].lon], {
      radius: 5,
      fillColor: colors[pts[m].cluster],
      color: '#333',
      weight: 1,
      fillOpacity: 0.85
    }).addTo(cmap).bindPopup(pts[m].country + '<br>Cluster ' + pts[m].cluster);
  }

  // Simple summary table
  var tableHTML = '<table><tr><th>Cluster</th><th>Count</th><th>Mean Internet</th><th>Mean Happiness</th></tr>';
  for(var clusterIndex=0;clusterIndex<k;clusterIndex++){
    var count=0, sumI=0, sumH=0;
    for(var r=0;r<pts.length;r++){
      if(pts[r].cluster === clusterIndex){
        count++; sumI += pts[r].internet; sumH += pts[r].happiness;
      }
    }
    tableHTML += '<tr><td>' + clusterIndex + '</td><td>' + count + '</td><td>' + (count?(sumI/count).toFixed(1):'') + '</td><td>' + (count?(sumH/count).toFixed(2):'') + '</td></tr>';
  }
  tableHTML += '</table>';
  if(summaryBox){ summaryBox.innerHTML = tableHTML; }
}

// 4. Simple local slope (tiny GWR) using neighbours within 2500 km
function gwr(){
  var mapDiv = document.getElementById('gwrMap');
  if(!mapDiv) return;

  // Collect points with coordinates
  var pts = [];
  for(var i=0;i<merged.length;i++){
    if(isFinite(merged[i].lat) && isFinite(merged[i].lon)){
      pts.push(merged[i]);
    }
  }
  if(pts.length < 5){
    var lgMsg = document.getElementById('gwrLegend');
    if(lgMsg) lgMsg.textContent = 'Not enough points with coordinates (need 5+).';
    return;
  }

  // Helper functions
  function toRad(val){ return val * Math.PI / 180; }
  function distanceKm(lat1, lon1, lat2, lon2){
    var R = 6371; // earth radius km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    var c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
  }

  var bandwidth = 2500; // distance threshold for neighbours

  // For each point compute a local slope using weighted least squares for y ~ x
  for(var p=0;p<pts.length;p++){
    var center = pts[p];
    var neighbours = [];
    for(var q=0;q<pts.length;q++){
      var other = pts[q];
      var d = distanceKm(center.lat, center.lon, other.lat, other.lon);
      if(d <= bandwidth){ neighbours.push({row:other, dist:d}); }
    }
    if(neighbours.length < 5){ center.localSlope = null; continue; }

    // Weighted sums for simple linear regression (X = internet, Y = happiness)
    var S11=0, S12=0, S22=0, T1=0, T2=0;
    for(var n=0;n<neighbours.length;n++){
      var w = Math.exp(-(neighbours[n].dist * neighbours[n].dist)/(bandwidth*bandwidth));
      var xVal = neighbours[n].row.internet;
      var yVal = neighbours[n].row.happiness;
      S11 += w;
      S12 += w * xVal;
      S22 += w * xVal * xVal;
      T1  += w * yVal;
      T2  += w * xVal * yVal;
    }
    var det = S11 * S22 - S12 * S12;
    if(Math.abs(det) < 1e-9){ center.localSlope = null; continue; }
    center.localSlope = (T2 * S11 - T1 * S12) / det; // local slope only
  }

  // Find min and max slopes for color scale
  var minSlope = 9999, maxSlope = -9999;
  for(var sI=0;sI<pts.length;sI++){
    var slopeVal = pts[sI].localSlope;
    if(slopeVal != null){
      if(slopeVal < minSlope) minSlope = slopeVal;
      if(slopeVal > maxSlope) maxSlope = slopeVal;
    }
  }

  function slopeColor(v){
    if(v == null) return '#ccc';
    var ratio = (v - minSlope) / ((maxSlope - minSlope) || 1);
    var red   = Math.round(255 * (1 - ratio));
    var green = Math.round(220 * ratio);
    return 'rgb(' + red + ',' + green + ',80)';
  }

  // Draw local slope map
  var gmap = L.map('gwrMap').setView([20,0],2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:5}).addTo(gmap);
  for(var m=0;m<pts.length;m++){
    L.circleMarker([pts[m].lat, pts[m].lon], {
      radius:5,
      color:'#222',
      weight:1,
      fillOpacity:0.9,
      fillColor: slopeColor(pts[m].localSlope)
    }).addTo(gmap).bindPopup(pts[m].country + '<br>Local slope: ' + (pts[m].localSlope==null?'n/a':pts[m].localSlope.toFixed(3)));
  }

  var legend = document.getElementById('gwrLegend');
  if(legend){
    legend.textContent = 'Local slope min ' + (minSlope==9999?'n/a':minSlope.toFixed(3)) + ' | max ' + (maxSlope==-9999?'n/a':maxSlope.toFixed(3));
  }
}

// 5. Simple anomalies (largest absolute residuals from global regression line)
function anomalies(){
  var list = document.getElementById('topResiduals');
  if(!list) return;
  if(merged.length < 5){ list.innerHTML = '<li>Not enough data for anomalies (need 5+ countries).</li>'; return; }

  // Build pairs for regression
  var pairs = [];
  for(var i=0;i<merged.length;i++){
    pairs.push([merged[i].internet, merged[i].happiness]);
  }
  var lr = ss.linearRegression(pairs);
  var f  = ss.linearRegressionLine(lr);

  // Compute residuals (actual - predicted)
  var rows = [];
  for(var j=0;j<merged.length;j++){
    var countryData = merged[j];
    var predicted   = f(countryData.internet);
    var resid       = countryData.happiness - predicted;
    rows.push({country: countryData.country, residual: resid});
  }

  // Sort by absolute residual descending
  rows.sort(function(a,b){ return Math.abs(b.residual) - Math.abs(a.residual); });

  // Show top 10
  list.innerHTML = '';
  var limit = rows.length < 10 ? rows.length : 10;
  for(var r=0;r<limit;r++){
    var li = document.createElement('li');
    li.textContent = rows[r].country + ': residual ' + rows[r].residual.toFixed(2);
    list.appendChild(li);
  }
}

// 6. Auto interpretation (very short plain text)
function interpret(){
  // Build arrays again (clear for a beginner)
  var xs = [];
  var ys = [];
  for(var i=0;i<merged.length;i++){
    xs.push(merged[i].internet);
    ys.push(merged[i].happiness);
  }
  if(xs.length === 0) return;
  var r = ss.sampleCorrelation(xs, ys);

  // Describe strength in words
  var strength;
  var absr = Math.abs(r);
  if(absr < 0.2) strength = 'very weak';
  else if(absr < 0.4) strength = 'weak';
  else if(absr < 0.6) strength = 'moderate';
  else if(absr < 0.8) strength = 'strong';
  else strength = 'very strong';

  var sentence = 'Pearson correlation = ' + r.toFixed(3) + ' (' + strength + ' ' + (r>=0?'positive':'negative') + '). ' +
                 'Higher internet use tends ' + (r>=0?'to go with higher':'NOT to go with higher') + ' happiness on average. ' +
                 'This does NOT prove cause (spurious correlation risk).';
  var interpDiv = document.getElementById('autoInterpret');
  if(interpDiv){ interpDiv.textContent = sentence; }

  // Residual pattern summary (top 3 above and below line)
  var pairs = [];
  for(var p=0;p<merged.length;p++){ pairs.push([merged[p].internet, merged[p].happiness]); }
  var lr = ss.linearRegression(pairs);
  var f = ss.linearRegressionLine(lr);
  var residuals = [];
  for(var rI=0;rI<merged.length;rI++){
    residuals.push({country: merged[rI].country, res: merged[rI].happiness - f(merged[rI].internet)});
  }
  // Highest residuals (positive)
  residuals.sort(function(a,b){ return b.res - a.res; });
  var top = [];
  for(var t=0;t<3 && t<residuals.length;t++){ top.push(residuals[t].country); }
  // Lowest residuals (negative)
  residuals.sort(function(a,b){ return a.res - b.res; });
  var bottom = [];
  for(var bt=0;bt<3 && bt<residuals.length;bt++){ bottom.push(residuals[bt].country); }
  var patDiv = document.getElementById('patternSummary');
  if(patDiv){ patDiv.textContent = 'Countries above line (examples): ' + top.join(', ') + ' | Below line: ' + bottom.join(', '); }
}

// START everything
loadData();
