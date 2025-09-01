/**
 * @type {L.Map} The Leaflet map object
 */
let map;                    // The map object

/**
 * @type {Array<Object>} List of all countries with their data
 */
let countries = [];         // List of all countries with their data

/**
 * @type {Object<string, {internet: number, lat: number, lng: number}>} 
 * Stores internet usage data keyed by country name
 */
let internetData = {};      // Store internet data by country name

/**
 * @type {Object<string, number>} 
 * Stores happiness scores keyed by country name
 */
let happinessData = {};     // Store happiness data by country name

/**
 * @type {Array<Object>} Array of story steps, each containing character, text, image, action, mapView
 */
let storySteps = [];        // All the story steps

/**
 * @type {number} Index of the current story step
 */
let currentStep = 0;        // Which step we're on now

/**
 * @type {L.LayerGroup} Layer to hold all country markers
 */
let markers;                // Layer to hold all the circles

/**
 * @type {boolean} Flag indicating whether autoplay is running
 */
let isAutoPlaying = false;  // Is autoplay running?

/**
 * @type {number|null} Timer ID for autoplay
 */
let autoTimer = null;       // Timer for autoplay

/**
 * @type {boolean} Flag for whether typing animation is running
 */
let isTyping = false;

/**
 * @type {string} The text currently being typed in typing animation
 */
let textToType = '';

/**
 * @type {number} Current letter index in typing animation
 */
let letterIndex = 0;

/**
 * @type {number|null} Timer ID for typing animation
 */
let typeTimer = null;

// Start everything when page loads
startApp();

/**
 * Initializes the app: creates map, sets up buttons, and starts background music later
 */
function startApp() {
    createMap();
    setupButtons();
    setTimeout(tryStartMusic, 3000);
}

/**
 * Creates a Leaflet map and marker layer
 */
function createMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 6,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
}

/**
 * Processes internet usage data from CSV
 * Stores internet percentage and coordinates for each country
 */
function processInternetData(data) {
    data.forEach(function(row) {
        // Check if row has required country and internet data
        if (row["Country"] && row["PctOfPopulationUsingInternet"]) {
            var country = row["Country"].trim();
            var internetPct = parseFloat(row["PctOfPopulationUsingInternet"]);
            
            // Store internet data
            internetData[country] = {
                internet: internetPct,
                lat: parseFloat(row["Latitude"]) || null,
                lng: parseFloat(row["Longitude"]) || null
            };
        }
    });
}

/**
 * Processes happiness report data from CSV
 * Stores happiness scores for each country
 */
function processHappinessData(data) {
    data.forEach(function(row) {
        // Check if row has required country and happiness data
        if (row["Country"] && row["Ladder score"]) {
            var country = row["Country"].trim();
            var happinessScore = parseFloat(row["Ladder score"]);
            
            // Store happiness data
            happinessData[country] = happinessScore;
        }
    });
}

/**
 * Combines internet and happiness data into final countries array
 * Only includes countries that have both internet and happiness data
 */
function combineDataAndStartStory() {
    // Go through all countries with internet data
    Object.keys(internetData).forEach(function(countryName) {
        var internetInfo = internetData[countryName];
        var happinessScore = happinessData[countryName];
        
        // Only add if we have all required data
        if (happinessScore && internetInfo.lat && internetInfo.lng) {
            countries.push({
                name: countryName,
                internet: internetInfo.internet,
                happiness: happinessScore,
                lat: internetInfo.lat,
                lng: internetInfo.lng
            });
        }
    });
    
    // Now create the story and start
    createStorySteps();
    showStep(0);
}

/**
 * Creates all the story steps with characters, text, images, actions, and map views
 */
function createStorySteps() {
    // Define groups of countries for the story
    let richCountries = ['United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'Canada'];
    let poorCountries = ['Ethiopia', 'DR Congo', 'Niger', 'Madagascar', 'Afghanistan', 'Kenya'];
    let latinCountries = ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia'];
    let interestingCountries = ['Uzbekistan', 'Vietnam', 'Philippines'];
    
    // Calculate correlation between internet and happiness
    let correlation = calculateCorrelation();
    
    // Create all the story steps
    storySteps = [
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Welcome! Click Play to start the tour, or use Next/Prev buttons.',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { center: [20, 0], zoom: 2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Here are all countries: circle size = internet %, color = happiness level.',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { fitAll: true }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'The correlation is about ' + correlation.toFixed(2) + ' - a soft positive link.',
            action: function() { showAllCountries(); },
            mapView: { center: [25, 10], zoom: 2.5 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Why any connection? Internet often comes with money, schools, healthcare & stable power.',
            action: function() {},
            mapView: { center: [35, 15], zoom: 2.3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hurray.png',
            text: 'Rich countries show up brighter and bigger.',
            action: function() { showSpecificCountries(richCountries); focusOnCountries(richCountries); },
            mapView: { focus: richCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'These are innovation hubs with strong economies, education and services.',
            action: function() {},
            mapView: { focus: richCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Lower internet access countries tend to be less happy too.',
            action: function() { showSpecificCountries(poorCountries); focusOnCountries(poorCountries); },
            mapView: { focus: poorCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Reasons: high cost, rural isolation, weak infrastructure, conflict, unreliable electricity.',
            action: function() {},
            mapView: { focus: poorCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Latin America shows moderate internet but decent happiness levels.',
            action: function() { showSpecificCountries(latinCountries); focusOnCountries(latinCountries); },
            mapView: { focus: latinCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Strong social bonds and community can offset weaker infrastructure.',
            action: function() {},
            mapView: { focus: latinCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Some countries are outliers - they break the pattern.',
            action: function() {},
            mapView: { center: [10, 40], zoom: 2.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Reasons could be: new policies, cultural strengths, or just data quirks.',
            action: function() {},
            mapView: { center: [5, 60], zoom: 2.4 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Some have medium internet but good happiness - other factors matter!',
            action: function() { showSpecificCountries(interestingCountries); focusOnCountries(interestingCountries); },
            mapView: { focus: interestingCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Remember: surveys can be subjective, and correlation doesn\'t mean causation.',
            action: function() {},
            mapView: { center: [15, -20], zoom: 2.3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hurray.png',
            text: 'Internet access helps quality of life, but it\'s not everything!',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { fitAll: true }
        }
    ];
}

/**
 * Sets up button click handlers and keyboard navigation
 */
function setupButtons() {
    // Get button elements
    let prevButton = document.getElementById('prevBtn');
    let nextButton = document.getElementById('nextBtn');
    let playButton = document.getElementById('playBtn');
    
    // Set up button clicks
    prevButton.onclick = function() {
        showStep(currentStep - 1);
        animateCharacter();
    };
    
    nextButton.onclick = function() {
        showStep(currentStep + 1);
        animateCharacter();
    };
    
    playButton.onclick = function() {
        toggleAutoPlay();
    };
    
    // Set up keyboard controls
    window.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowRight' || event.key === ' ') {
            skipTypingOrNext();
            animateCharacter();
        } else if (event.key === 'ArrowLeft') {
            showStep(currentStep - 1);
            animateCharacter();
        }
    });
}

/**
 * Shows a story step by index
 * @param {number} stepNumber - Index of the step to show
 */
function showStep(stepNumber) {
    // Make sure step number is valid
    if (stepNumber < 0 || stepNumber >= storySteps.length) {
        return;
    }
    
    currentStep = stepNumber;
    let step = storySteps[currentStep];
    
    // Update character and dialogue
    document.getElementById('dialogueName').textContent = step.character;
    startTypingAnimation(step.text);
    
    // Update character image
    let characterImage = document.getElementById('charImg');
    if (step.image) {
        characterImage.src = step.image;
        characterImage.style.display = 'block';
    } else {
        characterImage.style.display = 'none';
    }
    
    // Enable/disable navigation buttons
    document.getElementById('prevBtn').disabled = (currentStep === 0);
    document.getElementById('nextBtn').disabled = (currentStep === storySteps.length - 1);
    
    // Run the step's action
    step.action();
    
    // Move the map
    moveMap(step);
}

/**
 * Starts typing animation for a given text in dialogue
 * @param {string} text - Text to display with typing animation
 */
function startTypingAnimation(text) {
    // Stop any current typing
    clearInterval(typeTimer);
    
    textToType = text;
    letterIndex = 0;
    isTyping = true;
    
    let dialogueElement = document.getElementById('dialogueText');
    dialogueElement.textContent = '';
    
    // Type one letter every 25 milliseconds
    typeTimer = setInterval(function() {
        if (letterIndex >= textToType.length) {
            clearInterval(typeTimer);
            isTyping = false;
            return;
        }
        
        dialogueElement.textContent += textToType.charAt(letterIndex);
        letterIndex++;
    }, 25);
}

/**
 * Skips current typing animation or moves to the next step
 */
function skipTypingOrNext() {
    if (isTyping) {
        // Skip typing animation and show full text
        clearInterval(typeTimer);
        document.getElementById('dialogueText').textContent = textToType;
        isTyping = false;
    } else {
        // Go to next step
        showStep(currentStep + 1);
    }
}

/**
 * Animates the character image by restarting CSS animation
 */
function animateCharacter() {
    let characterImage = document.getElementById('charImg');
    if (characterImage.style.display === 'none') {
        return;
    }
    
    // Remove animation class and re-add it to restart animation
    characterImage.classList.remove('stick-shake');
    characterImage.offsetWidth; // Force browser to recalculate
    characterImage.classList.add('stick-shake');
}

/**
 * Displays markers for all countries
 */
function showAllCountries() {
    markers.clearLayers();
    
    countries.forEach(function(country) {
        createCountryMarker(country, true); // true = highlight this country
    });
}

/**
 * Displays markers for specific highlighted countries
 * @param {Array<string>} countryList - List of country names to highlight
 */
function showSpecificCountries(countryList) {
    markers.clearLayers();
    
    // Create lookup for highlighted countries
    let highlightedCountries = {};
    countryList.forEach(function(name) {
        highlightedCountries[name] = true;
    });
    
    countries.forEach(function(country) {
        let isHighlighted = highlightedCountries[country.name];
        createCountryMarker(country, isHighlighted);
    });
}

/**
 * Creates a marker for a single country
 * @param {Object} country - Country data object
 * @param {string} country.name - Country name
 * @param {number} country.internet - Internet usage percentage
 * @param {number} country.happiness - Happiness score
 * @param {number} country.lat - Latitude
 * @param {number} country.lng - Longitude
 * @param {boolean} isHighlighted - Whether the country is highlighted
 */
function createCountryMarker(country, isHighlighted) {
    let baseSize = 4 + (country.internet / 100) * 10;
    let circleSize = isHighlighted ? baseSize + 4 : baseSize;
    let opacity = isHighlighted ? 0.9 : 0.25;
    let strokeColor = isHighlighted ? '#111' : '#555';
    let strokeWeight = isHighlighted ? 2 : 1;
    let circleColor = getHappinessColor(country.happiness);
    
    let circle = L.circleMarker([country.lat, country.lng], {
        radius: circleSize,
        color: strokeColor,
        weight: strokeWeight,
        fillColor: circleColor,
        fillOpacity: opacity
    });
    
    // Add popup with country info
    circle.bindPopup(
        '<b>' + country.name + '</b><br>' +
        'Internet Usage: ' + country.internet + '%<br>' +
        'Happiness Score: ' + country.happiness
    );
    
    markers.addLayer(circle);
}

/**
 * Returns a color corresponding to a happiness score
 * @param {number} happinessScore - Happiness score of the country
 * @returns {string} Hex color string
 */
function getHappinessColor(happinessScore) {
    if (happinessScore < 4) return '#2b6cb0';      // Blue (low happiness)
    if (happinessScore < 5) return '#38a169';      // Green
    if (happinessScore < 6) return '#88c057';      // Light green
    if (happinessScore < 7) return '#f6ad55';      // Orange
    return '#e53e3e';                              // Red (high happiness)
}

/**
 * Calculates Pearson correlation between internet usage and happiness
 * @returns {number} Correlation value between -1 and 1
 */
function calculateCorrelation() {
    if (countries.length < 2) return 0;
    
    // Calculate averages
    let totalInternet = 0;
    let totalHappiness = 0;
    countries.forEach(function(country) {
        totalInternet += country.internet;
        totalHappiness += country.happiness;
    });
    let avgInternet = totalInternet / countries.length;
    let avgHappiness = totalHappiness / countries.length;
    
    // Calculate correlation components
    let numerator = 0;
    let internetVariance = 0;
    let happinessVariance = 0;
    
    countries.forEach(function(country) {
        let internetDiff = country.internet - avgInternet;
        let happinessDiff = country.happiness - avgHappiness;
        
        numerator += internetDiff * happinessDiff;
        internetVariance += internetDiff * internetDiff;
        happinessVariance += happinessDiff * happinessDiff;
    });
    
    // Return final correlation value
    if (internetVariance > 0 && happinessVariance > 0) {
        return numerator / Math.sqrt(internetVariance * happinessVariance);
    }
    return 0;
}

/**
 * Creates the story steps for the interactive map journey.
 *
 * Defines groups of countries (rich, poor, Latin America, and interesting cases).
 * Calculates correlation between internet usage and happiness.
 * Populates the "storySteps" array with characters, dialogue, actions, and map views.
 * @returns {void}
 */
function createStorySteps() {
    // Define groups of countries for the story
    let richCountries = ['United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'Canada'];
    let poorCountries = ['Ethiopia', 'DR Congo', 'Niger', 'Madagascar', 'Afghanistan', 'Kenya'];
    let latinCountries = ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia'];
    let interestingCountries = ['Uzbekistan', 'Vietnam', 'Philippines'];
    
    // Calculate correlation between internet and happiness
    let correlation = calculateCorrelation();
    
    // Create all the story steps
    storySteps = [
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Welcome! Click Play to start the tour, or use Next/Prev buttons.',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { center: [20, 0], zoom: 2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Here are all countries: circle size = internet %, color = happiness level.',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { fitAll: true }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'The correlation is about ' + correlation.toFixed(2) + ' - a soft positive link.',
            action: function() { showAllCountries(); },
            mapView: { center: [25, 10], zoom: 2.5 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Why any connection? Internet often comes with money, schools, healthcare & stable power.',
            action: function() {},
            mapView: { center: [35, 15], zoom: 2.3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hurray.png',
            text: 'Rich countries show up brighter and bigger.',
            action: function() { showSpecificCountries(richCountries); focusOnCountries(richCountries); },
            mapView: { focus: richCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'These are innovation hubs with strong economies, education and services.',
            action: function() {},
            mapView: { focus: richCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Lower internet access countries tend to be less happy too.',
            action: function() { showSpecificCountries(poorCountries); focusOnCountries(poorCountries); },
            mapView: { focus: poorCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Reasons: high cost, rural isolation, weak infrastructure, conflict, unreliable electricity.',
            action: function() {},
            mapView: { focus: poorCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Latin America shows moderate internet but decent happiness levels.',
            action: function() { showSpecificCountries(latinCountries); focusOnCountries(latinCountries); },
            mapView: { focus: latinCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/standing.png',
            text: 'Strong social bonds and community can offset weaker infrastructure.',
            action: function() {},
            mapView: { focus: latinCountries, zoom: 3.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Some countries are outliers - they break the pattern.',
            action: function() {},
            mapView: { center: [10, 40], zoom: 2.2 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Reasons could be: new policies, cultural strengths, or just data quirks.',
            action: function() {},
            mapView: { center: [5, 60], zoom: 2.4 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hello.png',
            text: 'Some have medium internet but good happiness - other factors matter!',
            action: function() { showSpecificCountries(interestingCountries); focusOnCountries(interestingCountries); },
            mapView: { focus: interestingCountries, zoom: 3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/confused.png',
            text: 'Remember: surveys can be subjective, and correlation doesn\'t mean causation.',
            action: function() {},
            mapView: { center: [15, -20], zoom: 2.3 }
        },
        {
            character: 'Mr. Stickman',
            image: 'assets/hurray.png',
            text: 'Internet access helps quality of life, but it\'s not everything!',
            action: function() { showAllCountries(); fitMapToAllCountries(); },
            mapView: { fitAll: true }
        }
    ];
}

/**
 * Sets up navigation controls:
 * Handles clicks for Previous, Next, and Play buttons.
 * Adds keyboard shortcuts (Arrow keys and Spacebar).
 * @returns {void}
 */
function setupButtons() {
    // Get button elements
    let prevButton = document.getElementById('prevBtn');
    let nextButton = document.getElementById('nextBtn');
    let playButton = document.getElementById('playBtn');
    
    // Set up button clicks
    prevButton.onclick = function() {
        showStep(currentStep - 1);
        animateCharacter();
    };
    
    nextButton.onclick = function() {
        showStep(currentStep + 1);
        animateCharacter();
    };
    
    playButton.onclick = function() {
        toggleAutoPlay();
    };
    
    // Set up keyboard controls
    window.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowRight' || event.key === ' ') {
            skipTypingOrNext();
            animateCharacter();
        } else if (event.key === 'ArrowLeft') {
            showStep(currentStep - 1);
            animateCharacter();
        }
    });
}

/**
 * Displays a specific step of the story based on the step index.
 * @param {number} stepNumber - Index of the story step to display. Must be between 0 and storySteps.length - 1.
 * @returns {void}
 */
function showStep(stepNumber) {
    // Make sure step number is valid
    if (stepNumber < 0 || stepNumber >= storySteps.length) {
        return;
    }
    
    currentStep = stepNumber;
    let step = storySteps[currentStep];
    
    // Update character and dialogue
    document.getElementById('dialogueName').textContent = step.character;
    startTypingAnimation(step.text);
    
    // Update character image
    let characterImage = document.getElementById('charImg');
    if (step.image) {
        characterImage.src = step.image;
        characterImage.style.display = 'block';
    } else {
        characterImage.style.display = 'none';
    }
    
    // Enable/disable navigation buttons
    document.getElementById('prevBtn').disabled = (currentStep === 0);
    document.getElementById('nextBtn').disabled = (currentStep === storySteps.length - 1);
    
    // Run the step's action
    step.action();
    
    // Move the map
    moveMap(step);
}

/**
 * Starts a typing animation for the given dialogue text.
 * @param {string} text - Dialogue text to animate letter-by-letter, e.g., "Welcome to the story!"
 * @returns {void}
 */
function startTypingAnimation(text) {
    // Stop any current typing
    clearInterval(typeTimer);
    
    textToType = text;
    letterIndex = 0;
    isTyping = true;
    
    let dialogueElement = document.getElementById('dialogueText');
    dialogueElement.textContent = '';
    
    // Type one letter every 25 milliseconds
    typeTimer = setInterval(function() {
        if (letterIndex >= textToType.length) {
            clearInterval(typeTimer);
            isTyping = false;
            return;
        }
        
        dialogueElement.textContent += textToType.charAt(letterIndex);
        letterIndex++;
    }, 25);
}

/**
 * Skips the current typing animation and shows the full dialogue immediately.
 * If the text is already fully displayed, moves to the next story step.
 * @returns {void}
 */
function skipTypingOrNext() {
    if (isTyping) {
        // Skip typing animation and show full text
        clearInterval(typeTimer);
        document.getElementById('dialogueText').textContent = textToType;
        isTyping = false;
    } else {
        // Go to next step
        showStep(currentStep + 1);
    }
}

/**
 * Triggers the character shake animation.
 * Restarts the CSS animation by removing and re-adding the `stick-shake` class.
 * @returns {void}
 */
function animateCharacter() {
    let characterImage = document.getElementById('charImg');
    if (characterImage.style.display === 'none') {
        return;
    }
    
    // Remove animation class and re-add it to restart animation
    characterImage.classList.remove('stick-shake');
    characterImage.offsetWidth; // Force browser to recalculate
    characterImage.classList.add('stick-shake');
}

/**
 * Fits the map view to show all countries
 */
function fitMapToAllCountries() {
    if (countries.length === 0) return;
    
    let bounds = L.latLngBounds();
    countries.forEach(function(country) {
        bounds.extend([country.lat, country.lng]);
    });
    map.fitBounds(bounds.pad(0.05));
}
/**
 * Focuses the map on a given list of countries
 * @param {Array<string>} countryList - Country names to focus on
 */
function focusOnCountries(countryList) {
    if (!countryList || countryList.length === 0) return;
    
    let bounds = L.latLngBounds();
    let foundCountries = 0;
    
    countries.forEach(function(country) {
        if (countryList.includes(country.name)) {
            bounds.extend([country.lat, country.lng]);
            foundCountries++;
        }
    });
    
    if (foundCountries > 0) {
        map.fitBounds(bounds.pad(0.4));
    }
}
/**
 * Moves the map based on the step's mapView configuration
 * @param {Object} step - Step object containing mapView
 */
function moveMap(step) {
    if (!step.mapView) return;
    
    let view = step.mapView;
    
    if (view.fitAll) {
        fitMapToAllCountries();
        return;
    }
    
    if (view.focus && view.focus.length > 0) {
        let bounds = L.latLngBounds();
        let foundCountries = 0;
        
        countries.forEach(function(country) {
            if (view.focus.includes(country.name)) {
                bounds.extend([country.lat, country.lng]);
                foundCountries++;
            }
        });
        
        if (foundCountries > 0) {
            let center = bounds.getCenter();
            let zoom = view.zoom || 3;
            map.flyTo(center, zoom, { duration: 1.4 });
        }
        return;
    }
    
    if (view.center) {
        map.flyTo(view.center, view.zoom || 2.5, { duration: 1.4 });
    }
}
/**
 * Toggles autoplay on/off
 */
function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    
    let playButton = document.getElementById('playBtn');
    if (playButton) {
        playButton.textContent = isAutoPlaying ? 'Pause' : 'Play';
    }
    
    if (isAutoPlaying) {
        showNavigationButtons();
        scheduleNextStep();
    } else {
        clearTimeout(autoTimer);
        autoTimer = null;
    }
}
/**
 * Schedules the next story step in autoplay mode
 */
function scheduleNextStep() {
    clearTimeout(autoTimer);
    if (!isAutoPlaying) return;
    
    autoTimer = setTimeout(function() {
        if (currentStep < storySteps.length - 1) {
            showStep(currentStep + 1);
            scheduleNextStep();
        } else {
            isAutoPlaying = false;
            let playButton = document.getElementById('playBtn');
            if (playButton) {
                playButton.textContent = 'Play';
            }
        }
    }, 3500);
}
/**
 * Ensures navigation buttons are visible
 */
function showNavigationButtons() {
    let prevButton = document.getElementById('prevBtn');
    let nextButton = document.getElementById('nextBtn');
    
    if (prevButton.style.display === 'none') {
        prevButton.style.display = 'inline-block';
    }
    if (nextButton.style.display === 'none') {
        nextButton.style.display = 'inline-block';
    }
}
/**
 * Displays a hint to enable background music
 */
function tryStartMusic() {
    let hint = document.createElement('div');
    hint.id = 'musicHint';
    hint.textContent = 'Enable music';
    hint.style.cssText = `
        position: fixed; bottom: 8px; left: 8px; padding: 6px 10px;
        background: rgba(0,0,0,0.55); color: #fff; font-size: 11px;
        border: 1px solid #444; border-radius: 4px; cursor: pointer; z-index: 9999;
        font-family: 'Press Start 2P', Arial, sans-serif;
    `;
    hint.onclick = function() {
        startBackgroundMusic();
        hint.remove();
    };
    document.body.appendChild(hint);
}
/**
 * Starts background music
 */
function startBackgroundMusic() {
    let hint = document.getElementById('musicHint');
    if (hint) hint.remove();
}

/**
 * Loads and processes internet usage CSV data
 * Fetches internet usage CSV file, parses it, and processes the data
 */
fetch('internet-users-by-country-2024.csv')
    .then(response => response.text())
    .then(csvText => {
        // Parse CSV with headers and automatic type conversion
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processInternetData(results.data); // Process the parsed data
    })
    .catch(error => console.error('Error loading internet data:', error));

/**
 * Loads and processes happiness report CSV data
 * Fetches World Happiness Report CSV file, parses it, and processes the data
 */
fetch('WHR24_Data_Figure_2.1.csv')
    .then(response => response.text())
    .then(csvText => {
        // Parse CSV with headers and automatic type conversion
        var results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        processHappinessData(results.data); // Process the parsed data
        
        // After both files are loaded, combine and start story
        combineDataAndStartStory();
    })
    .catch(error => console.error('Error loading happiness data:', error));