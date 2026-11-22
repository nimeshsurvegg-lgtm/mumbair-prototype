/* ==============================================================================
   MumbAIR — Storage Layer (Local Persistence, User Profile & Report Seed)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.STORAGE = (function(){
  'use strict';

  var STORAGE_KEY = window.MumbAIR.CONFIG.STORAGE_KEY;

  var memoryFallback = {};

  function isLocalStorageAvailable(){
    try {
      var testKey = '__mb_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch(e) {
      return false;
    }
  }

  var hasStorage = isLocalStorageAvailable();

  function getItem(key){
    if(hasStorage){
      try {
        var val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      } catch(e) {
        console.warn('Storage read error, using fallback:', e);
        return memoryFallback[key] || null;
      }
    }
    return memoryFallback[key] || null;
  }

  function setItem(key, val){
    if(hasStorage){
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch(e) {
        console.warn('Storage write error, using fallback:', e);
        memoryFallback[key] = val;
      }
    } else {
      memoryFallback[key] = val;
    }
  }

  // Generate anonymous persistent voter fingerprint
  function getOrCreateVoterFingerprint(){
    var fp = getItem('mb_voter_fingerprint');
    if(!fp){
      fp = 'voter_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      setItem('mb_voter_fingerprint', fp);
    }
    return fp;
  }

  // Pre-seed realistic civic violation reports across Mumbai Wards
  function getInitialReportsSeed(){
    return [
      {
        id: 'MB-1001',
        ward: 'M/E',
        category: 'INDUSTRIAL_EMISSIONS',
        title: 'Thick pungent sulfur plume near Mahul oil terminal',
        description: 'Persistent dark yellow chemical plume vented from refinery flare stacks into residential colonies along Mahul road.',
        latitude: 19.0490,
        longitude: 72.8980,
        addressText: 'Mahul Corridor, Chembur East, Ward M/E',
        aqiAtTrigger: 228,
        status: 'ACTION_TAKEN',
        upvotes: 38,
        bmcRef: 'MCGM-849201',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        timeline: [
          { status: 'SUBMITTED', time: '5h ago', note: 'Citizen report filed with geotagged photo evidence.' },
          { status: 'UNDER_REVIEW', time: '4h ago', note: 'Escalated to M/East Ward Environment Officer.' },
          { status: 'ACTION_INITIATED', time: '3h ago', note: 'Joint inspection squad dispatched under GRAP mandate.' },
          { status: 'ACTION_TAKEN', time: '1h ago', note: 'Refinery flaring unit throttled; industrial anti-smog misting gun deployed.', photoProof: true }
        ]
      },
      {
        id: 'MB-1002',
        ward: 'M/W',
        category: 'SMOKE_LANDFILL',
        title: 'Methane smoke flare along Deonar boundary road',
        description: 'Subsurface waste combustion emitting heavy toxic smoke across Govandi and Shivaji Nagar residential clusters.',
        latitude: 19.0560,
        longitude: 72.9160,
        addressText: 'Deonar Dumping Ground East Gate, Ward M/W',
        aqiAtTrigger: 204,
        status: 'ACTION_INITIATED',
        upvotes: 29,
        bmcRef: 'MCGM-849188',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        timeline: [
          { status: 'SUBMITTED', time: '8h ago', note: 'Citizen complaint verified with high ambient PM2.5.' },
          { status: 'UNDER_REVIEW', time: '7h ago', note: 'Assigned to SWM (Solid Waste Management) Field Inspector.' },
          { status: 'ACTION_INITIATED', time: '4h ago', note: 'Municipal water tankers on site suppressing smoldering embers.' }
        ]
      },
      {
        id: 'MB-1003',
        ward: 'G/S',
        category: 'CONSTRUCTION_DUST',
        title: 'Uncovered 40-foot rubble debris pile at redevelopment site',
        description: 'Demolition rubble completely exposed to sea breeze without green dust barriers or water cannons, creating dust storm on Senapati Bapat Marg.',
        latitude: 19.0080,
        longitude: 72.8190,
        addressText: 'Senapati Bapat Marg, Lower Parel, Ward G/S',
        aqiAtTrigger: 182,
        status: 'RESOLVED',
        upvotes: 19,
        bmcRef: 'MCGM-849052',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        timeline: [
          { status: 'SUBMITTED', time: 'Yesterday', note: 'Citizen report filed with photo evidence.' },
          { status: 'UNDER_REVIEW', time: 'Yesterday', note: 'Notice issued to developer under Mumbai Clean Air Guidelines.' },
          { status: 'ACTION_TAKEN', time: 'Yesterday', note: 'High-density geotextile tarpaulins installed; site fined.' },
          { status: 'RESOLVED', time: 'Today', note: 'Compliance verified by Ward G/South squad.' }
        ]
      },
      {
        id: 'MB-1004',
        ward: 'L',
        category: 'OPEN_BURNING',
        title: 'Open plastic burning near Mithi river scrap depot',
        description: 'Commercial wire and scrap insulation burned in open pit causing pungent acrid smoke drifting towards Kurla station.',
        latitude: 19.0740,
        longitude: 72.8850,
        addressText: 'LBS Marg, Kurla West, Ward L',
        aqiAtTrigger: 215,
        status: 'SUBMITTED',
        upvotes: 12,
        bmcRef: 'MCGM-849312',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        timeline: [
          { status: 'SUBMITTED', time: '90m ago', note: 'Citizen complaint logged with GPS location.' }
        ]
      }
    ];
  }

  // Load complete state from persistent storage or initialize defaults
  function loadState(){
    var saved = getItem(STORAGE_KEY) || {};
    var reports = saved.reports;
    if(!Array.isArray(reports) || reports.length === 0){
      reports = getInitialReportsSeed();
    }

    return {
      user: saved.user || {
        mobile: '',
        isGuest: true,
        pinnedWard: 'M/E',
        isOfficer: false,
        voterFingerprint: getOrCreateVoterFingerprint()
      },
      settings: saved.settings || {
        scale: 'IN', // 'IN' (CPCB NAQI) or 'US' (US EPA AQI)
        lang: 'en',  // 'en' or 'mr'
        audio: true
      },
      reports: reports,
      userVotes: saved.userVotes || [], // Track report IDs user has already upvoted
      cachedApi: saved.cachedApi || null
    };
  }

  function saveState(stateObj){
    setItem(STORAGE_KEY, stateObj);
  }

  function resetAll(){
    if(hasStorage){
      localStorage.removeItem(STORAGE_KEY);
    }
    memoryFallback = {};
  }

  return {
    loadState: loadState,
    saveState: saveState,
    resetAll: resetAll,
    getOrCreateVoterFingerprint: getOrCreateVoterFingerprint
  };
})();
