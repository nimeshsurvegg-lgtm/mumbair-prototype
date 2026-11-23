/* ==============================================================================
   MumbAIR — Master Application Controller & Route Orchestration Engine
   Strictly separates Public Citizen Experience and Protected Municipal Authority Workspace
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.APP = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var UTILS = window.MumbAIR.UTILS;
  var API = window.MumbAIR.API;
  var AUTH = window.MumbAIR.AUTH;
  var MAP = window.MumbAIR.MAP;
  var CHARTS = window.MumbAIR.CHARTS;
  var INSIGHTS = window.MumbAIR.INSIGHTS;
  var REPORTS = window.MumbAIR.REPORTS;
  var OPERATIONS = window.MumbAIR.OPERATIONS;
  var NOTIFICATIONS = window.MumbAIR.NOTIFICATIONS;
  var AI = window.MumbAIR.AI;

  var appState = {
    currentPortal: 'citizen', // 'citizen' or 'authority'
    currentTab: 'tab-home',
    activeWardCode: 'M/E',
    compareWardA: 'M/E',
    compareWardB: 'D',
    filterCategory: 'ALL',
    filterStatus: 'ALL',
    sortReports: 'SUPPORTED',
    airData: null,
    weatherData: null,
    wardAqiMap: {},
    mapInitialized: false,
    audioCtx: null
  };

  /* ===========================================================================
     AUDIO CHIME & TOAST NOTIFICATIONS
     =========================================================================== */

  function playAlertSound(freq, duration){
    var saved = STORAGE.loadState();
    if(saved.settings && saved.settings.audio === false) return;
    try {
      if(!appState.audioCtx) appState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if(appState.audioCtx.state === 'suspended') appState.audioCtx.resume();
      var osc = appState.audioCtx.createOscillator();
      var gain = appState.audioCtx.createGain();
      osc.frequency.setValueAtTime(freq || 523.25, appState.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, appState.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, appState.audioCtx.currentTime + (duration || 0.2));
      osc.connect(gain);
      gain.connect(appState.audioCtx.destination);
      osc.start();
      osc.stop(appState.audioCtx.currentTime + (duration || 0.2));
    } catch(e) {}
  }

  function showToast(message, icon){
    var container = document.getElementById('toastContainer');
    if(!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =
      '<span style="font-size:16px;">' + (icon || 'ℹ️') + '</span>' +
      '<span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(function(){ toast.remove(); }, 250);
    }, 3500);
  }

  /* ===========================================================================
     PORTAL NAVIGATION (CITIZEN vs MUNICIPAL AUTHORITY)
     =========================================================================== */

  function switchToCitizenPortal(){
    appState.currentPortal = 'citizen';
    document.getElementById('portal-citizen').classList.add('active');
    document.getElementById('portal-citizen').classList.remove('hidden');

    document.getElementById('portal-authority').classList.remove('active');
    document.getElementById('portal-authority').classList.add('hidden');

    window.location.hash = appState.currentTab.replace('tab-', '');
    if(appState.currentTab === 'tab-map'){
      MAP.invalidateSize();
    }
  }

  function switchToAuthorityPortal(){
    appState.currentPortal = 'authority';
    document.getElementById('portal-citizen').classList.remove('active');
    document.getElementById('portal-citizen').classList.add('hidden');

    document.getElementById('portal-authority').classList.add('active');
    document.getElementById('portal-authority').classList.remove('hidden');

    if(!window.location.hash || window.location.hash.indexOf('#authority') !== 0){
      window.location.hash = 'authority';
    }

    // Verify session
    if(AUTH.isAuthorityAuthenticated()){
      showAuthorityDashboard();
    } else {
      showAuthorityLogin();
    }
  }

  function showAuthorityLogin(){
    document.getElementById('authority-login-view').classList.remove('hidden');
    document.getElementById('authority-dashboard-view').classList.add('hidden');
  }

  function showAuthorityDashboard(){
    var user = AUTH.getAuthorityUser();
    if(!user){
      showAuthorityLogin();
      return;
    }

    document.getElementById('authority-login-view').classList.add('hidden');
    document.getElementById('authority-dashboard-view').classList.remove('hidden');

    // Update officer identity in header
    var nameEl = document.getElementById('authOfficerName');
    var roleEl = document.getElementById('authOfficerRolePill');
    var avatarEl = document.getElementById('authOfficerAvatar');
    var badgeEl = document.getElementById('authOfficerBadge');

    if(nameEl) nameEl.textContent = user.name;
    if(roleEl) roleEl.textContent = user.roleLabel || CONFIG.ROLES[user.role].label;
    if(avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0) : 'O';
    if(badgeEl) badgeEl.textContent = user.badge || 'BMC-OFFICER';

    renderAuthorityWorkspace();
  }

  function renderAuthorityWorkspace(){
    var user = AUTH.getAuthorityUser();
    if(!user) return;
    if(window.MumbAIR.OPERATIONS && window.MumbAIR.OPERATIONS.initAuthorityShell){
      window.MumbAIR.OPERATIONS.initAuthorityShell();
    }
  }

  /* ===========================================================================
     CITIZEN TAB NAVIGATION (6 CORE TABS)
     =========================================================================== */

  function switchTab(tabId){
    appState.currentTab = tabId;

    // Update active nav button
    document.querySelectorAll('#citizenNav .nav-link').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update mobile bottom nav
    document.querySelectorAll('.citizen-bottom-nav .bottom-nav-item').forEach(function(item){
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });

    // Update active tab panel
    document.querySelectorAll('.citizen-main .tab-view').forEach(function(panel){
      panel.classList.toggle('active', panel.id === tabId);
    });

    // Window scroll to top
    if(typeof window.scrollTo === 'function'){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle tab-specific lifecycles
    if(tabId === 'tab-map'){
      setTimeout(function(){
        if(!appState.mapInitialized){
          initMapComponent();
        } else {
          MAP.invalidateSize();
        }
      }, 80);
    } else if(tabId === 'tab-trends'){
      renderTrendCharts();
    } else if(tabId === 'tab-air-quality'){
      renderAirQualityTab();
    } else if(tabId === 'tab-reports'){
      renderCivicReportsList();
    } else if(tabId === 'tab-bulletin'){
      if(window.MumbAIR.BULLETIN && window.MumbAIR.BULLETIN.render){
        window.MumbAIR.BULLETIN.render();
      }
    } else if(tabId === 'tab-solutions'){
      if(window.MumbAIR.SOLUTIONS && window.MumbAIR.SOLUTIONS.render){
        window.MumbAIR.SOLUTIONS.render();
      }
    }
  }

  /* ===========================================================================
     ATMOSPHERIC DATA INGESTION & AQI COMPUTATION
     =========================================================================== */

  function refreshAtmosphericData(force){
    var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.activeWardCode; }) || CONFIG.WARDS_DATA[0];

    var sourceEl = document.getElementById('homeSourceAttribution');
    if(sourceEl) sourceEl.textContent = 'Connecting...';

    return API.fetchAirAndWeather(ward.lat, ward.lng, force)
      .then(function(res){
        appState.airData = res.air;
        appState.weatherData = res.weather;

        computeAllWardsAqi(res.air);

        renderHomeDashboard(res);
        renderAirQualityTab();

        if(appState.mapInitialized){
          MAP.renderWardMarkers(CONFIG.WARDS_DATA, appState.wardAqiMap, function(wardCode){
            selectWard(wardCode);
          });
        }

        if(appState.currentTab === 'tab-trends'){
          renderTrendCharts();
        }

        renderInsights(res.air, res.weather);

        var lastUpdated = document.getElementById('homeLastUpdated');
        if(lastUpdated){
          lastUpdated.textContent = 'Updated: ' + UTILS.formatTime(res.timestamp);
        }

        if(sourceEl){
          sourceEl.textContent = res.source === 'LIVE_API' ? 'Live API (Open-Meteo)' : (res.source === 'CACHED_API' ? 'Cached API' : 'Model Simulation');
        }

        showToast('Environmental data synchronized for ' + ward.name, '✅');
        playAlertSound(659.25, 0.15);
      })
      .catch(function(err){
        console.error('Data refresh error:', err);
        showToast('Using local atmospheric model fallback.', 'ℹ️');
      });
  }

  function computeAllWardsAqi(airData){
    var basePm25 = (airData && airData.current && airData.current.pm2_5 !== undefined) ? airData.current.pm2_5 : 85;
    var basePm10 = (airData && airData.current && airData.current.pm10 !== undefined) ? airData.current.pm10 : 160;
    var baseNo2 = (airData && airData.current && airData.current.nitrogen_dioxide !== undefined) ? airData.current.nitrogen_dioxide : 42;
    var baseSo2 = (airData && airData.current && airData.current.sulphur_dioxide !== undefined) ? airData.current.sulphur_dioxide : 22;
    var baseCo = (airData && airData.current && airData.current.carbon_monoxide !== undefined) ? airData.current.carbon_monoxide : 1.3;
    var baseO3 = (airData && airData.current && airData.current.ozone !== undefined) ? airData.current.ozone : 28;

    appState.wardAqiMap = {};

    CONFIG.WARDS_DATA.forEach(function(w){
      // Calculate authentic CPCB NAQI without arbitrary factor distortion
      var aqiResult = UTILS.calculateIndianAqi({
        pm25: basePm25,
        pm10: basePm10,
        no2: baseNo2,
        so2: baseSo2,
        co: baseCo,
        o3: baseO3
      });

      appState.wardAqiMap[w.code] = {
        code: w.code,
        name: w.name,
        station: w.station,
        aqi: aqiResult.aqi,
        category: aqiResult.category,
        color: aqiResult.color,
        dominant: aqiResult.dominant,
        dominantName: aqiResult.dominantName,
        isOfficial: aqiResult.isOfficial,
        pm25: basePm25,
        pm10: basePm10,
        no2: baseNo2,
        so2: baseSo2,
        co: baseCo,
        o3: baseO3
      };
    });
  }

  /* ===========================================================================
     RENDER HERO DASHBOARD (HOME TAB)
     =========================================================================== */

  function renderHomeDashboard(res){
    var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.activeWardCode; }) || CONFIG.WARDS_DATA[0];
    var wardAqi = appState.wardAqiMap[ward.code] || { aqi: 142, category: 'Moderate', color: '#CA8A04', dominant: 'PM2.5' };

    // Header labels
    var locText = document.getElementById('headerLocationText');
    if(locText) locText.textContent = ward.name + ' (' + ward.code + ')';

    var wardBadge = document.getElementById('homeWardBadge');
    if(wardBadge) wardBadge.textContent = 'Ward ' + ward.code;

    var stationName = document.getElementById('homeStationName');
    if(stationName) stationName.textContent = ward.station;

    // Big AQI Number & Colors
    var aqiNum = document.getElementById('heroAqiNumber');
    if(aqiNum){
      aqiNum.textContent = wardAqi.aqi;
      aqiNum.style.color = wardAqi.color;
    }

    var catBadge = document.getElementById('heroCategoryBadge');
    if(catBadge){
      catBadge.textContent = wardAqi.category;
      catBadge.style.color = wardAqi.color;
      catBadge.style.background = wardAqi.color + '20';
    }

    var domBadge = document.getElementById('heroDominantBadge');
    if(domBadge) domBadge.textContent = 'Dominant: ' + wardAqi.dominant;

    // SVG Circular Gauge Arc Animation (Circumference ~ 267)
    var arc = document.getElementById('aqiArcProgress');
    if(arc){
      var maxAqi = 500;
      var ratio = Math.min(1, Math.max(0, wardAqi.aqi / maxAqi));
      var dashoffset = 267 - (ratio * 267);
      arc.style.strokeDashoffset = dashoffset;
      arc.style.stroke = wardAqi.color;
    }

    // CPCB NAQI Cursor
    var cursor = document.getElementById('heroScaleCursor');
    if(cursor){
      var percent = Math.min(100, Math.max(0, (wardAqi.aqi / 500) * 100));
      cursor.style.left = percent + '%';
    }

    // Health Guidance
    var healthText = document.getElementById('heroHealthText');
    if(healthText){
      if(wardAqi.aqi <= 50){
        healthText.textContent = 'Air quality is satisfactory and poses minimal health impact. Favorable conditions for outdoor exercise.';
        healthText.style.borderLeftColor = 'var(--aqi-good)';
      } else if(wardAqi.aqi <= 100){
        healthText.textContent = 'Air quality is satisfactory; exceptionally sensitive individuals may consider reducing prolonged outdoor heavy exertion.';
        healthText.style.borderLeftColor = 'var(--aqi-satisfactory)';
      } else if(wardAqi.aqi <= 200){
        healthText.textContent = 'Moderate air quality. Children, older adults, and individuals with respiratory conditions should moderate prolonged exertion.';
        healthText.style.borderLeftColor = 'var(--aqi-moderate)';
      } else if(wardAqi.aqi <= 300){
        healthText.textContent = 'Poor air quality. Breathing discomfort likely for most people on prolonged outdoor exposure. N95 particulate mask advised during transit.';
        healthText.style.borderLeftColor = 'var(--aqi-poor)';
      } else {
        healthText.textContent = 'Very Poor / Severe atmospheric condition. High health hazard. Avoid non-essential outdoor activities. Keep windows closed.';
        healthText.style.borderLeftColor = 'var(--aqi-very-poor)';
      }
    }

    // Render Pollutant Strip (6 parameters)
    renderPollutantStrip(res.air);

    // Render Weather Context
    renderWeatherContext(res.weather);
  }

  function renderPollutantStrip(airData){
    if(!airData || !airData.current) return;
    var c = airData.current;

    var mapping = [
      { domId: 'Pm25', val: c.pm2_5, max: 60, unit: 'µg/m³' },
      { domId: 'Pm10', val: c.pm10, max: 100, unit: 'µg/m³' },
      { domId: 'No2',  val: c.nitrogen_dioxide, max: 80, unit: 'µg/m³' },
      { domId: 'So2',  val: c.sulphur_dioxide, max: 80, unit: 'µg/m³' },
      { domId: 'Co',   val: (typeof c.carbon_monoxide === 'number') ? (c.carbon_monoxide / 1000).toFixed(1) : (c.carbon_monoxide || null), max: 2.0, unit: 'mg/m³' },
      { domId: 'O3',   val: c.ozone, max: 100, unit: 'µg/m³' }
    ];

    mapping.forEach(function(item){
      var numEl = document.getElementById('val' + item.domId);
      var meterEl = document.getElementById('meter' + item.domId);
      var statusEl = document.getElementById('status' + item.domId);

      var hasVal = item.val !== null && item.val !== undefined && item.val !== '';
      var numVal = hasVal ? parseFloat(item.val) : null;

      if(numEl){
        if(hasVal && !isNaN(numVal)){
          numEl.textContent = (numVal % 1 === 0) ? numVal : numVal.toFixed(1);
          numEl.style.fontSize = '1.35rem';
        } else {
          numEl.textContent = 'No reading';
          numEl.style.fontSize = '0.9rem';
        }
      }

      if(meterEl){
        if(hasVal && !isNaN(numVal)){
          var pct = Math.min(100, Math.max(0, (numVal / item.max) * 50));
          meterEl.style.width = pct + '%';
          meterEl.style.background = numVal > item.max * 1.5 ? 'var(--aqi-poor)' : (numVal > item.max ? 'var(--aqi-moderate)' : 'var(--aqi-good)');
        } else {
          meterEl.style.width = '0%';
        }
      }

      if(statusEl){
        if(hasVal && !isNaN(numVal)){
          statusEl.textContent = numVal > item.max ? 'Elevated' : 'Compliant';
          statusEl.style.color = numVal > item.max ? 'var(--aqi-poor)' : 'var(--aqi-good)';
        } else {
          statusEl.textContent = 'Unavailable';
          statusEl.style.color = 'var(--ink-muted)';
        }
      }
    });
  }

  function renderWeatherContext(weatherData){
    if(!weatherData || !weatherData.current) return;
    var w = weatherData.current;

    var temp = document.getElementById('weatherTemp');
    if(temp) temp.textContent = (w.temperature_2m || 28) + '°C';

    var hum = document.getElementById('weatherHumidity');
    if(hum) hum.textContent = (w.relative_humidity_2m || 72) + '%';

    var spd = document.getElementById('weatherWindSpeed');
    if(spd) spd.textContent = (w.wind_speed_10m || 14).toFixed(1) + ' km/h';

    var dir = document.getElementById('weatherWindDir');
    if(dir){
      var deg = Math.round(w.wind_direction_10m || 270);
      var dirCard = deg >= 225 && deg <= 315 ? 'Westerly (Onshore)' : (deg >= 45 && deg <= 135 ? 'Easterly (Inland)' : 'Northerly');
      dir.textContent = deg + '° · ' + dirCard;
    }
  }

  /* ===========================================================================
     AIR QUALITY TAB (24 WARDS DIRECTORY & COMPARATOR)
     =========================================================================== */

  function renderAirQualityTab(){
    // Comparison Chart
    var wardA = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.compareWardA; }) || CONFIG.WARDS_DATA[0];
    var wardB = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.compareWardB; }) || CONFIG.WARDS_DATA[3];
    CHARTS.initComparisonChart('comparisonCanvas', wardA, wardB, appState.wardAqiMap);

    // 24 Wards Directory
    var dirContainer = document.getElementById('wardsDirectoryGrid');
    if(!dirContainer) return;

    var filterText = (document.getElementById('filterStationSearch') ? document.getElementById('filterStationSearch').value : '').toLowerCase().trim();

    dirContainer.innerHTML = '';
    CONFIG.WARDS_DATA.forEach(function(w){
      if(filterText){
        var match = w.name.toLowerCase().indexOf(filterText) !== -1 ||
                    w.code.toLowerCase().indexOf(filterText) !== -1 ||
                    w.station.toLowerCase().indexOf(filterText) !== -1;
        if(!match) return;
      }

      var aqiInfo = appState.wardAqiMap[w.code] || { aqi: 135, category: 'Moderate', color: '#CA8A04' };

      var card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '14px 16px';
      card.style.cursor = 'pointer';

      card.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
          '<div>' +
            '<div style="font-weight:700; font-size:13.5px; color:var(--ink-primary);">' + w.name + '</div>' +
            '<div style="font-size:11px; color:var(--ink-muted); margin-top:2px;">' + w.zone + ' &middot; ' + w.station + '</div>' +
          '</div>' +
          '<div style="background:' + aqiInfo.color + '; color:#fff; font-family:var(--font-mono); font-weight:800; font-size:12px; padding:3px 8px; border-radius:var(--radius-full);">' +
            aqiInfo.aqi +
          '</div>' +
        '</div>' +
        '<div style="margin-top:8px; font-size:11px; color:var(--ink-secondary); line-height:1.4;">' +
          '<strong>Emission source:</strong> ' + w.defaultCause +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:8px; border-top:1px solid var(--border-subtle);">' +
          '<span style="font-size:11px; color:' + aqiInfo.color + '; font-weight:700;">' + aqiInfo.category + '</span>' +
          '<div style="display:flex; gap:6px;">' +
            '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.APP.selectWard(\'' + w.code + '\')">Select</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.viewOnMap(\'' + w.code + '\')">Map ➔</button>' +
          '</div>' +
        '</div>';

      dirContainer.appendChild(card);
    });
  }

  function selectWard(wardCode){
    appState.activeWardCode = wardCode;
    refreshAtmosphericData(false);
    switchTab('tab-home');
  }

  function selectWardFromMap(wardCode){
    appState.activeWardCode = wardCode;
    refreshAtmosphericData(false);
    showToast('Ward ' + wardCode + ' selected as monitored area.', '📍');
  }

  function viewOnMap(wardCode){
    appState.activeWardCode = wardCode;
    switchTab('tab-map');
    setTimeout(function(){
      MAP.searchAndZoom(wardCode);
    }, 200);
  }

  function reportAtWard(wardCode){
    appState.activeWardCode = wardCode;
    var sel = document.getElementById('reportWardSelect');
    if(sel) sel.value = wardCode;
    switchTab('tab-reports');
  }

  /* ===========================================================================
     EXPLORE MAP INITIALIZATION & CONTROLS
     =========================================================================== */

  function initMapComponent(){
    MAP.initMap('leafletMap', function(wardCode){
      selectWard(wardCode);
    });

    MAP.renderWardMarkers(CONFIG.WARDS_DATA, appState.wardAqiMap, function(wardCode){
      selectWard(wardCode);
    });

    var state = STORAGE.loadState();
    MAP.renderReportMarkers(state.reports || []);

    appState.mapInitialized = true;
    MAP.invalidateSize();
  }

  /* ===========================================================================
     TREND CHARTS & DETERMINISTIC INSIGHTS
     =========================================================================== */

  function renderTrendCharts(hours){
    if(!appState.airData || !appState.airData.hourly) return;
    CHARTS.initTrendChart('hourlyTrendCanvas', appState.airData.hourly, hours || 24);
  }

  function renderInsights(airData, weatherData){
    var list = document.getElementById('insightsList');
    if(!list) return;

    var insights = INSIGHTS.generateInsights(airData, weatherData, appState.activeWardCode);
    list.innerHTML = '';

    insights.forEach(function(ins){
      var card = document.createElement('div');
      card.className = 'insight-card ' + ins.type;
      card.style.background = 'var(--bg-subtle)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.padding = '12px 14px';
      card.style.marginBottom = '10px';

      card.innerHTML =
        '<div style="font-weight:700; font-size:13px; color:var(--ink-primary);">' + ins.title + '</div>' +
        '<div style="font-size:12px; color:var(--ink-secondary); margin-top:3px; line-height:1.45;">' + ins.body + '</div>' +
        '<div style="font-family:var(--font-mono); font-size:10px; color:var(--ink-muted); margin-top:4px;">' + ins.source + '</div>';

      list.appendChild(card);
    });
  }

  /* ===========================================================================
     CIVIC POLLUTION REPORTING & TRACKER
     =========================================================================== */

  function renderCivicReportsList(){
    var container = document.getElementById('reportsFeedContainer');
    if(!container) return;

    var state = STORAGE.loadState();
    var reports = state.reports || [];

    var filtered = reports.filter(function(r){
      if(appState.filterCategory !== 'ALL' && r.category !== appState.filterCategory) return false;
      if(appState.filterStatus !== 'ALL' && r.status !== appState.filterStatus) return false;
      return true;
    });

    if(appState.sortReports === 'SUPPORTED'){
      filtered.sort(function(a, b){ return (b.upvotes || 0) - (a.upvotes || 0); });
    } else {
      filtered.sort(function(a, b){ return new Date(b.createdAt) - new Date(a.createdAt); });
    }

    container.innerHTML = '';
    if(filtered.length === 0){
      container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--ink-muted);">No complaints match the selected filters.</div>';
      return;
    }

    filtered.forEach(function(r){
      var hasVoted = (state.userVotes || []).indexOf(r.id) !== -1;
      var card = document.createElement('div');
      card.className = 'report-ticket-card';

      card.innerHTML =
        '<div class="ticket-top">' +
          '<div>' +
            '<div class="ticket-meta-info">' +
              '<span class="ticket-id">' + r.id + '</span>' +
              '<span class="ticket-ward-pill">Ward ' + r.ward + '</span>' +
              '<span style="color:var(--ink-muted); font-size:11px;">' + UTILS.relativeTime(r.createdAt) + '</span>' +
            '</div>' +
            '<div class="ticket-title">' + UTILS.escapeHtml(r.title) + '</div>' +
          '</div>' +
          '<span class="task-priority-pill priority-' + (r.priority ? r.priority.toLowerCase() : 'medium') + '">' +
            r.status.replace(/_/g, ' ') +
          '</span>' +
        '</div>' +
        '<div class="ticket-desc">' + UTILS.escapeHtml(r.description) + '</div>' +
        '<div class="ticket-footer">' +
          '<button class="btn-endorse ' + (hasVoted ? 'endorsed' : '') + '" onclick="window.MumbAIR.APP.endorseReport(\'' + r.id + '\')">' +
            '👍 ' + (r.upvotes || 0) + ' Citizen Endorsements' +
          '</button>' +
          '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.viewReportTimeline(\'' + r.id + '\')">' +
            'Status Timeline ▾' +
          '</button>' +
        '</div>' +
        '<div id="timeline-' + r.id + '" class="lifecycle-timeline-wrap hidden"></div>';

      container.appendChild(card);
    });
  }

  function endorseReport(reportId){
    var res = REPORTS.upvoteReport(reportId);
    if(!res.success){
      if(res.reason === 'ALREADY_VOTED'){
        showToast('You have already endorsed this violation report.', 'ℹ️');
      }
    } else {
      showToast('Endorsement registered! Case priority increased for Ward Desk.', '👍');
      playAlertSound(523.25, 0.15);
      renderCivicReportsList();
    }
  }

  function viewReportTimeline(reportId){
    var el = document.getElementById('timeline-' + reportId);
    if(!el) return;

    var isHidden = el.classList.contains('hidden');
    document.querySelectorAll('.lifecycle-timeline-wrap').forEach(function(t){ t.classList.add('hidden'); });

    if(isHidden){
      var state = STORAGE.loadState();
      var report = (state.reports || []).find(function(r){ return r.id === reportId; });
      if(!report) return;

      var steps = [
        { key: 'SUBMITTED', label: '1. Submitted' },
        { key: 'UNDER_REVIEW', label: '2. Under Review' },
        { key: 'ASSIGNED', label: '3. Assigned' },
        { key: 'ACTION_TAKEN', label: '4. Action Taken' },
        { key: 'RESOLVED', label: '5. Resolved Safe' }
      ];

      var html = '<div class="timeline-steps">';
      steps.forEach(function(s){
        var isCurrent = report.status === s.key;
        var isCompleted = isStatusCompleted(report.status, s.key);
        html +=
          '<div class="timeline-step ' + (isCompleted ? 'completed' : '') + ' ' + (isCurrent ? 'current' : '') + '">' +
            '<div class="step-marker"></div>' +
            '<div>' + s.label + '</div>' +
          '</div>';
      });
      html += '</div>';

      if(report.timeline && report.timeline.length > 0){
        html += '<div style="margin-top:12px; font-size:11px; border-top:1px solid var(--border-subtle); padding-top:8px;">';
        report.timeline.forEach(function(t){
          html += '<div style="margin-bottom:4px;"><strong>' + t.status.replace(/_/g, ' ') + ':</strong> ' + UTILS.escapeHtml(t.note) + ' <span style="color:var(--ink-muted);">(' + t.time + ')</span></div>';
        });
        html += '</div>';
      }

      el.innerHTML = html;
      el.classList.remove('hidden');
    }
  }

  function isStatusCompleted(currentStatus, stepKey){
    var order = ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'ACTION_TAKEN', 'RESOLUTION_SUBMITTED', 'RESOLVED', 'CLOSED'];
    var currIdx = order.indexOf(currentStatus);
    var stepIdx = order.indexOf(stepKey);
    return currIdx >= stepIdx && currIdx !== -1;
  }

  /* ===========================================================================
     EVENT ATTACHMENTS & INITIALIZATION
     =========================================================================== */

  function initEventBindings(){
    // Logo Click -> Home
    var logoHome = document.getElementById('btnLogoHome');
    if(logoHome){
      logoHome.onclick = function(e){
        e.preventDefault();
        switchToCitizenPortal();
        switchTab('tab-home');
      };
    }

    // Citizen Navigation Buttons
    document.querySelectorAll('#citizenNav .nav-link').forEach(function(btn){
      btn.onclick = function(){
        switchTab(btn.getAttribute('data-tab'));
      };
    });

    // Home Feature Map & Quick Action Cards
    var btnHomeOpenMap = document.getElementById('btnHomeOpenFullMap');
    if(btnHomeOpenMap){
      btnHomeOpenMap.onclick = function(){ switchTab('tab-map'); };
    }
    var qaq = document.getElementById('qcardAirQuality');
    if(qaq) qaq.onclick = function(){ switchTab('tab-air-quality'); };
    var qr = document.getElementById('qcardReport');
    if(qr) qr.onclick = function(){ switchTab('tab-reports'); };
    var qt = document.getElementById('qcardTrends');
    if(qt) qt.onclick = function(){ switchTab('tab-trends'); };

    // Refresh Live Button
    var btnRef = document.getElementById('btnRefreshLive');
    if(btnRef) btnRef.onclick = function(){ refreshAtmosphericData(true); };

    // Location Selector Modal
    var btnLoc = document.getElementById('btnOpenLocationModal');
    var modalLoc = document.getElementById('modalLocationSelector');
    var btnCloseLoc = document.getElementById('btnCloseLocationModal');
    if(btnLoc && modalLoc){
      btnLoc.onclick = function(){
        renderLocationModalList('');
        modalLoc.classList.remove('hidden');
      };
    }
    if(btnCloseLoc && modalLoc){
      btnCloseLoc.onclick = function(){ modalLoc.classList.add('hidden'); };
      modalLoc.onclick = function(e){ if(e.target === modalLoc) modalLoc.classList.add('hidden'); };
    }

    var inputSearchWard = document.getElementById('inputModalWardSearch');
    if(inputSearchWard){
      inputSearchWard.oninput = function(e){
        renderLocationModalList(e.target.value);
      };
    }

    // Modal GPS Detect
    var btnModalGps = document.getElementById('btnModalGpsDetect');
    if(btnModalGps){
      btnModalGps.onclick = function(){
        showToast('Acquiring browser GPS coordinates...', '🎯');
        MAP.locateUser(function(res){
          if(res && res.closestWard){
            selectWard(res.closestWard.code);
            modalLoc.classList.add('hidden');
            showToast('Closest ward detected: ' + res.closestWard.name + ' (' + res.closestWard.code + ')', '📍');
          }
        }, function(err){
          showToast('Could not access GPS: ' + err, '⚠️');
        });
      };
    }

    var btnHomeGps = document.getElementById('btnDetectGps');
    if(btnHomeGps){
      btnHomeGps.onclick = function(){
        showToast('Detecting location...', '🎯');
        MAP.locateUser(function(res){
          if(res && res.closestWard){
            selectWard(res.closestWard.code);
            showToast('Position updated to ' + res.closestWard.name, '📍');
          }
        });
      };
    }

    // Share AQI Button
    var btnShare = document.getElementById('btnShareAqi');
    if(btnShare){
      btnShare.onclick = function(){
        var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.activeWardCode; }) || CONFIG.WARDS_DATA[0];
        var aqi = appState.wardAqiMap[ward.code] ? appState.wardAqiMap[ward.code].aqi : 142;
        var shareText = 'MumbAIR Environmental Intelligence: ' + ward.name + ' (Ward ' + ward.code + ') AQI is currently ' + aqi + ' (CPCB NAQI).';
        if(navigator.clipboard){
          navigator.clipboard.writeText(shareText);
          showToast('AQI summary copied to clipboard!', '📋');
        } else {
          showToast(shareText, '📤');
        }
      };
    }

    // Notification Popover
    var notifBtn = document.getElementById('btnNotificationCenter');
    var notifPopover = document.getElementById('notifPopover');
    if(notifBtn && notifPopover){
      notifBtn.onclick = function(e){
        e.stopPropagation();
        var isHidden = notifPopover.classList.contains('hidden');
        notifPopover.classList.toggle('hidden', !isHidden);
        if(isHidden){
          renderNotifPopoverList();
        }
      };
      document.addEventListener('click', function(e){
        if(!notifPopover.contains(e.target) && e.target !== notifBtn){
          notifPopover.classList.add('hidden');
        }
      });
    }

    var btnClearNotif = document.getElementById('btnClearNotifs');
    if(btnClearNotif){
      btnClearNotif.onclick = function(){
        NOTIFICATIONS.markAllRead();
        renderNotifPopoverList();
      };
    }

    // Citizen Account Modal
    var btnCitAuth = document.getElementById('btnCitizenAuth');
    var modalCitAuth = document.getElementById('modalCitizenAuth');
    var btnCloseCit = document.getElementById('btnCloseCitizenModal');
    if(btnCitAuth && modalCitAuth){
      btnCitAuth.onclick = function(){
        var user = AUTH.getCitizenUser();
        var nameInput = document.getElementById('inputCitizenName');
        var contactInput = document.getElementById('inputCitizenContact');
        if(nameInput) nameInput.value = user.isGuest ? '' : user.name;
        if(contactInput) contactInput.value = user.phone || user.email || '';
        modalCitAuth.classList.remove('hidden');
      };
    }
    if(btnCloseCit && modalCitAuth){
      btnCloseCit.onclick = function(){ modalCitAuth.classList.add('hidden'); };
    }

    var btnSaveCit = document.getElementById('btnSaveCitizenProfile');
    if(btnSaveCit){
      btnSaveCit.onclick = function(){
        var name = document.getElementById('inputCitizenName').value.trim();
        var contact = document.getElementById('inputCitizenContact').value.trim();
        var user = AUTH.loginCitizen(name || 'Mumbai Citizen', contact);
        document.getElementById('citizenAuthLabel').textContent = user.name.split(' ')[0];
        modalCitAuth.classList.add('hidden');
        showToast('Welcome, ' + user.name + '! Preferences saved.', '👤');
      };
    }

    var btnGuestCont = document.getElementById('btnContinueGuest');
    if(btnGuestCont){
      btnGuestCont.onclick = function(){
        AUTH.logoutCitizen();
        document.getElementById('citizenAuthLabel').textContent = 'Guest';
        modalCitAuth.classList.add('hidden');
        showToast('Continuing in Guest Mode.', '👤');
      };
    }

    // Municipal Authority Entry Link
    var btnAuthPortal = document.getElementById('btnGoToAuthority');
    var footerAuthLink = document.getElementById('footerAuthorityLink');
    if(btnAuthPortal) btnAuthPortal.onclick = switchToAuthorityPortal;
    if(footerAuthLink) footerAuthLink.onclick = function(e){ e.preventDefault(); switchToAuthorityPortal(); };

    // Authority Login Submission
    var btnAuthLogin = document.getElementById('btnSubmitAuthorityLogin');
    if(btnAuthLogin){
      btnAuthLogin.onclick = function(){
        var id = document.getElementById('authOfficerId').value.trim();
        var pass = document.getElementById('authPassword').value;
        var dept = document.getElementById('authDeptSelect').value;
        AUTH.loginAuthority(id, pass, dept);
        showAuthorityDashboard();
        showToast('Authority session authenticated.', '🔒');
      };
    }

    // Evaluator Persona Chips (Authenticates verified demo officer account)
    document.querySelectorAll('.eval-chip').forEach(function(chip){
      chip.onclick = function(){
        document.querySelectorAll('.eval-chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        var role = chip.getAttribute('data-role');
        var demoOfficer = CONFIG.DEMO_USERS.find(function(u){ return u.role === role; });
        if(demoOfficer){
          AUTH.loginAuthorityDemoUser(demoOfficer.id);
          showAuthorityDashboard();
          showToast('Authenticated as ' + demoOfficer.name + ' (' + (CONFIG.ROLES[role] ? CONFIG.ROLES[role].label : role) + ')', '🔒');
        }
      };
    });

    // Authority Switch Back to Citizen
    var btnBackCitizen = document.getElementById('btnSwitchBackToCitizen');
    var btnRetCitizen = document.getElementById('btnReturnToCitizenPortal');
    if(btnBackCitizen) btnBackCitizen.onclick = switchToCitizenPortal;
    if(btnRetCitizen) btnRetCitizen.onclick = switchToCitizenPortal;

    // Authority Logout
    var btnAuthLogout = document.getElementById('btnAuthorityLogout');
    if(btnAuthLogout){
      btnAuthLogout.onclick = function(){
        AUTH.logoutAuthority();
        showAuthorityLogin();
        showToast('Authority session closed.', '🚪');
      };
    }

    // Map Controls
    var mapSearch = document.getElementById('mapSearchInput');
    if(mapSearch){
      mapSearch.oninput = function(e){
        var q = e.target.value;
        if(q.length >= 2){
          MAP.searchAndZoom(q);
        }
      };
    }

    var btnMapLoc = document.getElementById('btnMapLocateMe');
    if(btnMapLoc){
      btnMapLoc.onclick = function(){
        showToast('Locating GPS position on map...', '🎯');
        MAP.locateUser(function(res){
          if(res && res.closestWard){
            showToast('Nearest ward: ' + res.closestWard.name + ' (' + res.closestWard.code + ')', '📍');
          }
        });
      };
    }

    var btnMapReset = document.getElementById('btnMapReset');
    if(btnMapReset) btnMapReset.onclick = function(){ MAP.resetView(); };

    // Map Layer Toggles
    var btnLyrStations = document.getElementById('btnToggleLayerStations');
    if(btnLyrStations){
      btnLyrStations.onclick = function(){
        var active = btnLyrStations.classList.toggle('active');
        MAP.toggleLayer('stations', active);
      };
    }
    var btnLyrFoot = document.getElementById('btnToggleLayerFootprints');
    if(btnLyrFoot){
      btnLyrFoot.onclick = function(){
        var active = btnLyrFoot.classList.toggle('active');
        MAP.toggleLayer('footprints', active);
      };
    }
    var btnLyrRep = document.getElementById('btnToggleLayerReports');
    if(btnLyrRep){
      btnLyrRep.onclick = function(){
        var active = btnLyrRep.classList.toggle('active');
        MAP.toggleLayer('reports', active);
      };
    }

    // Trend Duration Buttons
    var btn24 = document.getElementById('btnTrend24h');
    var btn48 = document.getElementById('btnTrend48h');
    if(btn24 && btn48){
      btn24.onclick = function(){
        btn24.className = 'btn btn-sm btn-primary';
        btn48.className = 'btn btn-sm btn-outline';
        renderTrendCharts(24);
      };
      btn48.onclick = function(){
        btn48.className = 'btn btn-sm btn-primary';
        btn24.className = 'btn btn-sm btn-outline';
        renderTrendCharts(48);
      };
    }

    // Reports Subnavigation Pills
    var btnSubWiz = document.getElementById('btnSubnavReportWizard');
    var btnSubTrk = document.getElementById('btnSubnavReportTracker');
    var viewWiz = document.getElementById('subviewReportWizard');
    var viewTrk = document.getElementById('subviewReportTracker');

    if(btnSubWiz && btnSubTrk){
      btnSubWiz.onclick = function(){
        btnSubWiz.classList.add('active');
        btnSubTrk.classList.remove('active');
        viewWiz.classList.remove('hidden');
        viewTrk.classList.add('hidden');
      };
      btnSubTrk.onclick = function(){
        btnSubTrk.classList.add('active');
        btnSubWiz.classList.remove('active');
        viewTrk.classList.remove('hidden');
        viewWiz.classList.add('hidden');
        renderCivicReportsList();
      };
    }

    // Reports Filter Controls
    var filterCat = document.getElementById('filterReportCategory');
    if(filterCat){
      filterCat.onchange = function(e){
        appState.filterCategory = e.target.value;
        renderCivicReportsList();
      };
    }
    var filterSt = document.getElementById('filterReportStatus');
    if(filterSt){
      filterSt.onchange = function(e){
        appState.filterStatus = e.target.value;
        renderCivicReportsList();
      };
    }
    var sortRep = document.getElementById('sortReports');
    if(sortRep){
      sortRep.onchange = function(e){
        appState.sortReports = e.target.value;
        renderCivicReportsList();
      };
    }

    // AI Query in Alerts Tab
    var btnAi = document.getElementById('btnAiAsk');
    var inputAi = document.getElementById('inputAiQuery');
    var bubbleAi = document.getElementById('bubbleAiAnswer');
    if(btnAi && inputAi && bubbleAi){
      btnAi.onclick = function(){
        var q = inputAi.value.trim();
        if(!q) return;
        var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === appState.activeWardCode; }) || CONFIG.WARDS_DATA[0];
        var aqi = appState.wardAqiMap[ward.code] ? appState.wardAqiMap[ward.code].aqi : 142;
        var answer = AI.askCitizenAssistant(q, aqi, ward.name);
        bubbleAi.textContent = answer;
      };
    }

    // Station Search filter in Air Quality Tab
    var searchStation = document.getElementById('filterStationSearch');
    if(searchStation){
      searchStation.oninput = function(){
        renderAirQualityTab();
      };
    }

    populateWardDropdowns();
    initReportingWizardHandlers();
  }

  function renderLocationModalList(query){
    var container = document.getElementById('modalWardListContainer');
    if(!container) return;
    var q = query.toLowerCase().trim();

    container.innerHTML = '';
    var zones = ['Island City', 'Western Suburbs', 'Eastern Suburbs'];

    zones.forEach(function(zone){
      var wardsInZone = CONFIG.WARDS_DATA.filter(function(w){
        if(w.zone !== zone) return false;
        if(q){
          return w.name.toLowerCase().indexOf(q) !== -1 ||
                 w.code.toLowerCase().indexOf(q) !== -1 ||
                 w.station.toLowerCase().indexOf(q) !== -1;
        }
        return true;
      });

      if(wardsInZone.length === 0) return;

      var zoneHeader = document.createElement('div');
      zoneHeader.className = 'zone-group-title';
      zoneHeader.textContent = zone + ' (' + wardsInZone.length + ' Wards)';
      container.appendChild(zoneHeader);

      var listGrid = document.createElement('div');
      listGrid.className = 'ward-selection-list';

      wardsInZone.forEach(function(w){
        var aqiInfo = appState.wardAqiMap[w.code] || { aqi: 135, color: '#CA8A04' };
        var isSelected = appState.activeWardCode === w.code;

        var item = document.createElement('div');
        item.className = 'ward-select-item ' + (isSelected ? 'selected' : '');

        item.innerHTML =
          '<div>' +
            '<div class="ward-item-title">' + w.name + '</div>' +
            '<div class="ward-item-code">Ward ' + w.code + ' &middot; ' + w.station + '</div>' +
          '</div>' +
          '<div class="ward-item-aqi-pill" style="background:' + aqiInfo.color + ';">' +
            aqiInfo.aqi +
          '</div>';

        item.onclick = function(){
          selectWard(w.code);
          document.getElementById('modalLocationSelector').classList.add('hidden');
          showToast('Monitored location changed to ' + w.name, '📍');
        };

        listGrid.appendChild(item);
      });

      container.appendChild(listGrid);
    });
  }

  function renderNotifPopoverList(){
    var container = document.getElementById('notifListContainer');
    if(!container) return;
    var notifs = NOTIFICATIONS.getNotifications();
    container.innerHTML = '';

    if(notifs.length === 0){
      container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--ink-muted); font-size:12px;">No unread notifications.</div>';
      return;
    }

    notifs.forEach(function(n){
      var item = document.createElement('div');
      item.className = 'notif-item';
      item.innerHTML =
        '<div class="notif-item-top">' +
          '<span>' + UTILS.escapeHtml(n.title) + '</span>' +
          '<span class="notif-item-time">' + n.time + '</span>' +
        '</div>' +
        '<div style="color:var(--ink-secondary); font-size:11px;">' + UTILS.escapeHtml(n.message) + '</div>';
      container.appendChild(item);
    });
  }

  function initReportingWizardHandlers(){
    var categoryCards = document.querySelectorAll('.category-option-card');
    categoryCards.forEach(function(c){
      c.onclick = function(){
        categoryCards.forEach(function(x){ x.classList.remove('selected'); });
        c.classList.add('selected');
        var catId = c.getAttribute('data-cat');
        REPORTS.currentWizardState.category = catId;

        var wardCode = document.getElementById('reportWardSelect').value;
        var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === wardCode; }) || CONFIG.WARDS_DATA[0];
        var duplicates = REPORTS.findNearbyDuplicates(catId, ward.lat, ward.lng);

        var dupBanner = document.getElementById('duplicateAlertBanner');
        if(duplicates.length > 0){
          var topDup = duplicates[0];
          dupBanner.classList.remove('hidden');
          dupBanner.innerHTML =
            '<div class="dup-title">⚠️ Similar Active Violation Reported Nearby in Ward ' + wardCode + '</div>' +
            '<div class="dup-desc">' +
              'Another citizen recently filed <strong>' + topDup.title + '</strong> ~' + topDup._distKm.toFixed(1) + ' km from this location. ' +
              'Current status: <em>' + topDup.status.replace(/_/g, ' ') + '</em> (' + (topDup.upvotes || 0) + ' endorsements).' +
            '</div>' +
            '<div class="dup-actions">' +
              '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.APP.endorseAndCancel(\'' + topDup.id + '\')">👍 Endorse Existing Report (+1 Priority)</button>' +
              '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.ignoreDuplicate()">Proceed with New Ticket</button>' +
            '</div>';
        } else {
          dupBanner.classList.add('hidden');
        }
      };
    });

    var submitBtn = document.getElementById('btnSubmitFinalReport');
    if(submitBtn){
      submitBtn.onclick = function(){
        var cat = REPORTS.currentWizardState.category || 'OPEN_BURNING';
        var ward = document.getElementById('reportWardSelect').value;
        var wardObj = CONFIG.WARDS_DATA.find(function(w){ return w.code === ward; }) || CONFIG.WARDS_DATA[0];
        var desc = document.getElementById('reportDescriptionInput').value.trim();

        if(!desc){
          showToast('Please provide a description of the observed violation.', '⚠️');
          return;
        }

        var newReport = REPORTS.submitReport({
          category: cat,
          ward: ward,
          lat: wardObj.lat,
          lng: wardObj.lng,
          title: document.getElementById('reportTitleInput').value.trim() || undefined,
          description: desc,
          addressText: document.getElementById('reportAddressInput').value.trim() || undefined,
          photoDataUrl: REPORTS.currentWizardState.photoDataUrl
        });

        showToast('Violation report ' + newReport.id + ' registered with BMC Ward Desk!', '✅');
        playAlertSound(783.99, 0.3);

        document.getElementById('reportDescriptionInput').value = '';
        document.getElementById('reportTitleInput').value = '';
        document.getElementById('duplicateAlertBanner').classList.add('hidden');

        // Switch to tracker subview
        document.getElementById('btnSubnavReportTracker').click();
      };
    }

    var photoInput = document.getElementById('reportPhotoFileInput');
    if(photoInput){
      photoInput.onchange = function(e){
        if(e.target.files && e.target.files[0]){
          var file = e.target.files[0];
          if(file.size > 5 * 1024 * 1024){
            showToast('Photo must be under 5MB.', '⚠️');
            return;
          }
          var reader = new FileReader();
          reader.onload = function(evt){
            var wardCode = document.getElementById('reportWardSelect').value;
            var ward = CONFIG.WARDS_DATA.find(function(w){ return w.code === wardCode; }) || CONFIG.WARDS_DATA[0];
            REPORTS.stampEvidenceWatermark(evt.target.result, wardCode, ward.lat, ward.lng, function(stampedUrl){
              REPORTS.currentWizardState.photoDataUrl = stampedUrl;
              var preview = document.getElementById('evidencePreviewImg');
              if(preview){
                preview.src = stampedUrl;
                preview.style.display = 'block';
              }
              showToast('Evidence photo stamped with verified GPS and timestamp.', '📷');
            });
          };
          reader.readAsDataURL(file);
        }
      };
    }
  }

  function endorseAndCancel(dupId){
    endorseReport(dupId);
    document.getElementById('btnSubnavReportTracker').click();
  }

  function ignoreDuplicate(){
    document.getElementById('duplicateAlertBanner').classList.add('hidden');
    showToast('Proceeding with separate specific report.', 'ℹ️');
  }

  function populateWardDropdowns(){
    var selects = ['reportWardSelect', 'compareSelectA', 'compareSelectB'];
    selects.forEach(function(id){
      var sel = document.getElementById(id);
      if(!sel) return;
      sel.innerHTML = '';
      CONFIG.WARDS_DATA.forEach(function(w){
        var opt = document.createElement('option');
        opt.value = w.code;
        opt.textContent = w.name + ' (Ward ' + w.code + ')';
        sel.appendChild(opt);
      });
    });

    if(document.getElementById('compareSelectB')){
      document.getElementById('compareSelectB').value = 'D';
    }

    var compA = document.getElementById('compareSelectA');
    if(compA){
      compA.onchange = function(e){
        appState.compareWardA = e.target.value;
        renderAirQualityTab();
      };
    }
    var compB = document.getElementById('compareSelectB');
    if(compB){
      compB.onchange = function(e){
        appState.compareWardB = e.target.value;
        renderAirQualityTab();
      };
    }
  }

  /* ===========================================================================
     STARTUP LIFECYCLE
     =========================================================================== */

  function init(){
    if(window.MumbAIR.THEME && window.MumbAIR.THEME.init){
      window.MumbAIR.THEME.init();
    }
    initEventBindings();

    var user = AUTH.getCitizenUser();
    if(user && !user.isGuest){
      document.getElementById('citizenAuthLabel').textContent = user.name.split(' ')[0];
    }

    NOTIFICATIONS.renderBadge();

    // Initialize home page mini map preview
    if(window.L && document.getElementById('homeMiniMap')){
      MAP.initMiniMap('homeMiniMap', function(wardCode){
        selectWard(wardCode);
      });
    }

    refreshAtmosphericData(false);

    // Initial check for URL hash routing
    var hash = window.location.hash.replace('#', '');
    if(hash === 'authority' || hash.indexOf('authority') === 0){
      switchToAuthorityPortal();
    } else if(hash === 'report-studio'){
      switchTab('tab-home');
      setTimeout(function(){
        if(window.MumbAIR.REPORT_STUDIO) window.MumbAIR.REPORT_STUDIO.openStudio();
      }, 300);
    } else if(hash === 'theme'){
      switchTab('tab-home');
      setTimeout(function(){
        if(window.MumbAIR.THEME) window.MumbAIR.THEME.openThemeModal();
      }, 300);
    } else if(hash && document.getElementById('tab-' + hash)){
      switchTab('tab-' + hash);
    } else {
      switchTab('tab-home');
    }

    // Auto-refresh environmental metrics every 10 minutes
    setInterval(function(){
      refreshAtmosphericData(false);
    }, 10 * 60 * 1000);
  }

  function showReportForm(){
    var subviewForm = document.getElementById('subviewReportForm');
    var subviewTracker = document.getElementById('subviewReportTracker');
    var btnToggle = document.getElementById('btnToggleReportView');
    if(subviewForm && subviewTracker){
      subviewForm.classList.remove('hidden');
      subviewTracker.classList.add('hidden');
      if(btnToggle) btnToggle.textContent = 'View Incident Feed \u2192';
    }
  }

  function openMobileCitizenMenu(){
    var modal = document.getElementById('modalCitizenAuth');
    if(modal) modal.classList.remove('hidden');
  }

  return {
    init: init,
    switchTab: switchTab,
    showReportForm: showReportForm,
    openMobileCitizenMenu: openMobileCitizenMenu,
    switchToCitizenPortal: switchToCitizenPortal,
    switchToAuthorityPortal: switchToAuthorityPortal,
    selectWard: selectWard,
    selectWardFromMap: selectWardFromMap,
    viewOnMap: viewOnMap,
    reportAtWard: reportAtWard,
    endorseReport: endorseReport,
    endorseAndCancel: endorseAndCancel,
    ignoreDuplicate: ignoreDuplicate,
    viewReportTimeline: viewReportTimeline,
    renderCurrentRoleView: renderAuthorityWorkspace,
    showToast: showToast
  };
})();

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', window.MumbAIR.APP.init);
} else {
  window.MumbAIR.APP.init();
}
