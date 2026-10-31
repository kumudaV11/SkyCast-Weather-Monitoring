/**
 * SKYCAST — Intelligent Weather Monitoring & AWS Multi-Instance Cloud Platform
 * Client Application Logic, Visualizations, and Telemetry Engine
 */

// Application Global State
const state = {
  city: 'Bengaluru',
  unit: 'C', // 'C' | 'F'
  weatherData: null,
  forecastData: null,
  activeTab: 'tab-overview',
  charts: {
    overviewMini: null,
    forecastHourly: null,
    analyticsTemp: null,
    analyticsHumidity: null,
    analyticsWind: null,
    analyticsPrecip: null
  },
  simulatedAlbTarget: 1
};

// ==========================================
// DOM READY & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initClockAndGreeting();
  initNavigation();
  initSearchAndPills();
  initUnitToggle();
  initAlbSimulator();
  initHistoryActions();

  // Initial Load
  const searchInput = document.getElementById('city-search-input');
  const initialCity = searchInput ? searchInput.value.trim() : 'Bengaluru';
  loadWeatherData(initialCity || 'Bengaluru');
});

// ==========================================
// CLOCK, DATE & GREETING
// ==========================================
function initClockAndGreeting() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');
  const greetingEl = document.getElementById('greeting-text');

  function update() {
    const now = new Date();

    // Clock
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }

    // Date
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // Greeting
    if (greetingEl) {
      const hour = now.getHours();
      let text = 'Good Morning, Explorer';
      if (hour >= 12 && hour < 17) {
        text = 'Good Afternoon, Meteorologist';
      } else if (hour >= 17 && hour < 21) {
        text = 'Good Evening, Analyst';
      } else if (hour >= 21 || hour < 5) {
        text = 'Good Night, Stargazer';
      }
      greetingEl.textContent = text;
    }
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const panels = document.querySelectorAll('.tab-panel');
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetTab = link.getAttribute('data-tab');
      if (!targetTab) return;

      navLinks.forEach(l => l.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      link.classList.add('active');
      const targetPanel = document.getElementById(targetTab);
      if (targetPanel) {
        targetPanel.classList.add('active');
        state.activeTab = targetTab;
      }

      // Re-render charts if analytics or forecast tab became visible
      if (targetTab === 'tab-analytics' && state.forecastData) {
        renderAnalyticsCharts(state.forecastData.analytics);
      } else if (targetTab === 'tab-forecast' && state.forecastData) {
        renderForecastHourlyChart(state.forecastData.hourly);
      } else if (targetTab === 'tab-history') {
        loadSearchHistory();
      }

      // Close mobile sidebar if open
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    });
  });

  // Mobile drawer toggle
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // "View 7-Day Matrix" quick link in overview
  const viewForecastBtn = document.getElementById('view-full-forecast-btn');
  if (viewForecastBtn) {
    viewForecastBtn.addEventListener('click', () => {
      const forecastNav = document.getElementById('nav-btn-forecast');
      if (forecastNav) forecastNav.click();
    });
  }
}

// ==========================================
// SEARCH, REFRESH & POPULAR CITY PILLS
// ==========================================
function initSearchAndPills() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('city-search-input');
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshIcon = document.getElementById('refresh-icon');
  const pills = document.querySelectorAll('.city-pill');

  // Submit search
  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = input.value.trim();
      if (city) {
        loadWeatherData(city);
      }
    });
  }

  // Refresh
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (refreshIcon) refreshIcon.classList.add('spinning');
      loadWeatherData(state.city, () => {
        if (refreshIcon) refreshIcon.classList.remove('spinning');
      });
    });
  }

  // Quick city pills
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const city = pill.getAttribute('data-city');
      if (city) {
        if (input) input.value = city;
        loadWeatherData(city);
      }
    });
  });

  // Notification close
  const notifClose = document.getElementById('notif-close');
  const notifBanner = document.getElementById('notification-banner');
  if (notifClose && notifBanner) {
    notifClose.addEventListener('click', () => {
      notifBanner.classList.add('hidden');
    });
  }
}

function showNotification(msg) {
  const notifBanner = document.getElementById('notification-banner');
  const notifText = document.getElementById('notif-text');
  if (notifBanner && notifText) {
    notifText.textContent = msg;
    notifBanner.classList.remove('hidden');
  }
}

function hideNotification() {
  const notifBanner = document.getElementById('notification-banner');
  if (notifBanner) notifBanner.classList.add('hidden');
}

// ==========================================
// TEMPERATURE UNIT TOGGLE (°C / °F)
// ==========================================
function initUnitToggle() {
  const btnC = document.getElementById('unit-c');
  const btnF = document.getElementById('unit-f');

  if (btnC && btnF) {
    btnC.addEventListener('click', () => {
      if (state.unit === 'C') return;
      state.unit = 'C';
      btnC.classList.add('active');
      btnF.classList.remove('active');
      refreshAllTemperatureDisplays();
    });

    btnF.addEventListener('click', () => {
      if (state.unit === 'F') return;
      state.unit = 'F';
      btnF.classList.add('active');
      btnC.classList.remove('active');
      refreshAllTemperatureDisplays();
    });
  }
}

function toDisplayTemp(celsiusVal) {
  if (celsiusVal === null || celsiusVal === undefined || isNaN(celsiusVal)) return '--';
  if (state.unit === 'F') {
    return ((celsiusVal * 9/5) + 32).toFixed(1);
  }
  return Number(celsiusVal).toFixed(1);
}

function toDisplayTempInt(celsiusVal) {
  if (celsiusVal === null || celsiusVal === undefined || isNaN(celsiusVal)) return '--';
  if (state.unit === 'F') {
    return Math.round((celsiusVal * 9/5) + 32);
  }
  return Math.round(celsiusVal);
}

function refreshAllTemperatureDisplays() {
  if (state.weatherData) {
    renderCurrentWeather(state.weatherData);
  }
  if (state.forecastData) {
    renderForecastHourly(state.forecastData.hourly);
    renderForecastDaily(state.forecastData.daily);
    renderOverviewMiniChart(state.forecastData.hourly);
    if (state.activeTab === 'tab-forecast') {
      renderForecastHourlyChart(state.forecastData.hourly);
    }
    if (state.activeTab === 'tab-analytics') {
      renderAnalyticsCharts(state.forecastData.analytics);
    }
  }
}

// ==========================================
// DATA FETCHING (WEATHER & FORECAST)
// ==========================================
async function loadWeatherData(cityName, callback) {
  hideNotification();

  try {
    // 1. Fetch Current Weather
    const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    const weatherJson = await weatherRes.json();

    if (!weatherRes.ok) {
      throw new Error(weatherJson.error || 'Failed to retrieve meteorological telemetry.');
    }

    state.city = weatherJson.city;
    state.weatherData = weatherJson;
    renderCurrentWeather(weatherJson);

    // Update active state in pills if matches
    const pills = document.querySelectorAll('.city-pill');
    pills.forEach(p => {
      if (p.getAttribute('data-city').toLowerCase() === state.city.toLowerCase()) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // 2. Fetch Extended Forecast & Analytics Datasets
    const forecastRes = await fetch(`/api/forecast?city=${encodeURIComponent(cityName)}`);
    const forecastJson = await forecastRes.json();

    if (forecastRes.ok) {
      state.forecastData = forecastJson;
      renderForecastHourly(forecastJson.hourly);
      renderForecastDaily(forecastJson.daily);
      renderOverviewMiniChart(forecastJson.hourly);

      if (state.activeTab === 'tab-forecast') {
        renderForecastHourlyChart(forecastJson.hourly);
      } else if (state.activeTab === 'tab-analytics') {
        renderAnalyticsCharts(forecastJson.analytics);
      }
    }

    // 3. Update AWS host telemetry card
    if (weatherJson.instance_info) {
      updateInstanceCard(weatherJson.instance_info);
    }

  } catch (err) {
    console.error('Weather load error:', err);
    showNotification(err.message);
  } finally {
    if (callback) callback();
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

// ==========================================
// RENDER CURRENT WEATHER & 8 METRICS
// ==========================================
function renderCurrentWeather(data) {
  const current = data.current;
  const coords = data.coordinates;

  // Header & City
  const cityNameEl = document.getElementById('hero-city-name');
  const countryEl = document.getElementById('hero-country');
  const coordsEl = document.getElementById('hero-coords');
  if (cityNameEl) cityNameEl.textContent = data.city;
  if (countryEl) countryEl.textContent = data.country || 'Region';
  if (coordsEl && coords) {
    coordsEl.textContent = `Lat: ${coords.latitude.toFixed(2)}°, Lon: ${coords.longitude.toFixed(2)}°`;
  }

  // Hero Temperature & Unit
  const currentTempEl = document.getElementById('hero-current-temp');
  const tempUnitEl = document.getElementById('hero-temp-unit');
  if (currentTempEl) currentTempEl.textContent = toDisplayTemp(current.temperature);
  if (tempUnitEl) tempUnitEl.textContent = `°${state.unit}`;

  // Condition title & desc
  const condTitleEl = document.getElementById('hero-condition-title');
  const condDescEl = document.getElementById('hero-condition-desc');
  if (condTitleEl) condTitleEl.textContent = current.condition;
  if (condDescEl) condDescEl.textContent = current.description;

  // Hero Footer Pills
  const feelsLikeEl = document.getElementById('hero-feels-like');
  const highLowEl = document.getElementById('hero-high-low');
  const heroWindEl = document.getElementById('hero-wind-speed');
  const heroHumEl = document.getElementById('hero-humidity');

  if (feelsLikeEl) feelsLikeEl.textContent = `${toDisplayTemp(current.apparent_temperature)}°${state.unit}`;
  if (highLowEl) {
    highLowEl.textContent = `${toDisplayTempInt(current.temp_max)}° / ${toDisplayTempInt(current.temp_min)}°${state.unit}`;
  }
  if (heroWindEl) heroWindEl.textContent = `${current.wind_speed} km/h`;
  if (heroHumEl) heroHumEl.textContent = `${current.humidity}%`;

  // Dynamic Weather Art Illustration
  renderWeatherArt(current.weather_code, current.is_day);

  // 8 Weather Metrics Cards
  // 1. Humidity
  const metricHum = document.getElementById('metric-humidity');
  const humFill = document.getElementById('humidity-fill');
  const humNote = document.getElementById('humidity-note');
  if (metricHum) metricHum.textContent = current.humidity;
  if (humFill) humFill.style.width = `${Math.min(100, current.humidity)}%`;
  if (humNote) {
    humNote.textContent = current.humidity > 70 ? 'High atmospheric moisture' :
                          current.humidity < 35 ? 'Dry and arid atmosphere' : 'Optimal comfort zone';
  }

  // 2. Wind Speed
  const metricWind = document.getElementById('metric-wind-speed');
  const windFill = document.getElementById('wind-fill');
  const windNote = document.getElementById('wind-note');
  if (metricWind) metricWind.textContent = current.wind_speed;
  if (windFill) windFill.style.width = `${Math.min(100, (current.wind_speed / 50) * 100)}%`;
  if (windNote) {
    const s = current.wind_speed;
    windNote.textContent = s < 5 ? 'Beaufort 0: Calm air' :
                           s < 12 ? 'Beaufort 1-2: Light breeze' :
                           s < 28 ? 'Beaufort 3-4: Gentle/Moderate breeze' :
                           s < 45 ? 'Beaufort 5-6: Strong fresh breeze' : 'Beaufort 7+: High wind warning';
  }

  // 3. Wind Direction & Compass
  const compassNeedle = document.getElementById('compass-needle');
  const windDeg = document.getElementById('metric-wind-deg');
  const windCard = document.getElementById('metric-wind-cardinal');
  if (compassNeedle) compassNeedle.style.transform = `rotate(${current.wind_direction}deg)`;
  if (windDeg) windDeg.textContent = `${current.wind_direction}°`;
  if (windCard) windCard.textContent = current.wind_cardinal;

  // 4. Barometric Pressure
  const metricPress = document.getElementById('metric-pressure');
  const pressFill = document.getElementById('pressure-fill');
  const pressNote = document.getElementById('pressure-note');
  if (metricPress) metricPress.textContent = Number(current.pressure).toFixed(1);
  if (pressFill) {
    const pPercent = ((current.pressure - 970) / (1050 - 970)) * 100;
    pressFill.style.width = `${Math.max(10, Math.min(100, pPercent))}%`;
  }
  if (pressNote) {
    pressNote.textContent = current.pressure > 1020 ? 'High Pressure System (Fair Skies)' :
                            current.pressure < 1005 ? 'Low Pressure Trough (Possible Rain)' : 'Normal Sea-Level Standard';
  }

  // 5. Visibility
  const metricVis = document.getElementById('metric-visibility');
  const visFill = document.getElementById('visibility-fill');
  const visNote = document.getElementById('visibility-note');
  if (metricVis) metricVis.textContent = current.visibility;
  if (visFill) visFill.style.width = `${Math.min(100, (current.visibility / 10) * 100)}%`;
  if (visNote) {
    visNote.textContent = current.visibility >= 10 ? 'Clear Line-of-Sight (10+ km)' :
                          current.visibility >= 5 ? 'Moderate Haziness' : 'Reduced Fog / Mist Warning';
  }

  // 6. UV Index
  const metricUv = document.getElementById('metric-uv');
  const uvFill = document.getElementById('uv-fill');
  const uvNote = document.getElementById('uv-note');
  if (metricUv) metricUv.textContent = current.uv_index;
  if (uvFill) uvFill.style.width = `${Math.min(100, (current.uv_index / 12) * 100)}%`;
  if (uvNote) {
    const uv = current.uv_index;
    uvNote.textContent = uv >= 8 ? 'Very High - Sunscreen SPF 50+ Required' :
                         uv >= 6 ? 'High - Protection Advised' :
                         uv >= 3 ? 'Moderate - Sunglasses Recommended' : 'Low Solar Intensity';
  }

  // 7. Cloud Coverage
  const metricClouds = document.getElementById('metric-clouds');
  const cloudsFill = document.getElementById('clouds-fill');
  const cloudsNote = document.getElementById('clouds-note');
  if (metricClouds) metricClouds.textContent = current.cloud_cover;
  if (cloudsFill) cloudsFill.style.width = `${current.cloud_cover}%`;
  if (cloudsNote) {
    const c = current.cloud_cover;
    cloudsNote.textContent = c < 20 ? 'Clear sunny canopy' :
                             c < 60 ? 'Scattered cumulus formations' : 'Dense stratocumulus overcast';
  }

  // 8. Dew Point
  const metricDew = document.getElementById('metric-dew-point');
  const dewUnit = document.getElementById('dew-unit');
  const dewFill = document.getElementById('dew-fill');
  const dewNote = document.getElementById('dew-note');
  if (metricDew) metricDew.textContent = toDisplayTemp(current.dew_point);
  if (dewUnit) dewUnit.textContent = `°${state.unit}`;
  if (dewFill) {
    const dPercent = ((current.dew_point + 10) / 40) * 100;
    dewFill.style.width = `${Math.max(10, Math.min(100, dPercent))}%`;
  }
  if (dewNote) {
    const d = current.dew_point;
    dewNote.textContent = d > 21 ? 'Oppressive and muggy' :
                          d > 16 ? 'Noticeable moisture' : 'Crisp and comfortable humidity';
  }

  // Rule-Based Weather Insights
  renderWeatherInsights(data.insights);

  // Sunrise & Sunset Arc
  renderSunriseSunsetArc(current.raw_sunrise, current.raw_sunset, current.sunrise, current.sunset);
}

// Weather Dynamic Art Box
function renderWeatherArt(weatherCode, isDay) {
  const artBox = document.getElementById('weather-art-box');
  if (!artBox) return;

  let artHtml = '';
  // Clear or mainly clear
  if (weatherCode <= 1) {
    if (isDay) {
      artHtml = `
        <div class="art-sun-glow" style="background: radial-gradient(circle, #FDE047 0%, #F59E0B 75%); box-shadow: 0 0 40px #F59E0B;"></div>
      `;
    } else {
      artHtml = `
        <div class="art-sun-glow" style="background: radial-gradient(circle, #E2E8F0 0%, #94A3B8 75%); box-shadow: 0 0 30px #38BDF8;"></div>
        <div class="art-cloud cloud-1" style="opacity: 0.4;"></div>
      `;
    }
  } else if (weatherCode <= 3) {
    // Partly cloudy / overcast
    artHtml = `
      <div class="art-sun-glow"></div>
      <div class="art-cloud cloud-1"></div>
      <div class="art-cloud cloud-2"></div>
    `;
  } else if (weatherCode >= 51 && weatherCode <= 67 || (weatherCode >= 80 && weatherCode <= 82)) {
    // Rain
    artHtml = `
      <div class="art-cloud cloud-1" style="background: rgba(148, 163, 184, 0.9);"></div>
      <div class="art-cloud cloud-2" style="background: rgba(100, 116, 139, 0.9);"></div>
      <div style="position: absolute; bottom: 8px; left: 40px; color: #38BDF8; font-size: 1.2rem;">💧 💧 💧</div>
    `;
  } else if (weatherCode >= 95) {
    // Thunderstorm
    artHtml = `
      <div class="art-cloud cloud-1" style="background: rgba(51, 65, 85, 0.95); box-shadow: 0 0 20px #8B5CF6;"></div>
      <div style="position: absolute; bottom: 15px; left: 55px; font-size: 1.5rem; color: #FACC15; filter: drop-shadow(0 0 8px #FACC15);">⚡</div>
    `;
  } else {
    // Snow / Fog
    artHtml = `
      <div class="art-cloud cloud-1" style="background: rgba(226, 232, 240, 0.85);"></div>
      <div class="art-cloud cloud-2" style="background: rgba(203, 213, 225, 0.85);"></div>
    `;
  }

  artBox.innerHTML = artHtml;
}

// Rule-Based Insights
function renderWeatherInsights(insights) {
  const container = document.getElementById('insights-list');
  if (!container || !insights) return;

  container.innerHTML = insights.map(item => {
    let iconClass = 'text-cyan';
    let bgClass = 'bg-cyan-glass';
    if (item.badge_color === 'red') {
      iconClass = 'text-red';
      bgClass = 'bg-amber-glass';
    } else if (item.badge_color === 'amber') {
      iconClass = 'text-amber';
      bgClass = 'bg-amber-glass';
    } else if (item.badge_color === 'violet') {
      iconClass = 'text-violet';
      bgClass = 'bg-violet-glass';
    }

    return `
      <div class="insight-item">
        <div class="insight-icon-box ${bgClass}">
          <i data-lucide="${item.icon}" class="${iconClass}"></i>
        </div>
        <div class="insight-body">
          <h5>${item.title}</h5>
          <p>${item.message}</p>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Sunrise & Sunset Arc Calculation
function renderSunriseSunsetArc(rawSunrise, rawSunset, sunriseDisplay, sunsetDisplay) {
  const riseEl = document.getElementById('sun-rise-time');
  const setEl = document.getElementById('sun-set-time');
  const durationEl = document.getElementById('sun-daylight-duration');
  const marker = document.getElementById('sun-marker-circle');
  const progressArc = document.getElementById('sun-progress-arc');

  if (riseEl) riseEl.textContent = sunriseDisplay || '06:00 AM';
  if (setEl) setEl.textContent = sunsetDisplay || '06:00 PM';

  try {
    const now = new Date();
    const riseDate = new Date(rawSunrise);
    const setDate = new Date(rawSunset);

    const totalMinutes = (setDate - riseDate) / (1000 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    if (durationEl && !isNaN(hours)) {
      durationEl.textContent = `Daylight: ${hours}h ${mins}m`;
    }

    // Current position percentage (0.0 to 1.0)
    let ratio = (now - riseDate) / (setDate - riseDate);
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    // Arc geometry: Ellipse from (20, 120) to (280, 120) with peak at (150, 10)
    const angle = Math.PI - (ratio * Math.PI); // Math.PI to 0
    const cx = 150;
    const cy = 120;
    const rx = 130;
    const ry = 110;

    const markerX = cx + (rx * Math.cos(angle));
    const markerY = cy - (ry * Math.sin(angle));

    if (marker) {
      marker.setAttribute('cx', markerX);
      marker.setAttribute('cy', markerY);
    }

    if (progressArc) {
      // Dynamic SVG path up to current point
      progressArc.setAttribute('d', `M 20 120 A 130 110 0 0 1 ${markerX} ${markerY}`);
    }
  } catch (e) {
    console.warn('Sun arc calculation error:', e);
  }
}

// ==========================================
// FORECAST: 24H HOURLY SLIDER & 7-DAY
// ==========================================
function renderForecastHourly(hourlyList) {
  const container = document.getElementById('hourly-cards-container');
  if (!container || !hourlyList) return;

  container.innerHTML = hourlyList.map(h => `
    <div class="hourly-card">
      <span class="hourly-time">${h.time_display}</span>
      <div class="hourly-icon">
        <i data-lucide="${h.icon}"></i>
      </div>
      <span class="hourly-temp">${toDisplayTempInt(h.temperature)}°${state.unit}</span>
      <span class="hourly-rain-tag">
        <i data-lucide="droplet" style="width: 12px; height: 12px;"></i>
        ${h.rain_probability}%
      </span>
      <span class="hourly-wind-tag">${h.wind_speed} km/h</span>
    </div>
  `).join('');

  // Slider buttons
  const leftBtn = document.getElementById('hourly-slide-left');
  const rightBtn = document.getElementById('hourly-slide-right');
  if (leftBtn) {
    leftBtn.onclick = () => container.scrollBy({ left: -260, behavior: 'smooth' });
  }
  if (rightBtn) {
    rightBtn.onclick = () => container.scrollBy({ left: 260, behavior: 'smooth' });
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderForecastDaily(dailyList) {
  const container = document.getElementById('daily-cards-container');
  if (!container || !dailyList) return;

  // Find min and max across the week for relative bar widths
  let globalMin = Math.min(...dailyList.map(d => d.temp_min));
  let globalMax = Math.max(...dailyList.map(d => d.temp_max));
  if (globalMin === globalMax) globalMax += 1;

  container.innerHTML = dailyList.map(d => {
    const leftPercent = Math.max(0, ((d.temp_min - globalMin) / (globalMax - globalMin)) * 100);
    const widthPercent = Math.max(15, (((d.temp_max - d.temp_min) / (globalMax - globalMin)) * 100));

    let uvBadgeClass = 'bg-cyan-glass text-cyan';
    if (d.uv_index >= 8) uvBadgeClass = 'bg-amber-glass text-amber';

    return `
      <div class="daily-card-row">
        <div class="daily-day-col">
          <span class="daily-day-name">${d.day_name}</span>
          <span class="daily-date-sub">${d.date}</span>
        </div>

        <div class="daily-condition-col">
          <i data-lucide="${d.icon}"></i>
          <span class="daily-cond-text">${d.condition}</span>
        </div>

        <div class="daily-rain-col">
          <i data-lucide="cloud-rain"></i>
          <span>${d.rain_probability}%</span>
        </div>

        <div class="daily-temp-bar-col">
          <span class="temp-min-label">${toDisplayTempInt(d.temp_min)}°</span>
          <div class="temp-bar-track">
            <div class="temp-bar-fill" style="margin-left: ${leftPercent}%; width: ${widthPercent}%;"></div>
          </div>
          <span class="temp-max-label">${toDisplayTempInt(d.temp_max)}°${state.unit}</span>
        </div>

        <div class="daily-uv-col">
          <span class="uv-badge ${uvBadgeClass}">UV ${d.uv_index}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==========================================
// CHART.JS VISUALIZATIONS
// ==========================================
function convertTempArray(tempArray) {
  if (state.unit === 'F') {
    return tempArray.map(t => Number(((t * 9/5) + 32).toFixed(1)));
  }
  return tempArray;
}

// 1. Overview Mini Chart
function renderOverviewMiniChart(hourlyList) {
  const canvas = document.getElementById('overviewMiniChart');
  if (!canvas || !hourlyList) return;

  const ctx = canvas.getContext('2d');
  if (state.charts.overviewMini) {
    state.charts.overviewMini.destroy();
  }

  const labels = hourlyList.map(h => h.time_display);
  const temps = convertTempArray(hourlyList.map(h => h.temperature));

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

  state.charts.overviewMini = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Temperature (°${state.unit})`,
        data: temps,
        borderColor: '#06B6D4',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.38,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#22D3EE'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 12 },
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} °${state.unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#64748B',
            font: { size: 10 },
            callback: (v) => `${v}°`
          }
        }
      }
    }
  });
}

// 2. Forecast Tab: Hourly Multi-Dataset Chart
function renderForecastHourlyChart(hourlyList) {
  const canvas = document.getElementById('forecastHourlyChart');
  if (!canvas || !hourlyList) return;

  const ctx = canvas.getContext('2d');
  if (state.charts.forecastHourly) {
    state.charts.forecastHourly.destroy();
  }

  const labels = hourlyList.map(h => h.time_display);
  const temps = convertTempArray(hourlyList.map(h => h.temperature));
  const rain = hourlyList.map(h => h.rain_probability);

  state.charts.forecastHourly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (°${state.unit})`,
          data: temps,
          borderColor: '#7C3AED',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Precipitation Probability (%)',
          data: rain,
          backgroundColor: 'rgba(6, 182, 212, 0.35)',
          borderColor: '#06B6D4',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#CBD5E1', font: { family: 'Inter', size: 12 } }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B' }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#A855F7',
            callback: (v) => `${v}°`
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 100,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#38BDF8',
            callback: (v) => `${v}%`
          }
        }
      }
    }
  });
}

// 3. Analytics 4-Chart Grid
function renderAnalyticsCharts(analytics) {
  if (!analytics) return;

  const labels = analytics.labels;
  const temps = convertTempArray(analytics.temperature);
  const humidity = analytics.humidity;
  const wind = analytics.wind_speed;
  const precip = analytics.precipitation_probability;

  // Chart 1: Temperature Fluctuation Profile
  const tempCanvas = document.getElementById('analyticsTempChart');
  if (tempCanvas) {
    if (state.charts.analyticsTemp) state.charts.analyticsTemp.destroy();
    const ctx = tempCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    state.charts.analyticsTemp = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Temperature (°${state.unit})`,
          data: temps,
          borderColor: '#06B6D4',
          backgroundColor: grad,
          fill: true,
          tension: 0.35
        }]
      },
      options: getCommonChartOptions(`°${state.unit}`)
    });
  }

  // Chart 2: Relative Humidity Profile
  const humCanvas = document.getElementById('analyticsHumidityChart');
  if (humCanvas) {
    if (state.charts.analyticsHumidity) state.charts.analyticsHumidity.destroy();
    const ctx = humCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    state.charts.analyticsHumidity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Relative Humidity (%)',
          data: humidity,
          borderColor: '#3B82F6',
          backgroundColor: grad,
          fill: true,
          tension: 0.35
        }]
      },
      options: getCommonChartOptions('%', 0, 100)
    });
  }

  // Chart 3: Wind Velocity Vector
  const windCanvas = document.getElementById('analyticsWindChart');
  if (windCanvas) {
    if (state.charts.analyticsWind) state.charts.analyticsWind.destroy();
    const ctx = windCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    grad.addColorStop(1, 'rgba(124, 58, 237, 0.0)');

    state.charts.analyticsWind = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Wind Speed (km/h)',
          data: wind,
          borderColor: '#8B5CF6',
          backgroundColor: grad,
          fill: true,
          tension: 0.35
        }]
      },
      options: getCommonChartOptions(' km/h')
    });
  }

  // Chart 4: Precipitation Probability Density
  const precipCanvas = document.getElementById('analyticsPrecipChart');
  if (precipCanvas) {
    if (state.charts.analyticsPrecip) state.charts.analyticsPrecip.destroy();
    const ctx = precipCanvas.getContext('2d');

    state.charts.analyticsPrecip = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Precipitation Probability (%)',
          data: precip,
          backgroundColor: 'rgba(6, 182, 212, 0.55)',
          borderColor: '#22D3EE',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: getCommonChartOptions('%', 0, 100)
    });
  }
}

function getCommonChartOptions(unitSuffix, minVal, maxVal) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}${unitSuffix}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10 } }
      },
      y: {
        min: minVal,
        max: maxVal,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748B',
          font: { size: 10 },
          callback: (v) => `${v}${unitSuffix}`
        }
      }
    }
  };
}

// ==========================================
// AWS INFRASTRUCTURE & SIMULATION
// ==========================================
function updateInstanceCard(instance) {
  // Update sidebar host info
  const modeLabel = document.getElementById('instance-mode-label');
  const valId = document.getElementById('inst-val-id');
  const valZone = document.getElementById('inst-val-zone');
  const headerCloudText = document.getElementById('header-cloud-text');
  const envBadge = document.getElementById('aws-env-badge');

  if (modeLabel) {
    modeLabel.textContent = instance.is_aws ? 'AWS EC2 ACTIVE' : 'LOCAL DEV MODE';
  }
  if (valId) valId.textContent = instance.instance_id;
  if (valZone) valZone.textContent = instance.availability_zone;
  if (headerCloudText) {
    headerCloudText.textContent = instance.is_aws ?
      `ALB: ${instance.availability_zone}` : 'ALB Target: Localhost';
  }
  if (envBadge) envBadge.textContent = instance.environment;

  // Update IMDSv2 Inspector Table
  const metaId = document.getElementById('meta-instance-id');
  const metaZone = document.getElementById('meta-zone');
  const metaType = document.getElementById('meta-type');
  const metaLocalIp = document.getElementById('meta-local-ip');
  const metaPublicIp = document.getElementById('meta-public-ip');
  const metaOs = document.getElementById('meta-os');

  if (metaId) metaId.textContent = instance.instance_id;
  if (metaZone) metaZone.textContent = `${instance.availability_zone} (${instance.region})`;
  if (metaType) metaType.textContent = instance.instance_type;
  if (metaLocalIp) metaLocalIp.textContent = instance.local_ip;
  if (metaPublicIp) metaPublicIp.textContent = instance.public_ip;
  if (metaOs) metaOs.textContent = `${instance.hostname} (${instance.os})`;
}

function initAlbSimulator() {
  const btn = document.getElementById('test-alb-routing-btn');
  const logBox = document.getElementById('alb-sim-log');
  const logText = document.getElementById('alb-sim-text');
  const node1 = document.getElementById('topo-node-1');
  const node2 = document.getElementById('topo-node-2');

  if (btn) {
    btn.addEventListener('click', () => {
      // Toggle target instance
      state.simulatedAlbTarget = state.simulatedAlbTarget === 1 ? 2 : 1;
      const targetId = state.simulatedAlbTarget;
      const az = targetId === 1 ? 'ap-south-1a' : 'ap-south-1b';
      const latency = (14 + Math.random() * 8).toFixed(1);

      if (node1 && node2) {
        if (targetId === 1) {
          node1.classList.add('active-target');
          node2.classList.remove('active-target');
        } else {
          node2.classList.add('active-target');
          node1.classList.remove('active-target');
        }
      }

      if (logBox && logText) {
        logBox.classList.remove('hidden');
        logText.innerHTML = `ALB Load Balancer routed HTTP request to <strong>EC2 Instance ${targetId} (${az})</strong> • Status: 200 OK • Round-Trip: <strong>${latency}ms</strong>`;
      }

      // Update latency in CloudWatch panel
      const cwLatency = document.getElementById('cw-latency');
      if (cwLatency) cwLatency.textContent = latency;
    });
  }
}

// ==========================================
// SEARCH HISTORY MANAGEMENT
// ==========================================
async function loadSearchHistory() {
  const tbody = document.getElementById('history-tbody');
  const badge = document.getElementById('history-storage-badge');
  if (!tbody) return;

  try {
    const res = await fetch('/api/history?limit=20');
    const data = await res.json();

    if (badge) badge.textContent = data.storage || 'Local Storage';

    const history = data.history || [];
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No search history recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = history.map(item => `
      <tr>
        <td class="mono-text">${item.formatted_time || new Date(item.timestamp * 1000).toLocaleString()}</td>
        <td><strong>${item.city}</strong></td>
        <td>${item.country || 'N/A'}</td>
        <td class="mono-text">${toDisplayTemp(item.temperature)}°${state.unit}</td>
        <td>${item.condition || 'Clear'}</td>
        <td>
          <button class="history-re-btn" onclick="recallCity('${item.city}')">
            <i data-lucide="rotate-ccw"></i>
            <span>Reload</span>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (e) {
    console.error('History load error:', e);
  }
}

// Global hook for recall button
window.recallCity = function(city) {
  const overviewNav = document.getElementById('nav-btn-overview');
  if (overviewNav) overviewNav.click();

  const searchInput = document.getElementById('city-search-input');
  if (searchInput) searchInput.value = city;

  loadWeatherData(city);
};

function initHistoryActions() {
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear search audit telemetry?')) {
        try {
          await fetch('/api/history/clear', { method: 'POST' });
          loadSearchHistory();
        } catch (e) {
          console.error('Failed to clear history:', e);
        }
      }
    });
  }
}
