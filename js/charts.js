/* ==============================================================================
   MumbAIR — Charts Layer (Chart.js Environmental Trends & Analytics)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.CHARTS = (function(){
  'use strict';

  var trendChartInstance = null;
  var compareChartInstance = null;

  function initTrendChart(canvasId, hourlyData, rangeHours){
    if(!window.Chart){
      console.warn('Chart.js not loaded; cannot initialize trend chart.');
      return null;
    }

    var canvas = document.getElementById(canvasId);
    if(!canvas) return null;
    var ctx = canvas.getContext('2d');

    if(trendChartInstance){
      trendChartInstance.destroy();
      trendChartInstance = null;
    }

    var hours = rangeHours || 24;
    var times = (hourlyData && hourlyData.time) ? hourlyData.time.slice(0, hours) : [];
    var pm25 = (hourlyData && hourlyData.pm2_5) ? hourlyData.pm2_5.slice(0, hours) : [];
    var pm10 = (hourlyData && hourlyData.pm10) ? hourlyData.pm10.slice(0, hours) : [];

    // Format timestamps to human readable hours (e.g. "08:00")
    var labels = times.map(function(t){
      var d = new Date(t);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'PM2.5 (µg/m³)',
            data: pm25,
            borderColor: '#D97706',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            borderWidth: 2.5,
            pointRadius: 2,
            tension: 0.35,
            fill: true
          },
          {
            label: 'PM10 (µg/m³)',
            data: pm10,
            borderColor: '#0D9488',
            backgroundColor: 'rgba(13, 148, 136, 0.04)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'IBM Plex Sans', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleFont: { family: 'IBM Plex Mono', size: 12 },
            bodyFont: { family: 'IBM Plex Sans', size: 12 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': ' + ctx.parsed.y + ' µg/m³';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'IBM Plex Mono', size: 10 },
              maxTicksLimit: 8
            }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              font: { family: 'IBM Plex Mono', size: 10 }
            },
            title: {
              display: true,
              text: 'Concentration (µg/m³)',
              font: { family: 'IBM Plex Sans', size: 11 }
            }
          }
        }
      }
    });

    return trendChartInstance;
  }

  function initComparisonChart(canvasId, wardA, wardB, aqiMap){
    if(!window.Chart) return null;
    var canvas = document.getElementById(canvasId);
    if(!canvas) return null;
    var ctx = canvas.getContext('2d');

    if(compareChartInstance){
      compareChartInstance.destroy();
      compareChartInstance = null;
    }

    var aqiA = (aqiMap && aqiMap[wardA.code]) ? aqiMap[wardA.code].aqi : 150;
    var aqiB = (aqiMap && aqiMap[wardB.code]) ? aqiMap[wardB.code].aqi : 120;

    compareChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Current AQI', 'Estimated PM2.5', 'Estimated PM10'],
        datasets: [
          {
            label: wardA.name + ' (' + wardA.code + ')',
            data: [aqiA, Math.round(aqiA * 0.46), Math.round(aqiA * 0.9)],
            backgroundColor: 'rgba(217, 119, 6, 0.7)',
            borderColor: '#D97706',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: wardB.name + ' (' + wardB.code + ')',
            data: [aqiB, Math.round(aqiB * 0.46), Math.round(aqiB * 0.9)],
            backgroundColor: 'rgba(13, 148, 136, 0.7)',
            borderColor: '#0D9488',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'IBM Plex Sans', size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'IBM Plex Sans', size: 11 } }
          }
        }
      }
    });

    return compareChartInstance;
  }

  return {
    initTrendChart: initTrendChart,
    initComparisonChart: initComparisonChart
  };
})();
