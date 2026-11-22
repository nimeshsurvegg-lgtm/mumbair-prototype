/* ==============================================================================
   MumbAIR — API Layer (Open-Meteo Air Quality & Weather Ingestion Engine)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.API = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;

  // Open-Meteo Endpoints (Public, Zero-API-Key, CORS Enabled)
  var AIR_API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  var WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Fetch live atmospheric data from Open-Meteo for given coordinates
   */
  function fetchAirAndWeather(lat, lng, forceRefresh){
    var targetLat = lat || CONFIG.DEFAULT_COORDS.lat;
    var targetLng = lng || CONFIG.DEFAULT_COORDS.lng;

    // Check localStorage cache first
    var state = STORAGE.loadState();
    var cached = state.cachedApi;
    var now = Date.now();

    if(!forceRefresh && cached && cached.data && (now - cached.timestamp < CONFIG.API_CACHE_TTL_MS)){
      // Cache is valid
      return Promise.resolve({
        success: true,
        source: 'CACHED_API',
        timestamp: cached.timestamp,
        air: cached.data.air,
        weather: cached.data.weather,
        attribution: 'Open-Meteo (Cached within 15 min TTL)'
      });
    }

    var airParams = new URLSearchParams({
      latitude: targetLat,
      longitude: targetLng,
      current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi',
      hourly: 'pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi',
      timezone: 'Asia/Kolkata',
      forecast_days: 3,
      past_days: 1
    });

    var weatherParams = new URLSearchParams({
      latitude: targetLat,
      longitude: targetLng,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code',
      timezone: 'Asia/Kolkata'
    });

    // Timeout controller (8 seconds)
    var controller = new AbortController();
    var timeoutId = setTimeout(function(){ controller.abort(); }, 8000);

    var fetchAir = fetch(AIR_API_URL + '?' + airParams.toString(), { signal: controller.signal })
      .then(function(res){
        if(!res.ok) throw new Error('Air Quality API status ' + res.status);
        return res.json();
      });

    var fetchWeather = fetch(WEATHER_API_URL + '?' + weatherParams.toString(), { signal: controller.signal })
      .then(function(res){
        if(!res.ok) throw new Error('Weather API status ' + res.status);
        return res.json();
      });

    return Promise.all([fetchAir, fetchWeather])
      .then(function(results){
        clearTimeout(timeoutId);
        var airData = results[0];
        var weatherData = results[1];

        var responsePayload = {
          success: true,
          source: 'LIVE_API',
          timestamp: Date.now(),
          air: airData,
          weather: weatherData,
          attribution: 'Open-Meteo Atmospheric Models (CAMS & ECMWF)'
        };

        // Update cache
        state.cachedApi = {
          timestamp: Date.now(),
          data: { air: airData, weather: weatherData }
        };
        STORAGE.saveState(state);

        return responsePayload;
      })
      .catch(function(err){
        clearTimeout(timeoutId);
        console.warn('Live API request failed, falling back to local model:', err);

        // Fallback: If cache exists even if expired, return stale cached
        if(cached && cached.data){
          return {
            success: true,
            source: 'CACHED_STALE',
            timestamp: cached.timestamp,
            air: cached.data.air,
            weather: cached.data.weather,
            attribution: 'Open-Meteo (Stale Cache - Network Retry Available)',
            warning: 'Network request timed out. Showing last available atmospheric data.'
          };
        }

        // True offline fallback simulation
        return {
          success: true,
          source: 'OFFLINE_DEMO',
          timestamp: Date.now(),
          air: generateFallbackAirData(),
          weather: generateFallbackWeatherData(),
          attribution: 'Local Mumbai Atmospheric Simulation Engine',
          warning: 'Live environmental API currently unreachable. Showing realistic baseline model.'
        };
      });
  }

  // Realistic Fallback Data Generator matching Mumbai seasonal patterns
  function generateFallbackAirData(){
    var nowHour = new Date().getHours();
    var times = [];
    var pm25Series = [];
    var pm10Series = [];
    var aqiSeries = [];

    // Generate 48 hours of trend data (24h past + 24h future)
    for(var i = -24; i <= 24; i++){
      var d = new Date(Date.now() + i * 3600 * 1000);
      times.push(d.toISOString().slice(0, 16));
      var hr = d.getHours();
      // Diurnal curve: peaks at 8-10 AM and 8-11 PM (rush hour + nocturnal inversion)
      var diurnal = (Math.sin((hr - 4) * Math.PI / 12) + 1) * 28;
      var base25 = 75 + diurnal + (Math.random() * 12 - 6);
      var base10 = base25 * 1.85 + (Math.random() * 20 - 10);
      pm25Series.push(Math.round(base25));
      pm10Series.push(Math.round(base10));
      aqiSeries.push(Math.round(base25 * 2.1));
    }

    var currPm25 = pm25Series[24];
    var currPm10 = pm10Series[24];

    return {
      current: {
        pm2_5: currPm25,
        pm10: currPm10,
        nitrogen_dioxide: 42,
        sulphur_dioxide: 22,
        carbon_monoxide: 1250,
        ozone: 28,
        us_aqi: Math.round(currPm25 * 2.05),
        european_aqi: 3
      },
      hourly: {
        time: times,
        pm2_5: pm25Series,
        pm10: pm10Series,
        us_aqi: aqiSeries
      }
    };
  }

  function generateFallbackWeatherData(){
    return {
      current: {
        temperature_2m: 29.4,
        relative_humidity_2m: 72,
        wind_speed_10m: 13.5,
        wind_direction_10m: 290, // WNW (Arabian Sea Breeze)
        weather_code: 1
      }
    };
  }

  return {
    fetchAirAndWeather: fetchAirAndWeather
  };
})();
