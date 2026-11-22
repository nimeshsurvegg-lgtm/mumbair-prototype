/* ==============================================================================
   MumbAIR — Storage Layer (Local Persistence, Comprehensive State & Model Seeds)
   Unified state engine connecting Citizens, Field Officers, Ward Execs,
   Department Heads, City Administrators and System Super-Admins
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.STORAGE = (function(){
  'use strict';

  var STORAGE_KEY = (window.MumbAIR.CONFIG && window.MumbAIR.CONFIG.STORAGE_KEY) || 'mumbair_state_v3';
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

  // Comprehensive seed of realistic civic violation reports across Mumbai Wards
  function getInitialReportsSeed(){
    var now = Date.now();
    return [
      {
        id: 'MB-1001',
        ward: 'M/E',
        category: 'INDUSTRIAL_EMISSIONS',
        title: 'Thick pungent sulfur plume near Mahul oil terminal',
        description: 'Persistent dark yellow chemical plume vented from refinery flare stacks into residential colonies along Mahul road. Residents reporting severe throat irritation.',
        latitude: 19.0490,
        longitude: 72.8980,
        addressText: 'Mahul Corridor, Chembur East, Ward M/E',
        aqiAtTrigger: 228,
        priority: 'URGENT',
        status: 'RESOLUTION_SUBMITTED',
        upvotes: 38,
        department: 'APC',
        assignedOfficerId: 'user_fld_1',
        assignedOfficer: 'Officer Sanjay Shinde',
        assignedBadge: 'BMC-FO-4412',
        createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 30).toISOString(),
        citizenContact: '+91 98****4120',
        evidencePhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%23334155"/><text x="200" y="125" fill="%23F8FAFC" font-size="16" text-anchor="middle" font-family="sans-serif">Industrial Flare Plume (Mahul)</text></svg>',
        resolution: {
          summary: 'Deployed industrial misting cannons along perimeter fence-line. Issued formal show-cause compliance notice to plant manager under Section 31A of Air Act.',
          submittedAt: new Date(now - 1000 * 60 * 45).toISOString(),
          beforePhoto: 'Evidence Photo 1 (Plume)',
          afterPhoto: 'Verification Photo (Mitigated)'
        },
        internalNotes: [
          { id: 'n1', author: 'Dr. Priya Kamble', role: 'WARD_OFFICER', text: 'Confirmed secondary exceedance on Chembur CAAQMS. Urgent dispatch mandated.', timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString() },
          { id: 'n2', author: 'Officer Sanjay Shinde', role: 'FIELD_OFFICER', text: 'On-site inspection completed. Optical plume opacity measured at 65%. Throttling enforced.', timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '6h ago', actor: 'Citizen (Aarav Patil)', note: 'Citizen report filed with geotagged photo evidence.' },
          { status: 'VERIFIED', time: '5h ago', actor: 'Dr. Priya Kamble (Ward Officer)', note: 'Complaint verified against CPCB monitoring exceedance.' },
          { status: 'ASSIGNED', time: '4h ago', actor: 'Dr. Priya Kamble (Ward Officer)', note: 'Assigned to Officer Sanjay Shinde (BMC-FO-4412). Mandatory 6h SLA clock started.' },
          { status: 'IN_PROGRESS', time: '3h ago', actor: 'Officer Sanjay Shinde (Field Officer)', note: 'Inspector arrived at Mahul gate. Stack opacity measurement initiated.' },
          { status: 'RESOLUTION_SUBMITTED', time: '45m ago', actor: 'Officer Sanjay Shinde (Field Officer)', note: 'Mitigation completed. Formal show-cause issued. Awaiting supervisor sign-off.' }
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
        aqiAtTrigger: 245,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        upvotes: 29,
        department: 'SWM',
        assignedOfficerId: 'user_fld_5',
        assignedOfficer: 'Officer Deepika Joshi',
        assignedBadge: 'BMC-FO-7312',
        createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        citizenContact: '+91 97****8901',
        internalNotes: [
          { id: 'n1', author: 'Officer Deepika Joshi', role: 'FIELD_OFFICER', text: 'Requested 2 additional water tankers from SWM Chembur depot for cooling pit 4.', timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '8h ago', actor: 'Citizen (Farhan Qureshi)', note: 'Citizen complaint verified with high ambient PM2.5.' },
          { status: 'ASSIGNED', time: '7h ago', actor: 'K. R. Rao (Dept Head)', note: 'Dispatched to SWM Ward M/W specialized dumping ground team.' },
          { status: 'IN_PROGRESS', time: '3h ago', actor: 'Officer Deepika Joshi (Field Officer)', note: 'Water misting tankers deployed on site to quench smoldering embers.' }
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
        priority: 'MEDIUM',
        status: 'RESOLVED',
        upvotes: 19,
        department: 'BUILDING',
        assignedOfficerId: 'user_fld_2',
        assignedOfficer: 'Officer Rahul Mane',
        assignedBadge: 'BMC-FO-5120',
        createdAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        citizenContact: '+91 91****3312',
        resolution: {
          summary: 'Developer installed continuous 25-ft geotextile green barrier sheets and installed continuous mist cannon. Fine of ₹50,000 levied.',
          submittedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
          approvedBy: 'Rajesh Varma (Ward Officer)'
        },
        internalNotes: [
          { id: 'n1', author: 'Rajesh Varma', role: 'WARD_OFFICER', text: 'Resolution verified on ground. Dust suppression operating at full pressure.', timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '28h ago', actor: 'Citizen', note: 'Citizen report filed with photo evidence.' },
          { status: 'ASSIGNED', time: '26h ago', actor: 'Rajesh Varma (Ward Officer)', note: 'Assigned to Officer Rahul Mane (BMC-FO-5120).' },
          { status: 'IN_PROGRESS', time: '22h ago', actor: 'Officer Rahul Mane', note: 'Notice issued under Mumbai Clean Air Guidelines 2024.' },
          { status: 'RESOLUTION_SUBMITTED', time: '6h ago', actor: 'Officer Rahul Mane', note: 'Barriers erected, fine levied. Proof attached.' },
          { status: 'RESOLVED', time: '4h ago', actor: 'Rajesh Varma (Ward Officer)', note: 'Supervisor verified compliance. Case closed clean.' }
        ]
      },
      {
        id: 'MB-1004',
        ward: 'L',
        category: 'OPEN_BURNING',
        title: 'Open plastic burning near Mithi river scrap depot',
        description: 'Commercial wire and scrap insulation burned in open pit causing pungent acrid smoke drifting towards Kurla suburban rail station.',
        latitude: 19.0740,
        longitude: 72.8850,
        addressText: 'LBS Marg, Kurla West, Ward L',
        aqiAtTrigger: 215,
        priority: 'HIGH',
        status: 'SUBMITTED',
        upvotes: 14,
        department: 'SWM',
        assignedOfficerId: null,
        assignedOfficer: null,
        assignedBadge: null,
        createdAt: new Date(now - 1000 * 60 * 75).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 75).toISOString(),
        citizenContact: '+91 99****6512',
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '75m ago', actor: 'Citizen (Sunil Shrestha)', note: 'Complaint logged with GPS coordinates. Awaiting Ward L triage.' }
        ]
      },
      {
        id: 'MB-1005',
        ward: 'H/E',
        category: 'VEHICLE_POLLUTION',
        title: 'Heavy diesel transit idling along Western Express corridor',
        description: 'Unauthorized overnight freight transit depot operating uncontained idling fleet generating dark particulate plume across Kalanagar.',
        latitude: 19.0600,
        longitude: 72.8510,
        addressText: 'Western Express Highway, Bandra East, Ward H/E',
        aqiAtTrigger: 198,
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        upvotes: 11,
        department: 'ROADS',
        assignedOfficerId: 'user_fld_4',
        assignedOfficer: 'Officer Sunil Rane',
        assignedBadge: 'BMC-FO-6214',
        createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        citizenContact: '+91 98****1290',
        internalNotes: [
          { id: 'n1', author: 'Manoj Tawde', role: 'DEPARTMENT_HEAD', text: 'Coordinate with Regional Transport Office (RTO) flying squad for joint impound.', timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '3h ago', actor: 'Citizen (Pooja Shah)', note: 'Complaint logged via citizen portal.' },
          { status: 'ASSIGNED', time: '2h ago', actor: 'Manoj Tawde (Dept Head)', note: 'Assigned to Officer Sunil Rane (BMC-FO-6214).' }
        ]
      },
      {
        id: 'MB-1006',
        ward: 'K/W',
        category: 'CONSTRUCTION_DUST',
        title: 'Absence of perimeter misting guns on Link Road flyover demolition',
        description: 'Concrete jackhammers operating with zero water sprinklers; dust plume clouding visibility across Andheri West intersection.',
        latitude: 19.1250,
        longitude: 72.8250,
        addressText: 'Link Road Junction, Andheri West, Ward K/W',
        aqiAtTrigger: 231,
        priority: 'URGENT',
        status: 'SUBMITTED',
        upvotes: 22,
        department: 'BUILDING',
        assignedOfficerId: null,
        assignedOfficer: null,
        assignedBadge: null,
        createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 45).toISOString(),
        citizenContact: '+91 93****4411',
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '45m ago', actor: 'Citizen (Kavita Merchant)', note: 'Geotagged photographic report submitted.' }
        ]
      },
      {
        id: 'MB-1007',
        ward: 'A',
        category: 'VEHICLE_POLLUTION',
        title: 'Maritime diesel auxiliary genset exhaust in Colaba harbor',
        description: 'Bunker fuel auxiliary generator operating continuously with heavy dark soot drifting over residential buildings near Sassoon Dock.',
        latitude: 18.9180,
        longitude: 72.8280,
        addressText: 'Near Sassoon Dock Road, Colaba, Ward A',
        aqiAtTrigger: 174,
        priority: 'HIGH',
        status: 'UNDER_REVIEW',
        upvotes: 16,
        department: 'ROADS',
        assignedOfficerId: null,
        assignedOfficer: null,
        assignedBadge: null,
        createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        citizenContact: '+91 98****7720',
        internalNotes: [
          { id: 'n1', author: 'Tariq Khan', role: 'WARD_OFFICER', text: 'Cross-checking with Mumbai Port Authority jurisdiction boundary.', timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '4h ago', actor: 'Citizen (Homi Bhabha Soc)', note: 'Complaint registered.' },
          { status: 'UNDER_REVIEW', time: '2h ago', actor: 'Tariq Khan (Ward Officer)', note: 'Under technical review for maritime emissions protocol.' }
        ]
      },
      {
        id: 'MB-1008',
        ward: 'M/E',
        category: 'INDUSTRIAL_EMISSIONS',
        title: 'Chemical mercaptan odor spike along BPCL flare perimeter',
        description: 'Persistent rotten-egg sulfur stench reported by multiple residents in Chembur Camp. Automated sensor showing SO2 surge.',
        latitude: 19.0410,
        longitude: 72.8910,
        addressText: 'Maravali Village / Refineries Road, Chembur, Ward M/E',
        aqiAtTrigger: 289,
        priority: 'URGENT',
        status: 'ESCALATED',
        upvotes: 42,
        department: 'APC',
        assignedOfficerId: 'user_fld_3',
        assignedOfficer: 'Officer Anita Patil',
        assignedBadge: 'BMC-FO-3891',
        createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
        citizenContact: '+91 98****5534',
        internalNotes: [
          { id: 'n1', author: 'Vikram Deshmukh', role: 'DEPARTMENT_HEAD', text: 'SLA exceeded 12h threshold. Escalated to Level 2: Inter-agency MPCB inspection squad requested.', timestamp: new Date(now - 1000 * 60 * 60 * 1).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '18h ago', actor: 'Citizen (Deepak Rao)', note: 'Complaint filed.' },
          { status: 'ASSIGNED', time: '16h ago', actor: 'Dr. Priya Kamble', note: 'Assigned to Officer Anita Patil.' },
          { status: 'IN_PROGRESS', time: '14h ago', actor: 'Officer Anita Patil', note: 'Field air sampling vial collected.' },
          { status: 'ESCALATED', time: '1h ago', actor: 'Vikram Deshmukh (Dept Head)', note: 'Escalated due to multi-ward impact and refinery jurisdiction.' }
        ]
      },
      {
        id: 'MB-1009',
        ward: 'F/N',
        category: 'OPEN_BURNING',
        title: 'Dry garden pruning waste set on fire near railway fence',
        description: 'Park pruning waste piled and ignited beside railway boundary wall near King\'s Circle flyover. Smoke entering local clinics.',
        latitude: 19.0320,
        longitude: 72.8580,
        addressText: 'King\'s Circle Central Railway Border, Matunga, Ward F/N',
        aqiAtTrigger: 168,
        priority: 'LOW',
        status: 'IN_PROGRESS',
        upvotes: 8,
        department: 'SWM',
        assignedOfficerId: 'user_fld_1',
        assignedOfficer: 'Officer Sanjay Shinde',
        assignedBadge: 'BMC-FO-4412',
        createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 30).toISOString(),
        citizenContact: '+91 97****0012',
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '2h ago', actor: 'Citizen', note: 'Reported with photo.' },
          { status: 'ASSIGNED', time: '90m ago', actor: 'K. R. Rao (Dept Head)', note: 'Assigned to Officer Sanjay Shinde.' },
          { status: 'IN_PROGRESS', time: '30m ago', actor: 'Officer Sanjay Shinde', note: 'Field crew arrived with water sprayer.' }
        ]
      },
      {
        id: 'MB-1010',
        ward: 'P/N',
        category: 'CONSTRUCTION_DUST',
        title: 'Uncovered sand transit dumpers spilling dust along SV Road',
        description: 'Fleet of heavy tipper trucks transporting loose sand without tarpaulins creating dense particulate haze on Link Road Malad.',
        latitude: 19.1860,
        longitude: 72.8480,
        addressText: 'SV Road, Malad West, Ward P/N',
        aqiAtTrigger: 202,
        priority: 'MEDIUM',
        status: 'RESOLUTION_SUBMITTED',
        upvotes: 18,
        department: 'BUILDING',
        assignedOfficerId: 'user_fld_2',
        assignedOfficer: 'Officer Rahul Mane',
        assignedBadge: 'BMC-FO-5120',
        createdAt: new Date(now - 1000 * 60 * 60 * 7).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 40).toISOString(),
        citizenContact: '+91 98****8811',
        resolution: {
          summary: 'Intercepted 3 transit tippers at Malad checkpost. Fined ₹25,000 each and mandated sealed waterproof tarpaulin covers before release.',
          submittedAt: new Date(now - 1000 * 60 * 40).toISOString()
        },
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '7h ago', actor: 'Citizen (Bhavin Shah)', note: 'Complaint logged.' },
          { status: 'ASSIGNED', time: '5h ago', actor: 'Anita Joshi (Dept Head)', note: 'Assigned to Officer Rahul Mane.' },
          { status: 'IN_PROGRESS', time: '3h ago', actor: 'Officer Rahul Mane', note: 'Intercept squad stationed at junction.' },
          { status: 'RESOLUTION_SUBMITTED', time: '40m ago', actor: 'Officer Rahul Mane', note: 'Challan issued. Tarpaulins enforced. Proof submitted.' }
        ]
      },
      {
        id: 'MB-1011',
        ward: 'G/S',
        category: 'SENSOR_ISSUE',
        title: 'Worli CAAQMS ambient monitor telemetry data flatline',
        description: 'Continuous ambient station telemetry reporting identical 45 µg/m³ PM10 reading for past 18 hours. Suspected intake filter obstruction.',
        latitude: 19.0140,
        longitude: 72.8150,
        addressText: 'Worli Dairy CAAQMS Station, Worli, Ward G/S',
        aqiAtTrigger: 105,
        priority: 'LOW',
        status: 'ASSIGNED',
        upvotes: 6,
        department: 'APC',
        assignedOfficerId: 'user_fld_3',
        assignedOfficer: 'Officer Anita Patil',
        assignedBadge: 'BMC-FO-3891',
        createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
        citizenContact: '+91 99****3322',
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '12h ago', actor: 'System Auto-Monitor', note: 'Sensor data anomaly detected by platform telemetry audit.' },
          { status: 'ASSIGNED', time: '10h ago', actor: 'Vikram Deshmukh (Dept Head)', note: 'Assigned to Officer Anita Patil for physical tape and sensor calibration.' }
        ]
      },
      {
        id: 'MB-1012',
        ward: 'L',
        category: 'SMOKE_LANDFILL',
        title: 'Unauthorized scrap tire incineration along Kurla siding',
        description: 'Dense black toxic rubber smoke drifting across residential chawls and Kurla railway yard.',
        latitude: 19.0680,
        longitude: 72.8790,
        addressText: 'Kurla Railway Yard Siding, Ward L',
        aqiAtTrigger: 265,
        priority: 'URGENT',
        status: 'SUBMITTED',
        upvotes: 31,
        department: 'SWM',
        assignedOfficerId: null,
        assignedOfficer: null,
        assignedBadge: null,
        createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 25).toISOString(),
        citizenContact: '+91 98****9988',
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '25m ago', actor: 'Citizen (Imran Khan)', note: 'Urgent citizen alert with video/photo evidence. Critical hotspot area.' }
        ]
      },
      {
        id: 'MB-1013',
        ward: 'M/W',
        category: 'OPEN_BURNING',
        title: 'Dry municipal garden waste burning near Govandi playground',
        description: 'Municipal sweepers accumulated leaves and burned in open pile beside children\'s playground.',
        latitude: 19.0520,
        longitude: 72.9090,
        addressText: 'Govandi Station Road, Ward M/W',
        aqiAtTrigger: 189,
        priority: 'LOW',
        status: 'RESOLVED',
        upvotes: 15,
        department: 'SWM',
        assignedOfficerId: 'user_fld_5',
        assignedOfficer: 'Officer Deepika Joshi',
        assignedBadge: 'BMC-FO-7312',
        createdAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
        citizenContact: '+91 97****4433',
        resolution: {
          summary: 'Fire quenched with sand and water. Sweeping staff given formal warning; organic composting pit established at ward nursery.',
          submittedAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
          approvedBy: 'Dr. Priya Kamble'
        },
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '36h ago', actor: 'Citizen', note: 'Reported with photo.' },
          { status: 'ASSIGNED', time: '34h ago', actor: 'K. R. Rao (Dept Head)', note: 'Assigned to Officer Deepika Joshi.' },
          { status: 'IN_PROGRESS', time: '30h ago', actor: 'Officer Deepika Joshi', note: 'Water tanker deployed.' },
          { status: 'RESOLVED', time: '12h ago', actor: 'Dr. Priya Kamble', note: 'Compliance verified.' }
        ]
      },
      {
        id: 'MB-1014',
        ward: 'A',
        category: 'CONSTRUCTION_DUST',
        title: 'Heritage facade dry stone cutting without wet suppression',
        description: 'Commercial bank renovation cutting sandstone blocks dry on pavement, engulfing pedestrians in crystalline silica dust.',
        latitude: 18.9320,
        longitude: 72.8340,
        addressText: 'Horniman Circle, Fort, Ward A',
        aqiAtTrigger: 162,
        priority: 'MEDIUM',
        status: 'CLOSED',
        upvotes: 9,
        department: 'BUILDING',
        assignedOfficerId: 'user_fld_4',
        assignedOfficer: 'Officer Sunil Rane',
        assignedBadge: 'BMC-FO-6214',
        createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
        citizenContact: '+91 98****1100',
        resolution: {
          summary: 'Wet-saw cutting attachments installed. Dust extractor vacuum deployed. Work enclosed in polythene shroud.',
          submittedAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
          approvedBy: 'Tariq Khan (Ward Officer)'
        },
        internalNotes: [],
        timeline: [
          { status: 'SUBMITTED', time: '48h ago', actor: 'Citizen', note: 'Report logged.' },
          { status: 'RESOLVED', time: '20h ago', actor: 'Tariq Khan', note: 'Verified compliant.' },
          { status: 'CLOSED', time: '20h ago', actor: 'System', note: 'Citizen confirmed satisfaction.' }
        ]
      }
    ];
  }

  // Pre-configured Verified Municipal Officers Roster
  function getInitialOfficersSeed(){
    return [
      { id: 'user_fld_1', name: 'Officer Sanjay Shinde', role: 'FIELD_OFFICER', ward: 'M/E', department: 'SWM', badge: 'BMC-FO-4412', email: 'sanjay.shinde@mcgm.gov.in.demo', phone: '+91 98200 44120', skills: ['Waste Fire Suppression', 'Open Burning Enforcement', 'Composting Audits'], availability: 'AVAILABLE' },
      { id: 'user_fld_2', name: 'Officer Rahul Mane', role: 'FIELD_OFFICER', ward: 'G/S', department: 'BUILDING', badge: 'BMC-FO-5120', email: 'rahul.mane@mcgm.gov.in.demo', phone: '+91 98200 51201', skills: ['C&D Demolition Audits', 'Anti-Smog Guns', 'Geotextile Barriers'], availability: 'AVAILABLE' },
      { id: 'user_fld_3', name: 'Officer Anita Patil', role: 'FIELD_OFFICER', ward: 'M/E', department: 'APC', badge: 'BMC-FO-3891', email: 'anita.patil@mcgm.gov.in.demo', phone: '+91 98200 38910', skills: ['Industrial Stack Monitoring', 'Ringelmann Optical Opacity', 'VOC Sampling'], availability: 'ON_FIELD' },
      { id: 'user_fld_4', name: 'Officer Sunil Rane', role: 'FIELD_OFFICER', ward: 'L', department: 'ROADS', badge: 'BMC-FO-6214', email: 'sunil.rane@mcgm.gov.in.demo', phone: '+91 98200 62140', skills: ['Vehicular Emission Checks', 'Mechanical Road Sweeping', 'Pothole Dust Control'], availability: 'AVAILABLE' },
      { id: 'user_fld_5', name: 'Officer Deepika Joshi', role: 'FIELD_OFFICER', ward: 'M/W', department: 'SWM', badge: 'BMC-FO-7312', email: 'deepika.joshi@mcgm.gov.in.demo', phone: '+91 98200 73120', skills: ['Landfill Methane Management', 'Slag Cooling', 'Waste Segregation'], availability: 'ON_FIELD' },
      { id: 'user_wrd_1', name: 'Dr. Priya Kamble', role: 'WARD_OFFICER', ward: 'M/E', department: 'ALL', badge: 'MCGM-WO-08', email: 'priya.kamble@mcgm.gov.in.demo', phone: '+91 98200 00008', skills: ['Ward Command', 'Inter-Agency Coordination', 'Public Health Triage'], availability: 'AVAILABLE' },
      { id: 'user_wrd_2', name: 'Rajesh Varma', role: 'WARD_OFFICER', ward: 'G/S', department: 'ALL', badge: 'MCGM-WO-03', email: 'rajesh.varma@mcgm.gov.in.demo', phone: '+91 98200 00003', skills: ['Ward Command', 'Redevelopment Compliance', 'Coastal Zone Oversight'], availability: 'AVAILABLE' },
      { id: 'user_wrd_3', name: 'Meena Kadam', role: 'WARD_OFFICER', ward: 'L', department: 'ALL', badge: 'MCGM-WO-12', email: 'meena.kadam@mcgm.gov.in.demo', phone: '+91 98200 00012', skills: ['Ward Command', 'Scrap Market Enforcement', 'River Zone Triage'], availability: 'AVAILABLE' },
      { id: 'user_dpt_1', name: 'Vikram Deshmukh', role: 'DEPARTMENT_HEAD', ward: 'ALL', department: 'APC', badge: 'BMC-HOD-APC', email: 'vikram.deshmukh@mcgm.gov.in.demo', phone: '+91 98200 11001', skills: ['Air Pollution Control', 'CAAQMS Network', 'GRAP City Execution'], availability: 'AVAILABLE' },
      { id: 'user_dpt_2', name: 'K. R. Rao', role: 'DEPARTMENT_HEAD', ward: 'ALL', department: 'SWM', badge: 'BMC-HOD-SWM', email: 'kr.rao@mcgm.gov.in.demo', phone: '+91 98200 11002', skills: ['Solid Waste Fleet', 'Dumping Ground Management', 'Debris Hauling'], availability: 'AVAILABLE' },
      { id: 'user_dpt_3', name: 'Anita Joshi', role: 'DEPARTMENT_HEAD', ward: 'ALL', department: 'BUILDING', badge: 'BMC-HOD-BDR', email: 'anita.joshi@mcgm.gov.in.demo', phone: '+91 98200 11003', skills: ['Construction Dust Regulation', 'Site Stop-Work Notices', 'Misting Cannons'], availability: 'AVAILABLE' },
      { id: 'user_cty_1', name: 'Municipal Commissioner Ops', role: 'CITY_ADMIN', ward: 'ALL', department: 'ALL', badge: 'MCGM-COMM-01', email: 'commissioner.ops@mcgm.gov.in.demo', phone: '+91 98200 99999', skills: ['City Command', 'Budget Allocation', 'Cabinet Escalations', 'State Policy'], availability: 'AVAILABLE' },
      { id: 'user_sup_1', name: 'Root System Admin', role: 'SUPER_ADMIN', ward: 'ALL', department: 'ALL', badge: 'SYS-ROOT-00', email: 'root.admin@mumbair.gov.in.demo', phone: '+91 98200 00000', skills: ['Security Access', 'Audit Ledgers', 'RBAC Matrix', 'Node Encryption'], availability: 'AVAILABLE' }
    ];
  }

  // Pre-configured Verified Environmental Equipment Fleet
  function getInitialResourcesSeed(){
    return [
      { id: 'EQ-201', name: 'Anti-Smog Misting Cannon Alpha (Truck-Mounted)', type: 'MIST_CANNON', ward: 'M/E', department: 'APC', status: 'DEPLOYED', location: 'Mahul Oil Corridor', operator: 'Squad A (BMC)', capacity: '5000L / 60m throw' },
      { id: 'EQ-202', name: 'Anti-Smog Misting Cannon Beta (Trailer)', type: 'MIST_CANNON', ward: 'G/S', department: 'BUILDING', status: 'DEPLOYED', location: 'Senapati Bapat Marg', operator: 'Squad B (BMC)', capacity: '3000L / 40m throw' },
      { id: 'EQ-203', name: 'Mechanical Vacuum Sweeper Titan #4', type: 'ROAD_SWEEPER', ward: 'L', department: 'ROADS', status: 'AVAILABLE', location: 'Kurla Depot', operator: 'Driver Ramesh', capacity: 'PM10 regenerative suction' },
      { id: 'EQ-204', name: 'High-Pressure Water Jetting Tanker WT-12', type: 'WATER_TANKER', ward: 'M/W', department: 'SWM', status: 'DEPLOYED', location: 'Deonar East Gate', operator: 'Driver Ganesh', capacity: '10000L slurry suppression' },
      { id: 'EQ-205', name: 'Portable Optical Aerosol Laser Spectrometer (DustTrak)', type: 'SENSOR_UNIT', ward: 'M/E', department: 'APC', status: 'DEPLOYED', location: 'Chembur Camp Squad', operator: 'Officer Anita Patil', capacity: 'Real-time PM1/PM2.5/PM10' },
      { id: 'EQ-206', name: 'Aerial Environmental Surveillance Drone Squad 1', type: 'DRONE_SQUAD', ward: 'ALL', department: 'APC', status: 'AVAILABLE', location: 'BMC HQ Hangar', operator: 'Pilot R. K. Nair', capacity: 'Thermal IR + optical zoom 4K' },
      { id: 'EQ-207', name: 'High-Velocity Anti-Smog Gun Delta', type: 'MIST_CANNON', ward: 'K/W', department: 'BUILDING', status: 'AVAILABLE', location: 'Andheri West Yard', operator: 'Squad D (BMC)', capacity: '4000L / 50m throw' },
      { id: 'EQ-208', name: 'Mechanical Vacuum Sweeper Titan #2', type: 'ROAD_SWEEPER', ward: 'A', department: 'ROADS', status: 'MAINTENANCE', location: 'Byculla Workshop', operator: 'Maintenance Team', capacity: 'Under scheduled PM filter service' }
    ];
  }

  // Pre-configured Verified Public Environmental Advisories
  function getInitialAdvisoriesSeed(){
    var now = Date.now();
    return [
      {
        id: 'ADV-401',
        title: 'GRAP Stage II Enforcement Directive: Anti-Smog Gun Mandate',
        category: 'REGULATION',
        severity: 'EMERGENCY',
        affectedWards: ['ALL'],
        startDate: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        endDate: new Date(now + 1000 * 60 * 60 * 72).toISOString(),
        status: 'ACTIVE',
        issuingDept: 'APC',
        author: 'Municipal Commissioner Ops',
        summary: 'Under Graded Response Action Plan Stage II, all active construction sites exceeding 5,000 sq. meters must operate continuous anti-smog misting guns between 08:00 and 18:00. Non-compliant developers will face immediate stop-work orders.'
      },
      {
        id: 'ADV-402',
        title: 'Coastal Nocturnal Inversion Alert: Chembur & Eastern Suburbs',
        category: 'HEALTH',
        severity: 'WARNING',
        affectedWards: ['M/E', 'M/W', 'L', 'S', 'T'],
        startDate: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
        endDate: new Date(now + 1000 * 60 * 60 * 18).toISOString(),
        status: 'ACTIVE',
        issuingDept: 'PHD',
        author: 'Dr. Priya Kamble (Ward Executive)',
        summary: 'Low boundary layer inversion expected between 22:00 and 07:00. Open waste burning strictly prohibited. Elderly citizens and those with respiratory conditions advised to keep windows closed during early morning hours.'
      }
    ];
  }

  // Initial audit entries
  function getInitialAuditLogsSeed(){
    var now = Date.now();
    return [
      {
        id: 'AUD-seed-1',
        timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        action: 'ADVISORY_PUBLISHED',
        actorName: 'Municipal Commissioner Ops',
        actorRole: 'CITY_ADMIN',
        recordId: 'ADV-401',
        notes: 'Broadcasted city-wide GRAP Stage II mandate.'
      },
      {
        id: 'AUD-seed-2',
        timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
        action: 'COMPLAINT_VERIFIED',
        actorName: 'Dr. Priya Kamble',
        actorRole: 'WARD_OFFICER',
        recordId: 'MB-1001',
        notes: 'Verified against CPCB Chembur exceedance data.'
      },
      {
        id: 'AUD-seed-3',
        timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        action: 'OFFICER_ASSIGNED',
        actorName: 'Dr. Priya Kamble',
        actorRole: 'WARD_OFFICER',
        recordId: 'MB-1001',
        notes: 'Dispatched to Officer Sanjay Shinde with 6h SLA clock.'
      },
      {
        id: 'AUD-seed-4',
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        action: 'RESOLUTION_SUBMITTED',
        actorName: 'Officer Sanjay Shinde',
        actorRole: 'FIELD_OFFICER',
        recordId: 'MB-1001',
        notes: 'Field mitigation proof and show-cause notice submitted.'
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

    var officers = saved.officers;
    if(!Array.isArray(officers) || officers.length === 0){
      officers = getInitialOfficersSeed();
    }

    var resources = saved.resources;
    if(!Array.isArray(resources) || resources.length === 0){
      resources = getInitialResourcesSeed();
    }

    var advisories = saved.advisories;
    if(!Array.isArray(advisories) || advisories.length === 0){
      advisories = getInitialAdvisoriesSeed();
    }

    var auditLogs = saved.auditLogs;
    if(!Array.isArray(auditLogs) || auditLogs.length === 0){
      auditLogs = getInitialAuditLogsSeed();
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
      officers: officers,
      resources: resources,
      advisories: advisories,
      auditLogs: auditLogs,
      userVotes: saved.userVotes || [],
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
    getOrCreateVoterFingerprint: getOrCreateVoterFingerprint,
    getInitialReportsSeed: getInitialReportsSeed,
    getInitialOfficersSeed: getInitialOfficersSeed,
    getInitialResourcesSeed: getInitialResourcesSeed,
    getInitialAdvisoriesSeed: getInitialAdvisoriesSeed,
    getInitialAuditLogsSeed: getInitialAuditLogsSeed
  };
})();
