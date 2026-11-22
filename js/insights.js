/* ==============================================================================
   MumbAIR — Insights & Environmental Intelligence Engine
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.INSIGHTS = (function(){
  'use strict';

  /**
   * Compute deterministic environmental insights from live air & weather metrics
   */
  function generateInsights(airData, weatherData, wardCode){
    var insights = [];
    if(!airData || !airData.current) return insights;

    var curr = airData.current;
    var hourly = airData.hourly;
    var weather = weatherData ? weatherData.current : null;

    // 1. Dominant Pollutant Analysis
    var pm25 = curr.pm2_5 || 0;
    var pm10 = curr.pm10 || 0;
    var no2 = curr.nitrogen_dioxide || 0;

    if(pm25 > 60){
      insights.push({
        type: 'alert',
        title: '⚠️ PM2.5 is Currently the Dominant Hazard',
        body: 'Fine particulate matter (PM2.5 at ' + Math.round(pm25) + ' µg/m³) exceeds the CPCB 24-hour safety threshold of 60 µg/m³. Due to its microscopic diameter (≤ 2.5 µm), it penetrates deep into alveolar lung tissue and the bloodstream.',
        source: 'Calculated from Open-Meteo Atmospheric Ingestion'
      });
    }

    // 2. Trend & 24-Hour Delta Analysis
    if(hourly && hourly.pm2_5 && hourly.pm2_5.length >= 24){
      var recent = hourly.pm2_5[hourly.pm2_5.length - 1];
      var past24 = hourly.pm2_5[Math.max(0, hourly.pm2_5.length - 25)];
      var delta = Math.round(recent - past24);

      if(Math.abs(delta) >= 15){
        var isRising = delta > 0;
        insights.push({
          type: isRising ? 'warning' : 'info',
          title: isRising ? '📈 Particulate Concentrations Rising' : '📉 Air Quality Showing Gradual Improvement',
          body: 'Ambient PM2.5 has ' + (isRising ? 'increased' : 'decreased') + ' by ' + Math.abs(delta) + ' µg/m³ compared to the same hour yesterday. Atmospheric stability and localized emissions are primary drivers.',
          source: '24-Hour Moving Rolling Trend Analysis'
        });
      }
    }

    // 3. Coastal Sea Breeze & Inversion Analysis
    if(weather){
      var windSpd = weather.wind_speed_10m || 0;
      var windDir = weather.wind_direction_10m || 0; // 0=N, 90=E, 180=S, 270=W

      // Mumbai sea breeze comes from 240° - 310° (WSW / W / WNW Arabian Sea)
      var isMaritimeBreeze = (windDir >= 230 && windDir <= 330);
      var isStalled = (windSpd < 8);

      if(isStalled){
        insights.push({
          type: 'alert',
          title: '🌬️ Coastal Sea Breeze Inversion Stalled',
          body: 'Low surface wind velocity (' + windSpd.toFixed(1) + ' km/h) creates stagnant dispersion conditions. Particulate pollutants from transport corridors and eastern petrochemical zones (Chembur / Mahul) cannot disperse seaward.',
          source: 'Open-Meteo Surface Weather Ingestion'
        });
      } else if(isMaritimeBreeze && windSpd >= 12){
        insights.push({
          type: 'info',
          title: '🌊 Active Arabian Sea Breeze Inflow',
          body: 'Clean onshore maritime airflow (' + windSpd.toFixed(1) + ' km/h from ' + Math.round(windDir) + '°) is actively dispersing vehicular emissions across Western Suburbs and South Mumbai coastal corridors.',
          source: 'Open-Meteo Marine Vector Calculation'
        });
      }
    }

    // 4. Ward Specific Environmental Context
    if(wardCode === 'M/E' || wardCode === 'M/W'){
      insights.push({
        type: 'warning',
        title: '🏭 Industrial & Landfill Perimeter Sensitivity',
        body: 'Ward ' + wardCode + ' experiences compounded particulate stress from petrochemical refinery flare corridors and Deonar landfill proximity. Nighttime thermal inversions regularly elevate PM10 and SO₂.',
        source: 'MCGM Environmental Ward Profile'
      });
    }

    return insights;
  }

  /**
   * Health precautions matching active AQI category
   */
  function getHealthAdvisory(aqiCategory){
    var cat = aqiCategory || 'Moderate';
    var advisories = {
      'Good': {
        general: 'Air quality is satisfactory. Ideal conditions for outdoor exercise and recreation.',
        vulnerable: 'No special precautions required for sensitive groups.',
        mask: 'No mask necessary.',
        windows: 'Safe to ventilate indoor living spaces.'
      },
      'Satisfactory': {
        general: 'Air quality is acceptable. Normal outdoor activities can be enjoyed.',
        vulnerable: 'Minor breathing discomfort possible for unusually sensitive individuals with asthma.',
        mask: 'Not needed for general public.',
        windows: 'Safe for regular home ventilation.'
      },
      'Moderate': {
        general: 'Breathing discomfort possible to people with lung disease such as asthma and heart ailments.',
        vulnerable: 'Children and seniors should reduce prolonged vigorous outdoor exertion.',
        mask: 'Consider cloth or surgical mask if walking near heavy traffic corridors.',
        windows: 'Limit morning cross-ventilation during peak traffic hours.'
      },
      'Poor': {
        general: 'Breathing discomfort to most people on prolonged exposure. Limit early morning jogs.',
        vulnerable: 'People with asthma and respiratory conditions must keep quick-relief medication handy.',
        mask: 'N95 or particulate respirator recommended outdoors.',
        windows: 'Keep windows shut during evening traffic and early morning hours.'
      },
      'Very Poor': {
        general: 'Respiratory illness on prolonged exposure. Significant physical fatigue outdoors.',
        vulnerable: 'Children, pregnant women, and elderly should strictly avoid outdoor physical activity.',
        mask: 'Mandatory N95 respirator outdoors.',
        windows: 'Keep windows closed; run HEPA air purifiers if accessible.'
      },
      'Severe': {
        general: 'Emergency health advisory. Serious risk of respiratory effects even in healthy individuals.',
        vulnerable: 'Complete restriction of outdoor activity. Seek medical advice if wheezing occurs.',
        mask: 'Strict N95/N99 respirator required for any emergency outdoor transit.',
        windows: 'Completely seal windows and external door vents.'
      }
    };

    return advisories[cat] || advisories['Moderate'];
  }

  return {
    generateInsights: generateInsights,
    getHealthAdvisory: getHealthAdvisory
  };
})();
