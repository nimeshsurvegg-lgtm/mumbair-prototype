/* ==============================================================================
   MumbAIR — AI Intelligence Assistant (Citizen & Municipal Operations)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.AI = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;

  /**
   * Citizen AI Query Assistant
   */
  function askCitizenAssistant(query, contextAqi, wardName){
    var q = query.toLowerCase().trim();
    var aqi = contextAqi || 160;
    var wName = wardName || 'Chembur';

    if(q.includes('mask') || q.includes('wear') || q.includes('n95')){
      if(aqi > 200){
        return 'With the current AQI at ' + aqi + ' in ' + wName + ', fine particulate matter (PM2.5) is at hazardous levels. An N95 or FFP2 respirator is strongly recommended outdoors to filter out toxic combustion particles.';
      } else if(aqi > 150){
        return 'Air quality is Unhealthy for Sensitive Groups (AQI ' + aqi + '). If you have asthma, bronchitis, or cardiovascular sensitivity, wearing an N95 mask during outdoor transit will significantly reduce particulate inhalation.';
      } else {
        return 'Air quality is currently Moderate (AQI ' + aqi + '). Healthy individuals generally do not require masks, though sensitive individuals should avoid prolonged exposure near heavy traffic corridors.';
      }
    }

    if(q.includes('run') || q.includes('jog') || q.includes('exercise') || q.includes('morning')){
      if(aqi > 180){
        return 'I advise postponing outdoor jogging or high-intensity cardio today. Nocturnal boundary layer inversions trap particulate matter close to ground level in ' + wName + '. Shift workouts indoors or wait until afternoon sea breezes improve dispersion.';
      } else {
        return 'Moderate outdoor activity is acceptable today, but prefer green parks (like Five Gardens or Shivaji Park) away from arterial highway transit bottlenecks.';
      }
    }

    if(q.includes('explain') || q.includes('what is') || q.includes('cpcb') || q.includes('aqi')){
      return 'The Indian National AQI (developed by CPCB and IIT Kanpur) converts complex pollutant concentrations (PM2.5, PM10, NO₂, SO₂, CO, Ozone) into a unified 0–500 score. The worst sub-index determines the day\'s AQI. In ' + wName + ', PM2.5 is currently driving the index.';
    }

    return 'Based on real-time atmospheric readings in ' + wName + ', current AQI is ' + aqi + '. The primary local sources are vehicular traffic and localized industrial emissions. Keep windows closed during morning rush hour and report visible garbage burning via MumbAIR.';
  }

  /**
   * Municipal Officer AI Assistant
   */
  function generateInspectionChecklist(category){
    var checklists = {
      OPEN_BURNING: [
        'Verify extinguish status: Ensure all embers are completely quenched with water or soil cover.',
        'Document burn radius (meters) and calculate estimated ash volume.',
        'Inspect for hazardous waste: Identify presence of PVC cables, plastics, or biomedical refuse.',
        'Issue municipal spot fine notice under Section 368 of the MMC Act to property owner / contractor.'
      ],
      CONSTRUCTION_DUST: [
        'Inspect perimeter barriers: Verify mandatory 25-foot continuous green geotextile dust screen.',
        'Check anti-smog misting guns: Verify water pressure and continuous operation along demolition edge.',
        'Audit vehicle washing bay: Ensure all outbound transit dumpers have tires washed.',
        'Check debris tarpaulins: Ensure 100% of fine sand and excavated earth is completely covered.'
      ],
      INDUSTRIAL_EMISSIONS: [
        'Inspect scrubber/ESP operational logs at factory emission stack.',
        'Take handheld optical opacity measurement (Ringelmann scale) of plume darkness.',
        'Audit fuel intake: Check boiler logs for prohibited pet-coke or furnace oil use.',
        'Submit formal sample vial to Maharashtra Pollution Control Board (MPCB) lab.'
      ]
    };

    return checklists[category] || [
      'Conduct visual verification of environmental infraction coordinates.',
      'Capture timestamped before/after photographic proof with GPS watermarking.',
      'Log action taken and issue official compliance memorandum.'
    ];
  }

  function autoSummarizeComplaint(title, description, category){
    var catObj = CONFIG.CATEGORIES.find(function(c){ return c.id === category; });
    var catLabel = catObj ? catObj.label : 'Environmental Violation';
    return 'Summary: Citizen reported ' + catLabel + ' (' + title + '). Reported condition indicates localized particulate hazard requiring immediate ward squad dispatch and water misting suppression.';
  }

  return {
    askCitizenAssistant: askCitizenAssistant,
    generateInspectionChecklist: generateInspectionChecklist,
    autoSummarizeComplaint: autoSummarizeComplaint
  };
})();
