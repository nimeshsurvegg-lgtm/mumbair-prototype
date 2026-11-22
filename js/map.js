/* ==============================================================================
   MumbAIR — Map Layer (Leaflet Interactive Visualization & Vector Geometry)
   Resilient tile loading, embedded Mumbai geography, automatic resize invalidation
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.MAP = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var UTILS = window.MumbAIR.UTILS;

  var mapInstance = null;
  var miniMapInstance = null;
  var wardMarkersLayer = null;
  var footprintLayer = null;
  var reportMarkersLayer = null;
  var userLocationLayer = null;
  var markersMap = {}; // Maps ward code to Leaflet marker instance

  // Simplified Mumbai coastline & land boundary coordinates for offline/reliable rendering
  var MUMBAI_COASTLINE_COORDS = [
    [18.9000, 72.8100], [18.9150, 72.8140], [18.9400, 72.8220], [18.9700, 72.8100],
    [19.0100, 72.8150], [19.0600, 72.8250], [19.1200, 72.8200], [19.1700, 72.8250],
    [19.2400, 72.8300], [19.2900, 72.8600], [19.2700, 72.9300], [19.1900, 72.9700],
    [19.1200, 72.9600], [19.0500, 72.9300], [18.9800, 72.8700], [18.9300, 72.8400],
    [18.9000, 72.8100]
  ];

  function initMap(containerId, onWardSelect, onReportSelect){
    if(!window.L){
      console.warn('Leaflet (L) library not detected; check vendor/leaflet/leaflet.js');
      return null;
    }

    var mapEl = document.getElementById(containerId);
    if(!mapEl) return null;

    if(mapInstance){
      try {
        mapInstance.remove();
      } catch(e) {}
      mapInstance = null;
      markersMap = {};
    }

    // Initialize Map centered on Greater Mumbai
    mapInstance = L.map(containerId, {
      center: [CONFIG.DEFAULT_COORDS.lat, CONFIG.DEFAULT_COORDS.lng],
      zoom: 11,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Base tile layers (100% free, zero API key required, zero referer blocks from file:// or localhost)
    var esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: '&copy; Esri &mdash; Mumbai Street Map'
    });

    var esriCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: '&copy; Esri &mdash; Light Gray Canvas'
    });

    var osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &middot; HOT'
    });

    // Default to detailed street map
    esriStreet.addTo(mapInstance);

    // Add Basemap switcher control
    L.control.layers({
      "🗺️ Detailed Streets (Esri)": esriStreet,
      "🎨 Light Canvas (Esri)": esriCanvas,
      "🌍 Humanitarian (OSM HOT)": osmHot
    }, null, { position: 'topright', collapsed: true }).addTo(mapInstance);

    // Vector Coastline Boundary polygon (provides geographic context even if offline)
    L.polygon(MUMBAI_COASTLINE_COORDS, {
      color: '#0D9488',
      weight: 1.5,
      fillColor: '#0D9488',
      fillOpacity: 0.04,
      dashArray: '4, 4'
    }).addTo(mapInstance);

    // Layer Groups
    footprintLayer = L.layerGroup().addTo(mapInstance);
    wardMarkersLayer = L.layerGroup().addTo(mapInstance);
    reportMarkersLayer = L.layerGroup().addTo(mapInstance);
    userLocationLayer = L.layerGroup().addTo(mapInstance);

    invalidateSize();

    return mapInstance;
  }

  function initMiniMap(containerId, onWardSelect){
    if(!window.L) return null;
    var mapEl = document.getElementById(containerId);
    if(!mapEl) return null;

    if(miniMapInstance){
      try { miniMapInstance.remove(); } catch(e) {}
      miniMapInstance = null;
    }

    miniMapInstance = L.map(containerId, {
      center: [19.0760, 72.8777],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false
    });

    var miniTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18
    });
    miniTiles.addTo(miniMapInstance);

    L.polygon(MUMBAI_COASTLINE_COORDS, {
      color: '#0D9488',
      weight: 1,
      fillColor: '#0D9488',
      fillOpacity: 0.05
    }).addTo(miniMapInstance);

    return miniMapInstance;
  }

  function invalidateSize(){
    if(mapInstance){
      setTimeout(function(){
        try { mapInstance.invalidateSize(); } catch(e) {}
      }, 100);
    }
    if(miniMapInstance){
      setTimeout(function(){
        try { miniMapInstance.invalidateSize(); } catch(e) {}
      }, 100);
    }
  }

  function renderWardMarkers(wardsData, wardAqiMap, onWardSelect){
    if(!wardMarkersLayer || !footprintLayer) return;
    wardMarkersLayer.clearLayers();
    footprintLayer.clearLayers();
    markersMap = {};

    wardsData.forEach(function(w){
      var aqiInfo = (wardAqiMap && wardAqiMap[w.code]) ? wardAqiMap[w.code] : { aqi: 135, color: '#CA8A04', category: 'Moderate' };

      // High-contrast custom HTML pin
      var iconHtml =
        '<div class="ward-map-marker" style="background:' + aqiInfo.color + '; width:34px; height:34px;">' +
          '<div class="marker-code">' + w.code + '</div>' +
          '<div class="marker-aqi">' + aqiInfo.aqi + '</div>' +
        '</div>';

      var customIcon = L.divIcon({
        className: 'custom-ward-pin',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });

      var marker = L.marker([w.lat, w.lng], { icon: customIcon });

      var popupHtml =
        '<div style="min-width:200px;">' +
          '<div class="popup-ward-title">' + w.name + ' (Ward ' + w.code + ')</div>' +
          '<div class="popup-aqi-stat" style="color:' + aqiInfo.color + '">AQI ' + aqiInfo.aqi + ' &middot; ' + aqiInfo.category + '</div>' +
          '<div style="font-size:11px; color:#64748B;">Zone: ' + w.zone + ' &middot; ' + w.station + '</div>' +
          '<div style="margin:7px 0; font-size:11.5px; line-height:1.4;">' +
            '<strong>Local vectors:</strong> ' + w.defaultCause +
          '</div>' +
          '<div style="display:flex; gap:6px; margin-top:10px;">' +
            '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.APP.selectWardFromMap(\'' + w.code + '\')">Select Ward</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.reportAtWard(\'' + w.code + '\')">Report Violation</button>' +
          '</div>' +
        '</div>';

      marker.bindPopup(popupHtml);

      marker.on('click', function(){
        if(typeof onWardSelect === 'function') onWardSelect(w.code);
      });

      wardMarkersLayer.addLayer(marker);
      markersMap[w.code] = marker;

      // Model dispersion footprint circle
      var circle = L.circle([w.lat, w.lng], {
        color: aqiInfo.color,
        fillColor: aqiInfo.color,
        fillOpacity: 0.12,
        radius: 1200,
        weight: 1.5
      });
      footprintLayer.addLayer(circle);

      // Render simplified dot marker on mini map if initialized
      if(miniMapInstance){
        var miniDot = L.circleMarker([w.lat, w.lng], {
          radius: 5,
          fillColor: aqiInfo.color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9
        });
        miniDot.addTo(miniMapInstance);
      }
    });
  }

  function renderReportMarkers(reports, onReportSelect){
    if(!reportMarkersLayer) return;
    reportMarkersLayer.clearLayers();

    reports.forEach(function(r){
      if(!r.latitude || !r.longitude) return;

      var iconMap = {
        OPEN_BURNING: '🔥',
        CONSTRUCTION_DUST: '🏗️',
        INDUSTRIAL_EMISSIONS: '🏭',
        VEHICLE_POLLUTION: '🚛',
        SMOKE_LANDFILL: '⛰️',
        SENSOR_ISSUE: '📍'
      };

      var emoji = iconMap[r.category] || '⚠️';
      var iconHtml = '<div class="report-map-marker">' + emoji + '</div>';

      var customIcon = L.divIcon({
        className: 'custom-report-pin',
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
      });

      var marker = L.marker([r.latitude, r.longitude], { icon: customIcon });

      var popupHtml =
        '<div style="min-width:190px;">' +
          '<div style="font-weight:700; font-size:12.5px; color:#DC2626;">' + r.id + ' &middot; ' + (r.title || 'Civic Violation') + '</div>' +
          '<div style="font-size:11px; color:#64748B; margin-top:2px;">Ward ' + r.ward + ' &middot; Status: ' + (r.status.replace(/_/g, ' ')) + '</div>' +
          '<div style="font-size:11.5px; margin:6px 0; line-height:1.4;">' + r.description + '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">' +
            '<span style="font-size:11px; font-weight:700; color:#0D9488;">👍 ' + (r.upvotes || 0) + ' Endorsements</span>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.viewReportTimeline(\'' + r.id + '\')">Details</button>' +
          '</div>' +
        '</div>';

      marker.bindPopup(popupHtml);
      reportMarkersLayer.addLayer(marker);
    });
  }

  function searchAndZoom(query){
    if(!mapInstance || !query) return null;
    var q = query.trim().toLowerCase();

    var matched = CONFIG.WARDS_DATA.find(function(w){
      return w.code.toLowerCase() === q ||
             w.name.toLowerCase().indexOf(q) !== -1 ||
             w.station.toLowerCase().indexOf(q) !== -1 ||
             (w.nameMr && w.nameMr.indexOf(q) !== -1);
    });

    if(matched){
      mapInstance.setView([matched.lat, matched.lng], 14, { animate: true });
      if(markersMap[matched.code]){
        setTimeout(function(){
          markersMap[matched.code].openPopup();
        }, 300);
      }
      return matched;
    }

    return null;
  }

  function locateUser(onFound, onError){
    if(!navigator.geolocation){
      if(typeof onError === 'function') onError('Geolocation not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(pos){
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;

        if(!userLocationLayer) return;
        userLocationLayer.clearLayers();

        var userIcon = L.divIcon({
          className: 'user-gps-container',
          html: '<div class="user-gps-marker"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        var userMarker = L.marker([lat, lng], { icon: userIcon });
        userMarker.bindPopup('<strong>Your Current Position</strong><br>GPS Accuracy: ' + Math.round(pos.coords.accuracy) + 'm');
        userLocationLayer.addLayer(userMarker);

        // Find nearest ward
        var closestWard = null;
        var minDistance = Infinity;

        CONFIG.WARDS_DATA.forEach(function(w){
          var dist = UTILS.haversineDistance(lat, lng, w.lat, w.lng);
          if(dist < minDistance){
            minDistance = dist;
            closestWard = w;
          }
        });

        if(mapInstance){
          mapInstance.setView([lat, lng], 13, { animate: true });
          setTimeout(function(){ userMarker.openPopup(); }, 300);
        }

        if(typeof onFound === 'function') onFound({ lat: lat, lng: lng, closestWard: closestWard, distanceKm: minDistance });
      },
      function(err){
        if(typeof onError === 'function') onError(err.message);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  function toggleLayer(layerName, show){
    if(!mapInstance) return;
    if(layerName === 'stations' && wardMarkersLayer){
      if(show) mapInstance.addLayer(wardMarkersLayer);
      else mapInstance.removeLayer(wardMarkersLayer);
    } else if(layerName === 'footprints' && footprintLayer){
      if(show) mapInstance.addLayer(footprintLayer);
      else mapInstance.removeLayer(footprintLayer);
    } else if(layerName === 'reports' && reportMarkersLayer){
      if(show) mapInstance.addLayer(reportMarkersLayer);
      else mapInstance.removeLayer(reportMarkersLayer);
    }
  }

  function resetView(){
    if(!mapInstance) return;
    mapInstance.setView([CONFIG.DEFAULT_COORDS.lat, CONFIG.DEFAULT_COORDS.lng], 11, { animate: true });
  }

  return {
    initMap: initMap,
    initMiniMap: initMiniMap,
    invalidateSize: invalidateSize,
    renderWardMarkers: renderWardMarkers,
    renderReportMarkers: renderReportMarkers,
    searchAndZoom: searchAndZoom,
    locateUser: locateUser,
    toggleLayer: toggleLayer,
    resetView: resetView
  };
})();
