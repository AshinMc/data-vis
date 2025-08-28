let map;                // the leaflet map
let dataList = [];       // merged country rows
let chapters = [];       // story chapters
let currentIndex = 0;    // which chapter now
let circleLayer;         // layer for markers
let correlationValue = 0;// Pearson correlation
// Autoplay / tour state
let autoplay = false;
let autoplayTimer = null;
let autoplayDelay = 3500; // ms per chapter
let navShown = false;     // whether prev/next permanently shown

// Typewriter state
let typing = false;
let fullLine = '';
let charIndex = 0;
let typeTimer = null;

// Music state
let musicPlayer = null;
let musicStarted = false;
let musicHintShown = false;

// Kick off
init();

function init() {
    map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 6,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    circleLayer = L.layerGroup().addTo(map);

    loadCSVs();
    setupButtons();
    tryMusicLater();
}

function loadCSVs() {
    Papa.parse('internet-users-by-country-2024.csv', {
        download: true,
        header: true,
        complete: res1 => {
            Papa.parse('WHR24_Data_Figure_2.1.csv', {
                download: true,
                header: true,
                complete: res2 => {
                    mergeRows(res1.data, res2.data);
                    makeChapters();
                    goTo(0);
                }
            });
        }
    });
}

function mergeRows(internetRows, happyRows) {
    let look = {};
    for (let i = 0; i < happyRows.length; i++) {
        let nm = (happyRows[i].Country || '').trim();
        if (nm) look[nm] = happyRows[i];
    }
    for (let i = 0; i < internetRows.length; i++) {
        let r = internetRows[i];
        let nm = (r.Country || '').trim();
        if (!nm || !look[nm]) continue;
        let internet = parseFloat(r.PctOfPopulationUsingInternet);
        let happiness = parseFloat(look[nm]['Ladder score']);
        let lat = parseFloat(r.Latitude);
        let lon = parseFloat(r.Longitude);
        if (isFinite(internet) && isFinite(happiness) && isFinite(lat) && isFinite(lon)) {
            dataList.push({ country: nm, internet: internet, happiness: happiness, lat: lat, lon: lon });
        }
    }
}

function makeChapters() {
    let hi = ['United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'Canada'];
    let lo = ['Ethiopia', 'DR Congo', 'Niger', 'Madagascar', 'Afghanistan', 'Kenya'];
    let la = ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia'];
    let ex = ['Uzbekistan', 'Vietnam', 'Philippines'];

    correlationValue = calcCorrelation();

    chapters = [
        { n: 'Mr. Stickman', i: 'assets/hello.png', t: 'Welcome! Click Autoplay to start the tour. Then Next / Prev will appear.', a: () => { drawCircles(); fitAll(0.05); }, fly:{center:[20,0], zoom:2} },
        { n: 'Mr. Stickman', i: 'assets/standing.png', t: 'All countries: size = internet %, color = happiness.', a: () => { drawCircles(); fitAll(0.05); }, fly:{fitAll:true} },
        { n: 'Mr. Stickman', i: 'assets/confused.png', t: 'Correlation ≈ ' + correlationValue.toFixed(2) + ' (soft positive).', a: () => drawCircles(), fly:{center:[25,10], zoom:2.5} },
        // why any link exists
        { n: 'Mr. Stickman', i: 'assets/standing.png', t: 'Why a link? Internet often travels with money, schools, health systems & stable power. These also lift life quality.', a: () => {}, fly:{center:[35,15], zoom:2.3} },
        { n: 'Mr. Stickman', i: 'assets/hurray.png', t: 'High access group brighter.', a: () => { drawCircles(hi); focusOn(hi); }, fly:{focus:hi, zoom:3} },
        // high access explanation
        { n: 'Mr. Stickman', i: 'assets/standing.png', t: 'Rich innovation hubs: strong GDP + education + services. Hard to separate which part drives happiness most.', a: () => {}, fly:{focus:hi, zoom:3.2} },
        { n: 'Mr. Stickman', i: 'assets/confused.png', t: 'Lower access sits cooler.', a: () => { drawCircles(lo); focusOn(lo); }, fly:{focus:lo, zoom:3} },
        // low access explanation
        { n: 'Mr. Stickman', i: 'assets/confused.png', t: 'Low access causes: cost, rural distance, weak infrastructure, conflict, unreliable electricity.', a: () => {}, fly:{focus:lo, zoom:3.2} },
        { n: 'Mr. Stickman', i: 'assets/standing.png', t: 'Latin American mix: moderate access, decent happiness.', a: () => { drawCircles(la); focusOn(la); }, fly:{focus:la, zoom:3} },
        // Latin America nuance
        { n: 'Mr. Stickman', i: 'assets/standing.png', t: 'Social bonds & community life can offset middling infrastructure; inequality still a drag.', a: () => {}, fly:{focus:la, zoom:3.2} },
        { n: 'Mr. Stickman', i: 'assets/hello.png', t: 'Outliers = spice: too few bland, too many chaos.', a: () => {}, fly:{center:[10,40], zoom:2.2} },
        // outlier causes
        { n: 'Mr. Stickman', i: 'assets/hello.png', t: 'Outlier reasons: new policy pushes, cultural resilience, diaspora money, or just data noise.', a: () => {}, fly:{center:[5,60], zoom:2.4} },
        { n: 'Mr. Stickman', i: 'assets/hello.png', t: 'Some mid internet yet ok happiness (other strengths maybe).', a: () => { drawCircles(ex); focusOn(ex); }, fly:{focus:ex, zoom:3} },
        // limitations / caution
        { n: 'Mr. Stickman', i: 'assets/confused.png', t: 'Limits: self-report survey, different samples, year timing, correlation not causation.', a: () => {}, fly:{center:[15,-20], zoom:2.3} },
        { n: 'Mr. Stickman', i: 'assets/hurray.png', t: 'Access helps but not everything.', a: () => { drawCircles(); fitAll(0.05); }, fly:{fitAll:true} }
    ];
}

function setupButtons() {
    prevBtn.onclick = () => { goTo(currentIndex - 1); shakeChar(); };
    nextBtn.onclick = () => { goTo(currentIndex + 1); shakeChar(); };
    // play / pause autoplay
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.onclick = () => { toggleAutoplay(); };
    }
    window.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === ' ') { fastForwardOrNext(); shakeChar(); }
        else if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); shakeChar(); }
    });
}

function goTo(i) {
    if (i < 0 || i >= chapters.length) return;
    currentIndex = i;
    let c = chapters[currentIndex];
    dialogueName.textContent = c.n;
    startTypewriter(c.t);
    if (c.i) {
        charImg.src = c.i;
        charImg.style.display = 'block';
    } else {
        charImg.style.display = 'none';
    }
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === chapters.length - 1;
    c.a();
    runFly(c);
}

function startTypewriter(str) {
    clearInterval(typeTimer);
    fullLine = str;
    charIndex = 0;
    typing = true;
    dialogueText.textContent = '';
    typeTimer = setInterval(() => {
        if (charIndex >= fullLine.length) {
            clearInterval(typeTimer);
            typing = false;
            return;
        }
        dialogueText.textContent += fullLine.charAt(charIndex);
        charIndex++;
    }, 25);
}

function fastForwardOrNext() {
    if (typing) {
        clearInterval(typeTimer);
        dialogueText.textContent = fullLine;
        typing = false;
    } else {
        goTo(currentIndex + 1);
    }
}

function shakeChar() {
    if (charImg.style.display === 'none') return;
    charImg.classList.remove('stick-shake');
    void charImg.offsetWidth; // restart animation
    charImg.classList.add('stick-shake');
}

function fitAll(pad) {
    if (!dataList.length) return;
    let b = L.latLngBounds();
    for (let i = 0; i < dataList.length; i++) {
        b.extend([dataList[i].lat, dataList[i].lon]);
    }
    map.fitBounds(b.pad(pad == null ? 0.05 : pad));
}

function drawCircles(highlightList) {
    circleLayer.clearLayers();
    let set = null;
    if (Array.isArray(highlightList)) {
        set = {};
        for (let i = 0; i < highlightList.length; i++) set[highlightList[i]] = true;
    }
    for (let i = 0; i < dataList.length; i++) {
        let d = dataList[i];
        let highlight = set ? !!set[d.country] : true;
        let base = 4 + (d.internet / 100) * 10;
        let r = highlight ? base + 4 : base;
        let op = highlight ? 0.9 : 0.25;
        let stroke = highlight ? '#111' : '#555';
        let col = colorFor(d.happiness);
        let circle = L.circleMarker([d.lat, d.lon], {
            radius: r,
            color: stroke,
            weight: highlight ? 2 : 1,
            fillColor: col,
            fillOpacity: op
        }).bindPopup('<b>' + d.country + '</b><br>Internet %: ' + d.internet + '<br>Happiness: ' + d.happiness);
        circleLayer.addLayer(circle);
    }
}

function colorFor(v) {
    if (v < 4) return '#2b6cb0';
    if (v < 5) return '#38a169';
    if (v < 6) return '#88c057';
    if (v < 7) return '#f6ad55';
    return '#e53e3e';
}

function calcCorrelation() {
    if (dataList.length < 2) return 0;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < dataList.length; i++) {
        sumX += dataList[i].internet;
        sumY += dataList[i].happiness;
    }
    let meanX = sumX / dataList.length;
    let meanY = sumY / dataList.length;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < dataList.length; i++) {
        let dx = dataList[i].internet - meanX;
        let dy = dataList[i].happiness - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
    }
    if (denX > 0 && denY > 0) return num / Math.sqrt(denX * denY);
    return 0;
}

function focusOn(list) {
    if (!Array.isArray(list) || !list.length) return;
    let set = {};
    for (let i = 0; i < list.length; i++) set[list[i]] = true;
    let b = L.latLngBounds();
    let count = 0;
    for (let i = 0; i < dataList.length; i++) {
        let d = dataList[i];
        if (set[d.country]) { b.extend([d.lat, d.lon]); count++; }
    }
    if (count) map.fitBounds(b.pad(0.4));
}

// --- Fly / tour helper ---
function runFly(chapter){
    if(!chapter || !chapter.fly) return;
    const f = chapter.fly;
    if(f.fitAll){
        fitAll(0.05);
        return;
    }
    if(f.focus && Array.isArray(f.focus) && f.focus.length){
        // compute bounds and fly
        let set={}; f.focus.forEach(n=>set[n]=1);
        let b=L.latLngBounds(); let count=0;
        for(let i=0;i<dataList.length;i++){ let d=dataList[i]; if(set[d.country]){ b.extend([d.lat,d.lon]); count++; } }
        if(count){
            let z = f.zoom || 3;
            // approximate center
            const center = b.getCenter();
            map.flyTo(center, z, { duration: 1.4 });
        }
        return;
    }
    if(f.center){
        map.flyTo(f.center, f.zoom || 2.5, { duration: 1.4 });
    }
}

// --- Autoplay (time-based animation) ---
function toggleAutoplay(){
    autoplay = !autoplay;
    const btn = document.getElementById('playBtn');
    if(btn) btn.textContent = autoplay ? 'Pause' : 'Play';
    if(autoplay && !navShown){ showNavButtons(); }
    if(autoplay){
        queueNext();
    } else {
        clearTimeout(autoplayTimer); autoplayTimer=null;
    }
}
function queueNext(){
    clearTimeout(autoplayTimer);
    if(!autoplay) return;
    autoplayTimer = setTimeout(()=>{
        if(currentIndex < chapters.length -1){
            goTo(currentIndex+1);
            queueNext();
        } else {
            autoplay = false;
            const btn = document.getElementById('playBtn');
            if(btn) btn.textContent = 'Play';
        }
    }, autoplayDelay);
}

// --- Simple plugin-like registry (demonstration) ---
const StoryMap = {
    chapters: () => chapters.slice(),
    current: () => ({ index: currentIndex, chapter: chapters[currentIndex] }),
    go: i => goTo(i),
    next: () => goTo(currentIndex+1),
    prev: () => goTo(currentIndex-1)
};
window.StoryMap = StoryMap; // exposed for console experimentation

function showNavButtons(){
    navShown = true;
    if(prevBtn.style.display==='none') prevBtn.style.display='inline-block';
    if(nextBtn.style.display==='none') nextBtn.style.display='inline-block';
}

// ---- Simple music handling (kept minimal) ----
function tryMusicLater() {
    setTimeout(() => { if (!musicStarted && !musicHintShown) showMusicHint(); }, 3000);
}

window.onYouTubeIframeAPIReady = function () {
    musicPlayer = new YT.Player('bgMusic', {
        videoId: 'jQ5ZBZc2Crs',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1, loop: 1, playlist: 'jQ5ZBZc2Crs' },
        events: {
            onReady: () => attemptPlayMusic(),
            onStateChange: e => { if (e.data === YT.PlayerState.PLAYING) { musicStarted = true; hideMusicHint(); } }
        }
    });
};

function attemptPlayMusic() {
    if (!musicPlayer) return;
    try { musicPlayer.setVolume(5); musicPlayer.playVideo(); } catch (e) { }
}

function showMusicHint() {
    musicHintShown = true;
    let box = document.createElement('div');
    box.id = 'musicHint';
    box.textContent = 'Enable music';
    Object.assign(box.style, {
        position: 'fixed', bottom: '8px', left: '8px', padding: '6px 10px',
        background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px',
        border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', zIndex: 9999,
        fontFamily: "'Press Start 2P', Arial, sans-serif"
    });
    box.onclick = () => { attemptPlayMusic(); setTimeout(hideMusicHint, 800); };
    document.body.appendChild(box);
}

function hideMusicHint() {
    let el = document.getElementById('musicHint');
    if (el) el.remove();
}
