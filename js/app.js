// app.js
// Initialize map and weather on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
  displayCleanupLocations();
  updateWeatherWidget();
  enableGeolocation();
  enableSmoothScroll();
  setupCTAButton();
});

// Leaflet map instance
let map;

// Sample cleanup locations (replace with real data or API later)
const cleanupLocations = [
  {
    id: 1,
    name: 'Bondi Beach',
    coords: [-33.8915, 151.2767],
    date: '2025-06-15',
    participants: 12,
  },
  {
    id: 2,
    name: 'Manly Beach',
    coords: [-33.7971, 151.2877],
    date: '2025-06-22',
    participants: 8,
  },
];

// Weather API configuration (using NEA data.gov.sg)
const NEA_API_BASE_URL = 'https://api.data.gov.sg/v1/environment';
const WEATHER_ICONS = {
  'Partly Cloudy (Day)': '⛅',
  'Partly Cloudy (Night)': '☁️',
  Cloudy: '☁️',
  'Light Rain': '🌦️',
  'Moderate Rain': '🌧️',
  'Heavy Rain': '⛈️',
  'Light Showers': '🌦️',
  Showers: '🌧️',
  'Heavy Showers': '⛈️',
  'Thundery Showers': '⛈️',
  'Heavy Thundery Showers': '⛈️',
  'Fair (Day)': '☀️',
  'Fair (Night)': '🌙',
  'Fair & Warm': '☀️',
  Windy: '💨',
  Mist: '🌫️',
};

// Initialize the Leaflet map
function initializeMap() {
  map = L.map('cleanup-map').setView([1.3521, 103.8198], 11); // Default to Singapore
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
}

// Place cleanup markers on the map
function displayCleanupLocations() {
  if (!map) return;
  cleanupLocations.forEach((c) => {
    const marker = L.marker(c.coords).bindPopup(`
      <h3>${c.name}</h3>
      <p>Date: ${c.date}</p>
      <p>Participants: <span id="count-${c.id}">${c.participants}</span></p>
      <button onclick="joinCleanup(${c.id})" class="join-button">
        Join Cleanup
      </button>
    `);
    marker.addTo(map);
  });
}

// Fetch weather data from NEA
async function getWeatherData() {
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${NEA_API_BASE_URL}/2-hour-weather-forecast`).then((res) =>
        res.json()
      ),
      fetch(`${NEA_API_BASE_URL}/4-day-weather-forecast`).then((res) =>
        res.json()
      ),
    ]);
    return { current: currentRes, forecast: forecastRes };
  } catch (err) {
    console.error('Error fetching weather data:', err);
    return null;
  }
}

// Map NEA forecast text to an icon
function getWeatherIcon(condition) {
  return WEATHER_ICONS[condition] || '❓';
}

// Format ISO date to "Wed, Jun 5" etc.
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Update the weather widget for Pasir Ris
async function updateWeatherWidget() {
  const widget = document.getElementById('weather-widget');
  const data = await getWeatherData();
  if (!data) {
    widget.innerHTML = '<p>Weather information temporarily unavailable</p>';
    return;
  }

  // Find Pasir Ris in area_metadata
  const areaMeta = data.current.area_metadata.find(
    (area) => area.name === 'Pasir Ris'
  );
  const areaForecast = data.current.items[0].forecasts.find(
    (f) => f.area === 'Pasir Ris'
  );
  const dailyForecasts = data.forecast.items[0].forecasts;

  widget.innerHTML = `
    <div class="weather-card">
      <div class="current-weather">
        <h3>Current Weather – Pasir Ris</h3>
        <div class="weather-icon">${getWeatherIcon(
          areaForecast.forecast
        )}</div>
        <p class="description">${areaForecast.forecast}</p>
      </div>
      <div class="forecast">
        <h4>4-Day Forecast</h4>
        <div class="forecast-container">
          ${dailyForecasts
            .map((day) => {
              return `
            <div class="forecast-day">
              <p class="date">${formatDate(day.date)}</p>
              <div class="weather-icon">${getWeatherIcon(
                day.forecast
              )}</div>
              <p class="description">${day.forecast}</p>
              <div class="temperature">
                <p class="temp-high">${day.temperature.high}°C</p>
                <p class="temp-low">${day.temperature.low}°C</p>
              </div>
              <p class="humidity">Humidity: ${day.relative_humidity.low}-${day.relative_humidity.high}%</p>
              <p class="wind">${day.wind.speed.low}-${day.wind.speed.high} km/h ${day.wind.direction}</p>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>
    </div>
  `;
}

// Handle user joining a cleanup
function joinCleanup(cleanupId) {
  const cleanup = cleanupLocations.find((c) => c.id === cleanupId);
  if (!cleanup) return;
  cleanup.participants += 1;
  document.getElementById(`count-${cleanup.id}`).textContent =
    cleanup.participants;
  alert(`You have joined the cleanup at ${cleanup.name}!`);
}

// Enable smooth scrolling for internal links
function enableSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Scroll to #map-section when CTA is clicked
function setupCTAButton() {
  const ctaButton = document.querySelector('.cta-button');
  ctaButton.addEventListener('click', () => {
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Attempt to get user location and recenter map
function enableGeolocation() {
  if (!navigator.geolocation || !map) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLatLng = [position.coords.latitude, position.coords.longitude];
      map.setView(userLatLng, 13);
      updateWeatherWidget(); // Refresh weather (still for Pasir Ris)
    },
    (err) => {
      console.warn('Geolocation failed or denied:', err);
    }
  );
}
