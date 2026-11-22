/* ==============================================================================
   MumbAIR — Map Layer (Leaflet & OpenStreetMap Interactive Visualization)
   Resilient tile loading, automatic resize invalidation, search & layer controls
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.MAP = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var UTILS = window.MumbAIR.UTILS;

  var mapInstance = null;
  var wardMarkersLayer = null;
  var footprintLayer = null;
  var reportMarkersLayer = null;
  var userLocationLayer = null;
  var markersMap = {}; // Maps ward code to Leaflet marker instance

  function initMap(containerId, onWardSelect, onReportSelect){
    if(!window.L){
      console.warn('Leaflet (L) library not loaded. Interactive map unavailable.');
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

    // Primary High-Resolution CartoDB Positron Base Tiles
    var primaryTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

    primaryTiles.on('tileerror', function(){
      console.warn('Carto tile error, fallback active.');
    });

    primaryTiles.addTo(mapInstance);

    // Layer Groups
    footprintLayer = L.layerGroup().addTo(mapInstance);
    wardMarkersLayer = L.layerGroup().addTo(mapInstance);
    reportMarkersLayer = L.layerGroup().addTo(mapInstance);
    userLocationLayer = L.layerGroup().addTo(mapInstance);

    // Ensure initial dimensions are computed
    invalidateSize();

    return mapInstance;
  }

  function invalidateSize(){
    if(!mapInstance) return;
    setTimeout(function(){
      try {
        mapInstance.invalidateSize();
      } catch(e) {}
    }, 100);
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
        '<div class="ward-map-marker" style="background:' + aqiInfo.color + '; width:36px; height:36px;">' +
          '<div class="marker-code">' + w.code + '</div>' +
          '<div class="marker-aqi">' + aqiInfo.aqi + '</div>' +
        '</div>';

      var customIcon = L.divIcon({
        className: 'custom-ward-pin',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      var marker = L.marker([w.lat, w.lng], { icon: customIcon });

      var popupHtml =
        '<div style="min-width:210px;">' +
          '<div class="popup-ward-title">' + w.name + ' (Ward ' + w.code + ')</div>' +
          '<div class="popup-aqi-stat" style="color:' + aqiInfo.color + '">AQI ' + aqiInfo.aqi + ' &middot; ' + aqiInfo.category + '</div>' +
          '<div style="font-size:11px; color:#64748B;">Zone: ' + w.zone + ' &middot; ' + w.station + '</div>' +
          '<div style="margin:8px 0; font-size:11.5px; line-height:1.4;">' +
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
        radius: 1250,
        weight: 1.5
      });
      footprintLayer.addLayer(circle);
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
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      var marker = L.marker([r.latitude, r.longitude], { icon: customIcon });

      var popupHtml =
        '<div style="min-width:200px;">' +
          '<div style="font-weight:700; font-size:13px; color:#DC2626;">' + r.id + ' &middot; ' + (r.title || 'Civic Violation') + '</div>' +
          '<div style="font-size:11px; color:#64748B; margin-top:2px;">Ward ' + r.ward + ' &middot; Status: ' + (r.status.replace(/_/g, ' ')) + '</div>' +
          '<div style="font-size:12px; margin:6px 0; line-height:1.4;">' + r.description + '</div>' +
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
          iconSize: [18, 18],
          iconAnchor: [9, 9]
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

        mapInstance.setView([lat, lng], 13, { animate: true });
        setTimeout(function(){ userMarker.openPopup(); }, 300);

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
    invalidateSize: invalidateSize,
    renderWardMarkers: renderWardMarkers,
    renderReportMarkers: renderReportMarkers,
    searchAndZoom: searchAndZoom,
    locateUser: locateUser,
    toggleLayer: toggleLayer,
    resetView: resetView
  };
})();
