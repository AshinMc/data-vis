# Happiness Index vs Internet Users

## Description
Interactive web-based visualization exploring the relationship between internet usage rates and happiness scores across countries worldwide. The project combines choropleth mapping to show happiness levels by country with clustered markers indicating internet usage percentages, plus detailed statistical analysis including correlation, regression, spatial clustering, and local relationship modeling. Features an interactive story mode with guided tour narration.

## Setup Instructions

### Recommended Browser Versions
- Chrome (version 90 or later; tested up to version 139)
- Firefox (version 88 or later)
- Safari (version 14 or later)
- Microsoft Edge (version 90 or later)

**Note:**  
The project will open in your system's default browser when using a local server.  
If you prefer to test it in a different browser (e.g., Edge instead of Chrome), simply copy the local server URL (e.g., `http://127.0.0.1:5500/index.html`) and paste it into the browser of your choice.

### How to Run Locally
Due to CORS restrictions when loading CSV files, a local server is required:

**Note:** The project requires an **internet connection** because it loads libraries (Leaflet, D3.js, Papa Parse, etc.) and some GeoJSON data from external CDNs. 
**VS Code: Live Server extension**
1. Install Live Server extension
2. Right-click on index.html and select "Open with Live Server"

**Browser extensions for local file serving**
- Web Server for Chrome
- Local File Server extensions

### CORS Considerations
The project loads external GeoJSON data and local CSV files. Opening index.html directly (file://) will cause CORS errors. Always use a local server for proper functionality.

## File Structure

### Main Files
- **index.html** — Main visualization page with interactive world map
- **index.js** — Core JavaScript for map functionality and data processing
- **story.html** — Interactive story mode with guided tour narration
- **story.js** — Story mode functionality, autoplay, and character animations
- **Task 5.html** — Exploratory data analysis with combined Leaflet visualization

### Data Files
- **internet-users-by-country-2024.csv** — Country internet usage percentages with latitude/longitude coordinates
- **WHR24_Data_Figure_2.1.csv** — World Happiness Report 2024 country happiness ladder scores

## Library Requirements

### Leaflet (Map Visualization)
- **Leaflet.js**: v1.9+
- **Leaflet MarkerCluster**: v1.4.1
- CDN: unpkg.com

### D3.js (Statistical Visualization)
- **D3.js**: v7
- CDN: d3js.org

### Additional Libraries
- **Papa Parse**: v5.3.2+ for CSV parsing
- **Simple Statistics**: v7.8.0+ for statistical calculations
- **YouTube IFrame API**: For background music in story mode

## Usage

### Main Map Interface (index.html)
- **Country polygons**: Hover or click for happiness score details (colored green for high happiness, red for low)
- **Circular markers**: Show internet usage percentages (larger circles = higher usage)
- **Layer control**: Use top-right control to toggle between "Happiness by Country" and "Internet Usage Markers"
- **Legends**: Bottom-right shows happiness color scale, bottom-left shows internet usage size/color scale
- **Story Mode**: Click "Story ▶" button to launch guided tour

### Story Mode Interface (story.html)
- **Autoplay**: Click "AutoPlay" to start guided tour progression
- **Manual Navigation**: Use Previous/Next buttons for self-paced exploration
- **Keyboard Controls**: 
  - Arrow Right / Spacebar: Next chapter or fast-forward typewriter
  - Arrow Left: Previous chapter
- **Map Integration**: Map automatically moves to relevant regions during narration

### Available Controls
- Pan and zoom on all map interfaces
- Click any country polygon or marker for popup information
- Toggle map layers using layer control panel
- Story mode: Play/Pause autoplay, manual navigation buttons
- All visualizations are interactive with hover and click functionality

## Data Sources

### Dataset 1: Internet Usage Statistics
**Source**: [Country-wise Internet User Statistics Dataset 2024](https://www.kaggle.com/datasets/arpitsinghaiml/country-wise-internet-user-statistics-dataset-2024?resource=download)  
**Description**: A Global Snapshot of Internet Connectivity (Removed and modified some parts to fit our purpose)
**License**: CC BY-NC-SA 4.0 (Free to use, remix, and share for non-commercial purpose)  
**Fields**: Country, PctOfPopulationUsingInternet, Latitude, Longitude

### Dataset 2: World Happiness Report
**Source**: [World Happiness Report 2024](https://www.worldhappiness.report/data-sharing/)  
**Description**: Country happiness ladder scores based on life evaluations  
**License**: stated the data is freely available to the public ( No specific licenses mentioned) 
**Fields**: Country, Ladder score (0-10 scale)

## Known Issues and Limitations

### Data Matching
- Country name inconsistencies result in lost data points (e.g., "DR Congo" vs "Congo (Kinshasa)")
- Approximately 20-30 countries excluded due to name mismatches
- Some countries have missing or incorrect coordinate data

### Statistical Analysis
- Assumes linear relationships without formal testing
- Single year snapshot only - no temporal analysis
- Country-level data hides within-country variation
- Correlation analysis does not establish causation

### Technical Limitations
- Requires internet connection for external libraries and GeoJSON loading
- Performance may be slow on older devices with large datasets
- Mobile interface could be more touch-friendly for story mode
- External CDN dependencies create potential points of failure
- Story mode music requires user interaction to start (browser autoplay policies)

### Story Mode Limitations
- Music feature depends on YouTube embed (may be blocked by ad blockers)
- Character sprites use inline base64 or external image references
- Typewriter effect may be too fast/slow for some users (fixed timing)
- Limited browser support for some advanced CSS animations