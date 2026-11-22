/* ==============================================================================
   MumbAIR — Utils & Scientific Calculation Functions
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.UTILS = (function(){
  'use strict';

  var CPCB_BREAKPOINTS = window.MumbAIR.CONFIG.CPCB_BREAKPOINTS;
  var US_AQI_CATEGORIES = window.MumbAIR.CONFIG.US_AQI_CATEGORIES;

  /**
   * Calculate great-circle distance between two GPS coordinates using Haversine formula
   * @returns {number} distance in kilometers
   */
  function haversineDistance(lat1, lon1, lat2, lon2){
    var R = 6371; // Earth radius in km
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate CPCB Sub-Index for a given pollutant concentration
   * Formula: Ip = [ (I_HI - I_LO) / (B_HI - B_LO) ] * (Cp - B_LO) + I_LO
   */
  function calcSubIndex(pollutantKey, conc){
    var breakpoints = CPCB_BREAKPOINTS[pollutantKey];
    if(!breakpoints || conc === null || conc === undefined || isNaN(conc)) return null;

    var c = Math.max(0, conc);
    for(var i = 0; i < breakpoints.length; i++){
      var b = breakpoints[i];
      if(c >= b.bpLow && c <= b.bpHigh){
        var subIndex = ((b.iHigh - b.iLow) / (b.bpHigh - b.bpLow)) * (c - b.bpLow) + b.iLow;
        return Math.round(subIndex);
      }
    }
    // If above highest breakpoint
    var last = breakpoints[breakpoints.length - 1];
    return Math.min(500, Math.round(last.iHigh));
  }

  /**
   * Compute official Indian National AQI from pollutant array
   * CPCB Requirement: AQI requires at least 3 parameters, with at least one being PM2.5 or PM10
   */
  function calculateIndianAqi(pollutants){
    var pm25 = pollutants.pm25;
    var pm10 = pollutants.pm10;
    var no2 = pollutants.no2;

    var sub25 = calcSubIndex('PM25', pm25);
    var sub10 = calcSubIndex('PM10', pm10);
    var subNo2 = calcSubIndex('NO2', no2);

    var subIndices = [];
    if(sub25 !== null) subIndices.push({ key: 'PM2.5', val: sub25, conc: pm25, unit: 'µg/m³' });
    if(sub10 !== null) subIndices.push({ key: 'PM10', val: sub10, conc: pm10, unit: 'µg/m³' });
    if(subNo2 !== null) subIndices.push({ key: 'NO2', val: subNo2, conc: no2, unit: 'µg/m³' });

    if(subIndices.length === 0) return { aqi: null, dominant: 'N/A', category: 'Unknown', isOfficial: false };

    // Max sub-index determines overall AQI
    subIndices.sort(function(a, b){ return b.val - a.val; });
    var maxSub = subIndices[0];
    var aqi = maxSub.val;

    var category = 'Good';
    var color = '#16A34A';
    if(aqi <= 50) { category = 'Good'; color = '#16A34A'; }
    else if(aqi <= 100) { category = 'Satisfactory'; color = '#65A30D'; }
    else if(aqi <= 200) { category = 'Moderate'; color = '#CA8A04'; }
    else if(aqi <= 300) { category = 'Poor'; color = '#EA580C'; }
    else if(aqi <= 400) { category = 'Very Poor'; color = '#DC2626'; }
    else { category = 'Severe'; color = '#7F1D1D'; }

    return {
      aqi: aqi,
      dominant: maxSub.key,
      category: category,
      color: color,
      isOfficial: (subIndices.length >= 3 && (sub25 !== null || sub10 !== null)),
      subIndices: subIndices
    };
  }

  /**
   * Determine category from US AQI value
   */
  function getUsAqiCategory(val){
    if(val === null || val === undefined || isNaN(val)) return US_AQI_CATEGORIES[0];
    for(var i = 0; i < US_AQI_CATEGORIES.length; i++){
      var c = US_AQI_CATEGORIES[i];
      if(val <= c.max) return c;
    }
    return US_AQI_CATEGORIES[US_AQI_CATEGORIES.length - 1];
  }

  function formatTime(isoOrDate){
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(isoOrDate){
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function relativeTime(isoDate){
    if(!isoDate) return 'Just now';
    var diffMs = Date.now() - new Date(isoDate).getTime();
    var diffMins = Math.floor(diffMs / (60 * 1000));
    if(diffMins < 1) return 'Just now';
    if(diffMins < 60) return diffMins + 'm ago';
    var diffHours = Math.floor(diffMins / 60);
    if(diffHours < 24) return diffHours + 'h ago';
    var diffDays = Math.floor(diffHours / 24);
    return diffDays + 'd ago';
  }

  function escapeHtml(str){
    if(!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    haversineDistance: haversineDistance,
    calcSubIndex: calcSubIndex,
    calculateIndianAqi: calculateIndianAqi,
    getUsAqiCategory: getUsAqiCategory,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    relativeTime: relativeTime,
    escapeHtml: escapeHtml
  };
})();
