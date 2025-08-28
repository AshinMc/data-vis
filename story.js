// VERY SIMPLE BEGINNER STYLE STORY SCRIPT
// We load two CSVs, join by Country, then walk through chapters.

let map;               // the Leaflet map
let allData = [];       // merged rows
let chapters = [];      // chapter objects (name, text, optional img)
let current = 0;        // index of current chapter
let markersLayer;       // layer group for country circles
let globalCorrelation = 0; // store correlation once
let typing = false;        // flag for typewriter
let fullText = '';         // current full line
let typeIndex = 0;         // current char index
let typeTimer = null;      // timer id

init();

function init() {
    map = L.map('map').setView([20,0],2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 6,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    loadData();
    setupButtons();
}

function loadData() {
    // Load both CSVs with Papa Parse
    Papa.parse('internet-users-by-country-2024.csv', {
        download:true,
        header:true,
        complete: function(usersRes) {
            Papa.parse('WHR24_Data_Figure_2.1.csv', {
                download:true,
                header:true,
                complete: function(happyRes) {
                    mergeData(usersRes.data, happyRes.data);
                    buildChapters();
                    goToChapter(0);
                },
                error: function() { alert('Could not load happiness CSV'); }
            });
        },
        error: function() { alert('Could not load internet CSV'); }
    });
}

function mergeData(listA, listB) {
    // Build lookup of happiness rows by country
    let dictB = {};
    for (let i=0; i<listB.length; i++) {
        let row = listB[i];
        let name = (row.Country || '').trim();
        if (name) { dictB[name] = row; }
    }

    for (let i=0; i<listA.length; i++) {
        let rowA = listA[i];
        let countryName = (rowA.Country || '').trim();
        if (!countryName) continue;
        let match = dictB[countryName];
        if (!match) continue; // require happiness row

        // Correct column names based on provided CSVs
        let Internet = parseFloat(rowA.PctOfPopulationUsingInternet);
        let Happiness = parseFloat(match['Ladder score']);
        let Lat = parseFloat(rowA.Latitude); // lat/lon come from internet file
        let Lon = parseFloat(rowA.Longitude);

        if (!isFinite(Internet) || !isFinite(Happiness) || !isFinite(Lat) || !isFinite(Lon)) {
            continue;
        }
        allData.push({ country: countryName, internet: Internet, happiness: Happiness, lat: Lat, lon: Lon });
    }
    console.log('Merged rows count:', allData.length);
}

function buildChapters() {
    // Simple manual groups (easy for beginners to read)
    let highConn = ['United States','United Kingdom','Germany','Japan','South Korea','Australia','Canada'];
    let lowerConn = ['Ethiopia','DR Congo','Niger','Madagascar','Afghanistan','Kenya'];
    let latinMix = ['Brazil','Mexico','Argentina','Chile','Colombia'];
    let exceptions = ['Uzbekistan','Vietnam','Philippines'];

    globalCorrelation = computeCorrelation();

    chapters = [
        { name:'Mr. Stickman', img:'assets/hello.png', text:'Welcome! A short tale about internet use and happiness. Press Next.', action: function(){ drawMarkers(); fitAll(0.05); } },
        { name:'Mr. Stickman', img:'assets/standing.png', text:'All countries together: bigger circle means more people online; warmer color, higher reported happiness.', action: function(){ drawMarkers(); fitAll(0.05); } },
        { name:'Mr. Stickman', img:'assets/confused.png', text:'Overall correlation is about ' + globalCorrelation.toFixed(2) + '. A gentle positive link—useful, but not destiny.', action: function(){ drawMarkers(); } },
        { name:'Mr. Stickman', img:'assets/hurray.png', text:'Highly connected nations cluster toward the brighter side.', action: function(){ drawMarkers(highConn); focusNames(highConn); } },
        { name:'Mr. Stickman', img:'assets/standing.png', text:'These places often pair infrastructure, income, education, and social safety nets—hard to untangle which piece matters most.', action: function(){ /* context only */ } },
        { name:'Mr. Stickman', img:'assets/confused.png', text:'Lower access group tends to sit cooler in color.', action: function(){ drawMarkers(lowerConn); focusNames(lowerConn); } },
        { name:'Mr. Stickman', img:'assets/standing.png', text:'Here limitations might reflect cost, connectivity gaps, or broader development hurdles impacting well‑being.', action: function(){ /* context only */ } },
        { name:'Mr. Stickman', img:'assets/standing.png', text:'Latin American mix: moderate access yet often middling-to-good happiness—social factors can lift scores.', action: function(){ drawMarkers(latinMix); focusNames(latinMix); } },
        { name:'Mr. Stickman', img:'assets/hello.png', text:'Outliers are like spice. Too few = bland. Too many = chaos.', action: function(){ /* keep markers as-is */ } },
        { name:'Mr. Stickman', img:'assets/hello.png', text:'Some exceptions: moderate internet but decent happiness—suggesting community or governance compensates.', action: function(){ drawMarkers(exceptions); focusNames(exceptions); } },
        { name:'Mr. Stickman', img:'assets/hurray.png', text:'Takeaway: digital access helps, yet happiness stays multi‑factor. Keep asking deeper questions.', action: function(){ drawMarkers(); fitAll(0.05); } }
    ];
}

// No chapter list rendering needed in VN mode

function setupButtons() {
    document.getElementById('prevBtn').addEventListener('click', function() {
    goToChapter(current - 1);
    triggerShake();
    });
    document.getElementById('nextBtn').addEventListener('click', function() {
    goToChapter(current + 1);
    triggerShake();
    });
    // Keyboard support
    window.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ') { fastForwardOrNext(); triggerShake(); }
    else if (e.key === 'ArrowLeft') { goToChapter(current-1); triggerShake(); }
    });
}

function goToChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;

    current = idx;

    let chapObj = chapters[current];
    // set name and text in VN box
    // Update dialogue UI
    const nameBox = document.getElementById('dialogueName');
    const textBox = document.getElementById('dialogueText');
    const imgEl = document.getElementById('charImg');
    nameBox.textContent = chapObj.name || 'Narrator';
    startTypewriter(chapObj.text);
    if (chapObj.img) {
        imgEl.src = chapObj.img;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }
    document.getElementById('prevBtn').disabled = current===0;
    document.getElementById('nextBtn').disabled = current===chapters.length-1;
    chapObj.action();
}

// Typewriter effect (simple)
function startTypewriter(text) {
    clearInterval(typeTimer);
    fullText = text;
    typeIndex = 0;
    typing = true;
    const textBox = document.getElementById('dialogueText');
    textBox.textContent = '';
    typeTimer = setInterval(function(){
        if (typeIndex >= fullText.length) {
            clearInterval(typeTimer);
            typing = false;
            return;
        }
        textBox.textContent += fullText.charAt(typeIndex);
        typeIndex++;
    }, 25);
}

function fastForwardOrNext() {
    if (typing) {
        // finish instantly
        clearInterval(typeTimer);
        document.getElementById('dialogueText').textContent = fullText;
        typing = false;
    } else {
        goToChapter(current + 1);
    }
}

function triggerShake() {
    const imgEl = document.getElementById('charImg');
    if (!imgEl || imgEl.style.display === 'none') return;
    imgEl.classList.remove('stick-shake');
    // force reflow to restart animation
    void imgEl.offsetWidth;
    imgEl.classList.add('stick-shake');
}

function fitAll(pad) {
    if (allData.length === 0) return;
    let bounds = L.latLngBounds();
    for (let i=0; i<allData.length; i++) bounds.extend([allData[i].lat, allData[i].lon]);
    map.fitBounds(bounds.pad(pad==null?0.05:pad));
}

function drawMarkers(highlightNames) {
    markersLayer.clearLayers();
    let highlightSet = null;
    if (Array.isArray(highlightNames)) {
        highlightSet = {};
        for (let i=0; i<highlightNames.length; i++) highlightSet[highlightNames[i]] = true;
    }
    for (let i=0; i<allData.length; i++) {
        let d = allData[i];
        let highlighted = highlightSet ? !!highlightSet[d.country] : true;
        let sizeBase = 4 + (d.internet/100)*10;
        let radius = highlighted ? sizeBase + 4 : sizeBase;
        let fillOp = highlighted ? 0.9 : 0.25;
        let stroke = highlighted ? '#111' : '#555';
        let color = happinessColor(d.happiness);
        let circle = L.circleMarker([d.lat, d.lon], {
            radius: radius,
            color: stroke,
            weight: highlighted ? 2 : 1,
            fillColor: color,
            fillOpacity: fillOp
        }).bindPopup('<b>' + d.country + '</b><br>Internet %: ' + d.internet + '<br>Happiness: ' + d.happiness);
        markersLayer.addLayer(circle);
    }
}

function happinessColor(val) {
    // simple scale: low happiness blue, mid green, high orange/red
    if (val < 4) return '#2b6cb0';
    if (val < 5) return '#38a169';
    if (val < 6) return '#88c057';
    if (val < 7) return '#f6ad55';
    return '#e53e3e';
}

function computeCorrelation() {
    if (allData.length < 2) return 0;
    let xs = [], ys = [];
    for (let i=0; i<allData.length; i++) { xs.push(allData[i].internet); ys.push(allData[i].happiness); }
    let meanX = mean(xs), meanY = mean(ys), num=0, denX=0, denY=0;
    for (let i=0; i<xs.length; i++) { let dx=xs[i]-meanX, dy=ys[i]-meanY; num+=dx*dy; denX+=dx*dx; denY+=dy*dy; }
    if (denX>0 && denY>0) return num/Math.sqrt(denX*denY);
    return 0;
}

function mean(arr) {
    let sum = 0;
    for (let i=0; i<arr.length; i++) sum += arr[i];
    return sum / arr.length;
}

// Focus map on provided list of country names
function focusNames(list) {
    if (!Array.isArray(list) || list.length===0) return;
    let set = {}; for (let i=0;i<list.length;i++) set[list[i]] = true;
    let bounds = L.latLngBounds();
    let count=0;
    for (let i=0;i<allData.length;i++) {
        let d = allData[i];
        if (set[d.country]) { bounds.extend([d.lat,d.lon]); count++; }
    }
    if (count>0) map.fitBounds(bounds.pad(0.4));
}
