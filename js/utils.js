/* ==============================================================================
   MumbAIR — Utils & Scientific Calculation Functions (CPCB NAQI Standard & Security)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.UTILS = (function(){
  'use strict';

  function getBreakpoints(){
    return (window.MumbAIR.CONFIG && window.MumbAIR.CONFIG.CPCB_BREAKPOINTS) || {};
  }

  /**
   * Calculate great-circle distance between two GPS coordinates using Haversine formula
   * @returns {number} distance in kilometers
   */
  function haversineDistance(lat1, lon1, lat2, lon2){
    if(lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 999999;
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
    var breakpoints = getBreakpoints()[pollutantKey];
    if(!breakpoints || conc === null || conc === undefined || isNaN(conc)) return null;

    var c = Math.max(0, Number(conc));

    // CO unit normalization: CPCB uses mg/m³. If concentration is passed in µg/m³ (> 50), normalize to mg/m³
    if(pollutantKey === 'CO' && c > 50){
      c = c / 1000;
    }

    for(var i = 0; i < breakpoints.length; i++){
      var b = breakpoints[i];
      if(c >= b.bpLow && c <= b.bpHigh){
        var subIndex = ((b.iHigh - b.iLow) / (b.bpHigh - b.bpLow)) * (c - b.bpLow) + b.iLow;
        return Math.round(subIndex);
      }
    }
    // If above highest recorded regulatory breakpoint
    var last = breakpoints[breakpoints.length - 1];
    if(c > last.bpHigh){
      return Math.min(500, Math.round(last.iHigh));
    }
    return null;
  }

  /**
   * Compute official Indian National AQI from pollutant array
   * CPCB Standard:
   * 1. Sub-index calculated for each pollutant
   * 2. Overall AQI = max(sub-indices)
   * 3. At least 3 pollutants must be monitored, of which at least one MUST be PM2.5 or PM10
   */
  function calculateIndianAqi(pollutants){
    if(!pollutants || typeof pollutants !== 'object'){
      return { aqi: null, dominant: 'N/A', category: 'Unavailable', color: '#64748B', isOfficial: false, subIndices: [], note: 'No data' };
    }

    var subIndices = [];

    // Evaluate all 7 standard CPCB NAQI parameters if provided
    var pm25 = pollutants.pm25 !== undefined ? pollutants.pm25 : pollutants.pm2_5;
    var pm10 = pollutants.pm10;
    var no2 = pollutants.no2 || pollutants.nitrogen_dioxide;
    var so2 = pollutants.so2 || pollutants.sulphur_dioxide;
    var co = pollutants.co !== undefined ? pollutants.co : pollutants.carbon_monoxide;
    var o3 = pollutants.o3 || pollutants.ozone;
    var nh3 = pollutants.nh3 || pollutants.ammonia;

    var sub25 = calcSubIndex('PM25', pm25);
    var sub10 = calcSubIndex('PM10', pm10);
    var subNo2 = calcSubIndex('NO2', no2);
    var subSo2 = calcSubIndex('SO2', so2);
    var subCo = calcSubIndex('CO', co);
    var subO3 = calcSubIndex('O3', o3);
    var subNh3 = calcSubIndex('NH3', nh3);

    if(sub25 !== null) subIndices.push({ key: 'PM2.5', name: 'Fine Particulate', val: sub25, conc: pm25, unit: 'µg/m³' });
    if(sub10 !== null) subIndices.push({ key: 'PM10', name: 'Coarse Dust', val: sub10, conc: pm10, unit: 'µg/m³' });
    if(subNo2 !== null) subIndices.push({ key: 'NO2', name: 'Nitrogen Dioxide', val: subNo2, conc: no2, unit: 'µg/m³' });
    if(subSo2 !== null) subIndices.push({ key: 'SO2', name: 'Sulphur Dioxide', val: subSo2, conc: so2, unit: 'µg/m³' });
    if(subCo !== null) subIndices.push({ key: 'CO', name: 'Carbon Monoxide', val: subCo, conc: co, unit: 'mg/m³' });
    if(subO3 !== null) subIndices.push({ key: 'O3', name: 'Surface Ozone', val: subO3, conc: o3, unit: 'µg/m³' });
    if(subNh3 !== null) subIndices.push({ key: 'NH3', name: 'Ammonia', val: subNh3, conc: nh3, unit: 'µg/m³' });

    if(subIndices.length === 0){
      return {
        aqi: null,
        dominant: 'N/A',
        category: 'Unavailable',
        color: '#64748B',
        isOfficial: false,
        subIndices: [],
        warning: 'No valid pollutant concentrations available.'
      };
    }

    // Sort descending by sub-index value
    subIndices.sort(function(a, b){ return b.val - a.val; });
    var maxSub = subIndices[0];
    var aqi = maxSub.val;

    // CPCB Requirement: At least 3 parameters with at least one PM2.5 or PM10
    var hasParticulate = (sub25 !== null || sub10 !== null);
    var isOfficial = (subIndices.length >= 3 && hasParticulate);

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
      dominantName: maxSub.name,
      category: category,
      color: color,
      isOfficial: isOfficial,
      parameterCount: subIndices.length,
      warning: !isOfficial ? (hasParticulate ? 'Indicative only (minimum 3 pollutants required for official CPCB NAQI).' : 'Indicative only (requires PM2.5 or PM10).') : null,
      subIndices: subIndices
    };
  }

  function formatTime(isoOrDate){
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    if(isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(isoOrDate){
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    if(isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function relativeTime(isoDate){
    if(!isoDate) return 'Just now';
    var d = new Date(isoDate);
    if(isNaN(d.getTime())) return 'N/A';
    var diffMs = Date.now() - d.getTime();
    var diffMins = Math.floor(diffMs / (60 * 1000));
    if(diffMins < 1) return 'Just now';
    if(diffMins < 60) return diffMins + 'm ago';
    var diffHours = Math.floor(diffMins / 60);
    if(diffHours < 24) return diffHours + 'h ago';
    var diffDays = Math.floor(diffHours / 24);
    return diffDays + 'd ago';
  }

  /**
   * Robust Context-Safe HTML Escaper
   */
  function escapeHtml(str){
    if(str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Escape CSV cell to prevent CSV Formula Injection & formatting breakage
   * Handles commas, double-quotes, newlines, and formula prefixes (=, +, -, @, \t, \r)
   */
  function sanitizeCsvCell(val){
    if(val === null || val === undefined) return '""';
    var str = String(val).trim();

    // Prevent Spreadsheet Formula Injection (CWE-1236)
    var firstChar = str.charAt(0);
    if(firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r'){
      str = "'" + str;
    }

    // If cell contains quotes, commas, or newlines, quote and escape inner quotes
    if(str.search(/("|,|\n|\r)/g) >= 0 || str.indexOf("'") === 0){
      str = '"' + str.replace(/"/g, '""') + '"';
    } else {
      str = '"' + str + '"';
    }
    return str;
  }

  /**
   * Generate downloadable CSV Blob with UTF-8 BOM to correctly render Marathi/Hindi
   */
  function downloadCsvBlob(headers, rows, filename){
    var csvRows = [];
    if(headers && headers.length > 0){
      csvRows.push(headers.map(sanitizeCsvCell).join(','));
    }
    rows.forEach(function(r){
      csvRows.push(r.map(sanitizeCsvCell).join(','));
    });

    var csvString = csvRows.join('\r\n');
    // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel Devanagari text preservation
    var blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

    var link = document.createElement('a');
    if(link.download !== undefined){
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || 'mumbair_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }

  return {
    haversineDistance: haversineDistance,
    calcSubIndex: calcSubIndex,
    calculateIndianAqi: calculateIndianAqi,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    relativeTime: relativeTime,
    timeAgo: relativeTime,
    formatTimeAgo: relativeTime,
    escapeHtml: escapeHtml,
    sanitizeCsvCell: sanitizeCsvCell,
    downloadCsvBlob: downloadCsvBlob
  };
})();
