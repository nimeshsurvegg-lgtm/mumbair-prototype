/* ==============================================================================
   MumbAIR — Map Layer (Leaflet Geospatial Engine, Verified Stations & Real Reports)
   Accurate CAAQMS stations, actual complaint coordinates & XSS-hardened popups
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.MAP = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var UTILS = window.MumbAIR.UTILS;

  var mapInstance = null;
  var miniMapInstance = null;
  var wardMarkersLayer = null;
  var reportMarkersLayer = null;
  var userLocationLayer = null;
  var markersMap = {};

  // Greater Mumbai Coastal Outline Vector (Cartographic reference)
  var MUMBAI_COASTLINE_COORDS = [
    [18.8950, 72.8100], [18.9100, 72.8050], [18.9300, 72.8150],
    [18.9500, 72.7950], [18.9800, 72.8050], [19.0050, 72.8150],
    [19.0350, 72.8250], [19.0650, 72.8300], [19.1000, 72.8200],
    [19.1350, 72.8100], [19.1750, 72.8050], [19.2150, 72.8000],
    [19.2550, 72.8100], [19.2900, 72.8350], [19.2950, 72.8750],
    [19.2700, 72.9350], [19.2250, 72.9750], [19.1750, 72.9800],
    [19.1300, 72.9550], [19.0850, 72.9250], [19.0550, 72.9150],
    [19.0300, 72.8950], [18.9950, 72.8650], [18.9550, 72.8450],
    [18.9150, 72.8350], [18.8950, 72.8100]
  ];

  function initMap(containerId, onWardSelect){
    if(!window.L) {
      console.warn('Leaflet vendor library not loaded.');
      return null;
    }

    var mapEl = document.getElementById(containerId);
    if(!mapEl) return null;

    if(mapInstance){
      try { mapInstance.remove(); } catch(e) {}
      mapInstance = null;
    }

    mapInstance = L.map(containerId, {
      center: [CONFIG.DEFAULT_COORDS.lat, CONFIG.DEFAULT_COORDS.lng],
      zoom: 11,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true
    });

    // Valid tile providers
    var esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, HERE, Garmin, USGS',
      maxZoom: 18
    });

    var esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 18
    });

    var esriCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, HERE, DeLorme, MapmyIndia',
      maxZoom: 16
    });

    var osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, HOT',
      maxZoom: 18
    });

    // Default to detailed street map
    esriStreet.addTo(mapInstance);

    // Vector Coastline Boundary polygon
    L.polygon(MUMBAI_COASTLINE_COORDS, {
      color: '#0EA5E9',
      weight: 1.5,
      fillColor: '#0EA5E9',
      fillOpacity: 0.04,
      dashArray: '4, 4'
    }).addTo(mapInstance);

    // Layer Groups
    wardMarkersLayer = L.layerGroup().addTo(mapInstance);
    reportMarkersLayer = L.layerGroup().addTo(mapInstance);
    userLocationLayer = L.layerGroup().addTo(mapInstance);

    // Basemap & Layer Control
    L.control.layers({
      "🗺️ Detailed Streets": esriStreet,
      "🛰️ Satellite Imagery": esriSatellite,
      "🎨 Light Canvas": esriCanvas,
      "🌍 OpenStreetMap": osmHot
    }, {
      "🏛️ CAAQMS Monitoring Nodes (24 Wards)": wardMarkersLayer,
      "🚨 Citizen Reports (Actual GPS Coordinates)": reportMarkersLayer
    }, { position: 'topright', collapsed: true }).addTo(mapInstance);

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
      color: '#0EA5E9',
      weight: 1,
      fillColor: '#0EA5E9',
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
    if(!wardMarkersLayer) return;
    wardMarkersLayer.clearLayers();
    markersMap = {};

    wardsData.forEach(function(w){
      var aqiInfo = (wardAqiMap && wardAqiMap[w.code]) ? wardAqiMap[w.code] : { aqi: 135, color: '#CA8A04', category: 'Moderate' };

      var safeCode = UTILS.escapeHtml(w.code);
      var safeName = UTILS.escapeHtml(w.name);
      var safeStation = UTILS.escapeHtml(w.station);
      var safeZone = UTILS.escapeHtml(w.zone);
      var safeCause = UTILS.escapeHtml(w.defaultCause);

      var iconHtml =
        '<div class="ward-map-marker" style="background:' + aqiInfo.color + '; width:34px; height:34px;">' +
          '<div class="marker-code">' + safeCode + '</div>' +
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
        '<div style="min-width:210px;">' +
          '<div class="popup-ward-title">' + safeName + ' (Ward ' + safeCode + ')</div>' +
          '<div class="popup-aqi-stat" style="color:' + aqiInfo.color + '">CPCB NAQI ' + aqiInfo.aqi + ' &middot; ' + aqiInfo.category + '</div>' +
          '<div style="font-size:11px; color:#64748B;">Station: ' + safeStation + ' &middot; ' + safeZone + '</div>' +
          '<div style="margin:7px 0; font-size:11.5px; line-height:1.4;">' +
            '<strong>Local environmental context:</strong> ' + safeCause +
          '</div>' +
          '<div style="display:flex; gap:6px; margin-top:10px;">' +
            '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.APP.selectWardFromMap(\'' + safeCode + '\')">Select Ward</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.reportAtWard(\'' + safeCode + '\')">Report Violation</button>' +
          '</div>' +
        '</div>';

      marker.bindPopup(popupHtml);

      marker.on('click', function(){
        if(typeof onWardSelect === 'function') onWardSelect(w.code);
      });

      wardMarkersLayer.addLayer(marker);
      markersMap[w.code] = marker;

      // Mini map dot
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

    var validReports = (reports || []).filter(function(r){
      return r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude);
    });

    validReports.forEach(function(r){
      var cat = (CONFIG.CATEGORIES && CONFIG.CATEGORIES.find(function(c){ return c.id === r.category; })) || { icon: '📍', label: r.category };

      var pinColor = '#EF4444';
      if(r.status === 'RESOLVED' || r.status === 'CLOSED') pinColor = '#10B981';
      else if(r.status === 'IN_PROGRESS' || r.status === 'RESOLUTION_SUBMITTED') pinColor = '#F59E0B';

      var markerHtml =
        '<div class="report-map-marker" style="background:' + pinColor + '; border:2px solid #FFFFFF; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px;">' +
          cat.icon +
        '</div>';

      var reportIcon = L.divIcon({
        className: 'custom-report-pin',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      // Use actual GPS coordinates
      var marker = L.marker([r.latitude, r.longitude], { icon: reportIcon });

      var safeTitle = UTILS.escapeHtml(r.title);
      var safeDesc = UTILS.escapeHtml(r.description);
      var safeAddress = UTILS.escapeHtml(r.addressText);
      var safeWard = UTILS.escapeHtml(r.ward);
      var safeStatus = UTILS.escapeHtml(r.status);
      var safeId = UTILS.escapeHtml(r.id);

      var popupHtml =
        '<div style="min-width:210px;">' +
          '<div style="font-weight:700; font-size:13px; color:#0F172A;">' + cat.icon + ' ' + safeTitle + '</div>' +
          '<div style="font-size:11px; color:#64748B; margin-top:2px;">ID: ' + safeId + ' &middot; Ward ' + safeWard + ' &middot; ' + safeStatus.replace(/_/g, ' ') + '</div>' +
          '<div style="font-size:11.5px; color:#334155; margin:6px 0; line-height:1.35;">' + safeDesc + '</div>' +
          '<div style="font-size:11px; color:#64748B;">📍 ' + safeAddress + '</div>' +
          '<div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">' +
            '<span style="font-size:11px; font-weight:600; color:#0EA5E9;">👍 ' + (r.upvotes || 0) + ' endorsements</span>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.APP.showComplaintDetailModal(\'' + safeId + '\')">View Dossier</button>' +
          '</div>' +
        '</div>';

      marker.bindPopup(popupHtml);
      reportMarkersLayer.addLayer(marker);
    });
  }

  function flyToWard(wardCode, zoomLevel){
    var ward = (CONFIG.WARDS_DATA || []).find(function(w){ return w.code === wardCode; });
    if(ward && mapInstance){
      mapInstance.flyTo([ward.lat, ward.lng], zoomLevel || 13, { duration: 1.2 });
      var marker = markersMap[wardCode];
      if(marker){
        setTimeout(function(){ marker.openPopup(); }, 1200);
      }
    }
  }

  function locateUser(onSuccess, onError){
    if(!navigator.geolocation){
      if(typeof onError === 'function') onError({ code: 0, message: 'Geolocation not supported by browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(function(pos){
      if(mapInstance){
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var acc = pos.coords.accuracy;

        userLocationLayer.clearLayers();

        var userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: '#0EA5E9',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95
        });

        userMarker.bindPopup('<strong>Your Current Position</strong><br>GPS Accuracy: ' + Math.round(acc) + 'm');
        userLocationLayer.addLayer(userMarker);

        // Accuracy circle
        var accCircle = L.circle([lat, lng], {
          radius: acc,
          color: '#0EA5E9',
          fillColor: '#0EA5E9',
          fillOpacity: 0.15,
          weight: 1
        });
        userLocationLayer.addLayer(accCircle);

        mapInstance.flyTo([lat, lng], 13, { duration: 1.2 });
      }
      if(typeof onSuccess === 'function') onSuccess(pos);
    }, function(err){
      if(typeof onError === 'function') onError(err);
    }, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000
    });
  }

  function toggleFullscreen(wrapperId){
    var wrapper = document.getElementById(wrapperId || 'mapCanvasWrapper');
    if(!wrapper) return;
    if(!document.fullscreenElement){
      if(wrapper.requestFullscreen){
        wrapper.requestFullscreen().then(function(){ invalidateSize(); });
      }
    } else {
      if(document.exitFullscreen){
        document.exitFullscreen().then(function(){ invalidateSize(); });
      }
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
    flyToWard: flyToWard,
    locateUser: locateUser,
    toggleFullscreen: toggleFullscreen,
    resetView: resetView
  };
})();
