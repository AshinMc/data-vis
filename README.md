# Happiness Index vs Internet Users

## Description
Interactive web-based visualization exploring the relationship between internet usage rates and happiness scores across countries worldwide. The project combines choropleth mapping to show happiness levels by country with clustered markers indicating internet usage percentages, plus detailed statistical analysis including correlation, regression, spatial clustering, and local relationship modeling.

## Setup Instructions

### Required Browser Versions
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### How to Run Locally
Due to CORS restrictions when loading CSV files, a local server is required:

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
- **statistics.html** — Statistical analysis page with correlations and regression
- **statistics.js** — Statistical calculations and scatter plot visualization

### Data Files
- **internet-users-by-country-2024.csv** — Country internet usage percentages with latitude/longitude coordinates
- **WHR24_Data_Figure_2.1.csv** — World Happiness Report 2024 country happiness ladder scores

### Documentation
- **statistics-report.md** — Template for statistical analysis results

### Example Files
- **eda.html** — Exploratory data analysis example
- **mockup1.html** — Choropleth visualization example
- **mockup2.html** — Marker cluster example  
- **mockup3.html** — Multi-layer visualization example

## Library Requirements

### Leaflet (Map Visualization)
- **Leaflet.js**: v1.9+
- **Leaflet MarkerCluster**: v1.4.1
- CDN: unpkg.com

### D3.js (Statistical Visualization)
- **D3.js**: v7
- CDN: d3js.org

### Additional Libraries
- **Papa Parse**: v5.3.2 for CSV parsing
- **Simple Statistics**: v7.8.0 for statistical calculations

## Usage

### Main Map Interface (index.html)
- **Country polygons**: Hover or click for happiness score details (colored green for high happiness, red for low)
- **Circular markers**: Show internet usage percentages (larger circles = higher usage)
- **Layer control**: Use top-right control to toggle between "Happiness by Country" and "Internet Usage Markers"
- **Legends**: Bottom-right shows happiness color scale, bottom-left shows internet usage size/color scale
- **Navigation**: Click "Statistics ▶" button to access detailed analysis

### Statistical Analysis Page (statistics.html)
- **Correlation analysis**: View Pearson correlation coefficient between internet usage and happiness
- **Scatter plot**: Interactive plot showing relationship with regression line
- **Spatial clustering**: K-means clustering of countries by geographic location only
- **Local regression**: Geographically weighted analysis showing how relationship varies by region
- **Anomaly detection**: Countries that deviate most from the global trend line
- **Navigation**: Click "◀ Back" to return to main map

### Available Controls
- Pan and zoom on all map interfaces
- Click any country polygon or marker for popup information
- Toggle map layers using layer control panel
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
- Mobile interface could be more touch-friendly
- External CDN dependencies create potential points of failure
