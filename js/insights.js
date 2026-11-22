/* ==============================================================================
   MumbAIR — Insights & Environmental Intelligence Engine
   Data-driven, verifiable calculations with zero invented claims
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.INSIGHTS = (function(){
  'use strict';

  /**
   * Compute deterministic environmental insights strictly from available data
   */
  function generateInsights(airData, weatherData, wardCode){
    var insights = [];
    if(!airData || !airData.current) {
      insights.push({
        type: 'info',
        title: 'ℹ️ Sensor Synchronization in Progress',
        body: 'Atmospheric telemetry is currently synchronizing with meteorological models. Metric summaries will refresh shortly.',
        source: 'System Monitor'
      });
      return insights;
    }

    var curr = airData.current;
    var hourly = airData.hourly;

    var pm25 = typeof curr.pm2_5 === 'number' ? curr.pm2_5 : null;
    var pm10 = typeof curr.pm10 === 'number' ? curr.pm10 : null;
    var no2 = typeof curr.nitrogen_dioxide === 'number' ? curr.nitrogen_dioxide : null;

    // 1. Dominant Parameter Verification
    if(pm25 !== null && pm25 > 60){
      insights.push({
        type: 'alert',
        title: '⚠️ PM2.5 is the Dominant Factor',
        body: 'Fine particulate concentration (' + Math.round(pm25) + ' µg/m³) is currently elevated above the CPCB 24-hour reference limit (60 µg/m³). Inhalable particulates of this size remain suspended in ambient air.',
        source: 'Calculated from Copernicus CAMS Data Grid'
      });
    } else if(pm10 !== null && pm10 > 100){
      insights.push({
        type: 'warning',
        title: '⚠️ Coarse Particulate (PM10) is Elevated',
        body: 'PM10 concentration (' + Math.round(pm10) + ' µg/m³) is above the 24-hour reference limit (100 µg/m³). Coarse particles primarily originate from mechanical suspension and road transit.',
        source: 'Calculated from Copernicus CAMS Data Grid'
      });
    } else {
      insights.push({
        type: 'info',
        title: '✅ Monitored Parameters Within Reference Range',
        body: 'Current particulate concentrations are within standard CPCB 24-hour regulatory benchmarks for the selected monitoring coordinates.',
        source: 'CPCB NAQI Benchmark Comparison'
      });
    }

    // 2. 24-Hour Concentration Delta (Measured from hourly records)
    if(hourly && hourly.pm2_5 && hourly.pm2_5.length >= 24){
      var recent = hourly.pm2_5[hourly.pm2_5.length - 1];
      var past24 = hourly.pm2_5[Math.max(0, hourly.pm2_5.length - 25)];
      if(typeof recent === 'number' && typeof past24 === 'number'){
        var delta = Math.round(recent - past24);
        if(Math.abs(delta) >= 12){
          var isRising = delta > 0;
          insights.push({
            type: isRising ? 'warning' : 'info',
            title: isRising ? '📈 24-Hour Particulate Increase' : '📉 24-Hour Particulate Reduction',
            body: 'Measured PM2.5 has ' + (isRising ? 'risen' : 'declined') + ' by ' + Math.abs(delta) + ' µg/m³ compared to the corresponding hour yesterday.',
            source: 'Open-Meteo Hourly Time-Series Analysis'
          });
        }
      }
    }

    // 3. Technical Data Attribution & Coverage Limitations
    insights.push({
      type: 'info',
      title: '🌐 Model Coverage & Grid Transparency',
      body: 'Data is assimilated from Copernicus Atmosphere Monitoring Service (CAMS) and ECMWF forecast models at ~11 km spatial resolution. Values represent area-averaged ambient concentrations rather than physical fence-line micro-sensors.',
      source: 'Open-Meteo Air Quality Reference Standard'
    });

    return insights;
  }

  /**
   * Health precautions matching active AQI category (CPCB NAQI guidelines)
   */
  function getHealthAdvisory(aqiCategory){
    var cat = aqiCategory || 'Moderate';
    var advisories = {
      'Good': {
        general: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        vulnerable: 'No restrictions required.',
        mask: 'No mask required.',
        windows: 'Windows can remain open for fresh air.'
      },
      'Satisfactory': {
        general: 'Air quality is acceptable for outdoor recreation.',
        vulnerable: 'Exceptionally sensitive individuals may consider reducing prolonged outdoor heavy exertion.',
        mask: 'Not generally needed.',
        windows: 'Adequate ventilation.'
      },
      'Moderate': {
        general: 'Air quality is acceptable; may cause minor breathing discomfort to sensitive individuals.',
        vulnerable: 'People with respiratory conditions, asthma, or heart disease should take occasional breaks during outdoor exertion.',
        mask: 'Optional particulate mask for prolonged transit along major highways.',
        windows: 'Normal ventilation.'
      },
      'Poor': {
        general: 'Breathing discomfort likely for most people on prolonged outdoor exposure.',
        vulnerable: 'Children, the elderly, and individuals with lung or heart ailments should limit outdoor exertion.',
        mask: 'N95 particulate respirator recommended for prolonged outdoor transit.',
        windows: 'Keep windows closed during peak traffic hours.'
      },
      'Very Poor': {
        general: 'Respiratory illness on prolonged exposure. Significant health impact across the population.',
        vulnerable: 'Avoid outdoor physical activity. Keep emergency inhalers accessible if prescribed.',
        mask: 'N95 respirator strongly advised outdoors.',
        windows: 'Keep doors and windows closed; use air filtration where available.'
      },
      'Severe': {
        general: 'Emergency atmospheric conditions. Affects healthy people and seriously impacts those with existing diseases.',
        vulnerable: 'Strictly avoid outdoor physical transit.',
        mask: 'Mandatory high-efficiency mask if transit is unavoidable.',
        windows: 'Keep indoor spaces sealed.'
      }
    };

    return advisories[cat] || advisories['Moderate'];
  }

  return {
    generateInsights: generateInsights,
    getHealthAdvisory: getHealthAdvisory
  };
})();
