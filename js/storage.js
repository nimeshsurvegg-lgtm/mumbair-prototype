/* ==============================================================================
   MumbAIR — Storage Layer (Atomic Persistence, Schema v4, Integrity & Concurrency)
   Single source of truth for Citizens, Municipal Officers, and Operational State
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.STORAGE = (function(){
  'use strict';

  var SCHEMA_VERSION = 4;
  var STORAGE_KEY = (window.MumbAIR.CONFIG && window.MumbAIR.CONFIG.STORAGE_KEY) || 'mumbair_state_v4';
  var LEGACY_KEY_V3 = 'mumbair_state_v3';
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

  function rawGetItem(key){
    if(hasStorage){
      try {
        var val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      } catch(e) {
        console.warn('Storage parse error for key ' + key + ':', e);
        // Corruption recovery: backup corrupted content
        try {
          var corruptedVal = localStorage.getItem(key);
          if(corruptedVal){
            localStorage.setItem(key + '_corrupted_' + Date.now(), corruptedVal);
            console.warn('Backed up corrupted state and reset to clean initial state.');
          }
        } catch(bakErr){}
        return null;
      }
    }
    return memoryFallback[key] || null;
  }

  function rawSetItem(key, val){
    if(hasStorage){
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch(e) {
        console.warn('Storage write error (quota exceeded or restricted):', e);
        memoryFallback[key] = val;
      }
    } else {
      memoryFallback[key] = val;
    }
  }

  // Generate anonymous persistent voter fingerprint
  function getOrCreateVoterFingerprint(){
    var fp = rawGetItem('mb_voter_fingerprint');
    if(!fp){
      fp = 'voter_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      rawSetItem('mb_voter_fingerprint', fp);
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
        citizenId: 'user_cit_1',
        citizenName: 'Aarav Patil',
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
          submittedBy: 'Officer Sanjay Shinde',
          submittedById: 'user_fld_1',
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
          { status: 'ASSIGNED', time: '4h ago', actor: 'Dr. Priya Kamble (Ward Officer)', note: 'Assigned to Officer Sanjay Shinde (BMC-FO-4412). Mandatory 12h SLA clock started.' },
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
        citizenId: 'user_cit_2',
        citizenName: 'Farhan Qureshi',
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
        citizenId: 'user_cit_1',
        citizenName: 'Aarav Patil',
        assignedOfficerId: 'user_fld_2',
        assignedOfficer: 'Officer Rahul Mane',
        assignedBadge: 'BMC-FO-5120',
        createdAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        resolvedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        citizenContact: '+91 91****3312',
        resolution: {
          summary: 'Developer installed continuous 25-ft geotextile green barrier sheets and installed continuous mist cannon. Fine of ₹50,000 levied.',
          submittedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
          submittedBy: 'Officer Rahul Mane',
          submittedById: 'user_fld_2',
          approvedBy: 'Rajesh Varma (Ward Officer)',
          approvedById: 'user_wrd_2',
          approvedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
          reviewNotes: 'Verified on-ground. Green barriers compliant with BMC guidelines.'
        },
        internalNotes: [
          { id: 'n1', author: 'Rajesh Varma', role: 'WARD_OFFICER', text: 'Resolution verified on ground. Dust suppression operating at full pressure.', timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString() }
        ],
        timeline: [
          { status: 'SUBMITTED', time: '28h ago', actor: 'Citizen', note: 'Citizen report filed with photo evidence.' },
          { status: 'ASSIGNED', time: '26h ago', actor: 'Rajesh Varma (Ward Officer)', note: 'Assigned to Officer Rahul Mane (BMC-FO-5120).' },
          { status: 'IN_PROGRESS', time: '22h ago', actor: 'Officer Rahul Mane', note: 'Notice issued under Mumbai Clean Air Guidelines.' },
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
        citizenId: 'user_cit_3',
        citizenName: 'Sunil Shrestha',
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
        citizenId: 'user_cit_4',
        citizenName: 'Pooja Shah',
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
      }
    ];
  }

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

  function getInitialResourcesSeed(){
    return [
      { id: 'EQ-201', name: 'Anti-Smog Misting Cannon Alpha (Truck-Mounted)', type: 'MIST_CANNON', ward: 'M/E', department: 'APC', status: 'DEPLOYED', location: 'Mahul Oil Corridor', operator: 'Squad A (BMC)', capacity: '5000L / 60m throw' },
      { id: 'EQ-202', name: 'Anti-Smog Misting Cannon Beta (Trailer)', type: 'MIST_CANNON', ward: 'G/S', department: 'BUILDING', status: 'DEPLOYED', location: 'Senapati Bapat Marg', operator: 'Squad B (BMC)', capacity: '3000L / 40m throw' },
      { id: 'EQ-203', name: 'Mechanical Vacuum Sweeper Titan #4', type: 'ROAD_SWEEPER', ward: 'L', department: 'ROADS', status: 'AVAILABLE', location: 'Kurla Depot', operator: 'Driver Ramesh', capacity: 'PM10 regenerative suction' },
      { id: 'EQ-204', name: 'High-Pressure Water Jetting Tanker WT-12', type: 'WATER_TANKER', ward: 'M/W', department: 'SWM', status: 'DEPLOYED', location: 'Deonar East Gate', operator: 'Driver Ganesh', capacity: '10000L slurry suppression' },
      { id: 'EQ-205', name: 'Portable Optical Aerosol Laser Spectrometer (DustTrak)', type: 'SENSOR_UNIT', ward: 'M/E', department: 'APC', status: 'DEPLOYED', location: 'Chembur Camp Squad', operator: 'Officer Anita Patil', capacity: 'Real-time PM1/PM2.5/PM10' },
      { id: 'EQ-206', name: 'Aerial Environmental Surveillance Drone Squad 1', type: 'DRONE_SQUAD', ward: 'ALL', department: 'APC', status: 'AVAILABLE', location: 'BMC HQ Hangar', operator: 'Pilot R. K. Nair', capacity: 'Thermal IR + optical zoom 4K' }
    ];
  }

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
        notes: 'Dispatched to Officer Sanjay Shinde with 12h SLA clock.'
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

  function getInitialNotificationsSeed(){
    var now = Date.now();
    return [
      {
        id: 'notif_1',
        title: 'GRAP Stage II Enforcement Alert',
        message: 'Continuous misting and mechanised road sweeping deployed across eastern corridor.',
        time: '25m ago',
        createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
        read: false,
        type: 'ALERT',
        targetRole: 'ALL',
        targetWard: 'ALL'
      },
      {
        id: 'notif_2',
        title: 'Mitigation Completed for MB-1003',
        message: 'Ward G/S inspection squad verified 25-ft dust barriers installed on Senapati Bapat Marg.',
        time: '2h ago',
        createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        read: false,
        type: 'SUCCESS',
        targetRole: 'CITIZEN',
        targetCitizenId: 'user_cit_1',
        linkId: 'MB-1003'
      },
      {
        id: 'notif_3',
        title: 'New Case Assigned: MB-1001',
        message: 'Industrial plume violation assigned to Officer Sanjay Shinde (Ward M/E).',
        time: '4h ago',
        createdAt: new Date(now - 4 * 3600 * 1000).toISOString(),
        read: false,
        type: 'ASSIGNMENT',
        targetRole: 'FIELD_OFFICER',
        targetUserId: 'user_fld_1',
        linkId: 'MB-1001'
      }
    ];
  }

  // Load complete state from persistent storage or initialize defaults
  function loadState(){
    var saved = rawGetItem(STORAGE_KEY);

    // Schema migration check from v3
    if(!saved){
      var v3 = rawGetItem(LEGACY_KEY_V3);
      if(v3 && typeof v3 === 'object'){
        saved = v3;
        saved.schemaVersion = SCHEMA_VERSION;
        saved._initialized = true;
        rawSetItem(STORAGE_KEY, saved);
      }
    }

    saved = saved || {};

    // Fix state reseeding when data is intentionally empty:
    // Only seed when _initialized is not true AND the array is missing.
    var isInitialized = !!saved._initialized;

    var reports = saved.reports;
    if(!isInitialized && (!Array.isArray(reports) || reports.length === 0)){
      reports = getInitialReportsSeed();
    } else if(!Array.isArray(reports)){
      reports = [];
    }

    var officers = saved.officers;
    if(!isInitialized && (!Array.isArray(officers) || officers.length === 0)){
      officers = getInitialOfficersSeed();
    } else if(!Array.isArray(officers)){
      officers = [];
    }

    var resources = saved.resources;
    if(!isInitialized && (!Array.isArray(resources) || resources.length === 0)){
      resources = getInitialResourcesSeed();
    } else if(!Array.isArray(resources)){
      resources = [];
    }

    var advisories = saved.advisories;
    if(!isInitialized && (!Array.isArray(advisories) || advisories.length === 0)){
      advisories = getInitialAdvisoriesSeed();
    } else if(!Array.isArray(advisories)){
      advisories = [];
    }

    var auditLogs = saved.auditLogs;
    if(!isInitialized && (!Array.isArray(auditLogs) || auditLogs.length === 0)){
      auditLogs = getInitialAuditLogsSeed();
    } else if(!Array.isArray(auditLogs)){
      auditLogs = [];
    }

    var notifications = saved.notifications;
    if(!isInitialized && (!Array.isArray(notifications) || notifications.length === 0)){
      notifications = getInitialNotificationsSeed();
    } else if(!Array.isArray(notifications)){
      notifications = [];
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      _initialized: true,
      _seq: saved._seq || 1,
      _lastSavedAt: saved._lastSavedAt || new Date().toISOString(),
      user: saved.user || {
        mobile: '',
        isGuest: true,
        pinnedWard: 'M/E',
        isOfficer: false,
        voterFingerprint: getOrCreateVoterFingerprint()
      },
      settings: saved.settings || {
        scale: 'IN', // 'IN' (CPCB NAQI)
        lang: 'en',
        audio: true
      },
      reports: reports,
      officers: officers,
      resources: resources,
      advisories: advisories,
      auditLogs: auditLogs,
      notifications: notifications,
      userVotes: Array.isArray(saved.userVotes) ? saved.userVotes : [],
      cachedApi: saved.cachedApi || null
    };
  }

  function saveState(stateObj){
    if(!stateObj || typeof stateObj !== 'object') return false;
    stateObj.schemaVersion = SCHEMA_VERSION;
    stateObj._initialized = true;
    stateObj._seq = (stateObj._seq || 0) + 1;
    stateObj._lastSavedAt = new Date().toISOString();
    rawSetItem(STORAGE_KEY, stateObj);

    // Notify listeners in current window
    if(typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'){
      try {
        window.dispatchEvent(new CustomEvent('mumbair:state-changed', {
          detail: { seq: stateObj._seq, timestamp: stateObj._lastSavedAt }
        }));
      } catch(e){}
    }
    return true;
  }

  /**
   * ATOMIC STATE MUTATION TRANSACTION
   * 1. Loads latest fresh state from storage
   * 2. Executes mutator(freshState)
   * 3. Validates return value (aborts if { success: false })
   * 4. Persists the complete updated state ONCE
   * 5. Returns the exact result
   */
  function atomicUpdate(mutatorFn){
    if(typeof mutatorFn !== 'function'){
      return { success: false, error: 'Mutator function required' };
    }

    // Always fetch fresh state to prevent stale-write race conditions
    var freshState = loadState();
    var result;
    try {
      result = mutatorFn(freshState);
    } catch(err) {
      console.error('Error in atomic transaction mutator:', err);
      return { success: false, error: 'Transaction aborted due to internal error: ' + err.message };
    }

    if(result && result.success === false){
      // Transaction explicitly rejected by business rules; do not persist
      return result;
    }

    var saved = saveState(freshState);
    if(!saved){
      return { success: false, error: 'Storage write failed' };
    }

    return result || { success: true };
  }

  function resetAll(){
    if(hasStorage){
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY_V3);
    }
    memoryFallback = {};
  }

  // Cross-Tab Synchronization Listener
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('storage', function(event){
      if(event.key === STORAGE_KEY){
        try {
          window.dispatchEvent(new CustomEvent('mumbair:state-synced', {
            detail: { key: event.key, newValue: event.newValue }
          }));
        } catch(e){}
      }
    });
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    loadState: loadState,
    saveState: saveState,
    atomicUpdate: atomicUpdate,
    resetAll: resetAll,
    getOrCreateVoterFingerprint: getOrCreateVoterFingerprint,
    getInitialReportsSeed: getInitialReportsSeed,
    getInitialOfficersSeed: getInitialOfficersSeed,
    getInitialResourcesSeed: getInitialResourcesSeed,
    getInitialAdvisoriesSeed: getInitialAdvisoriesSeed,
    getInitialAuditLogsSeed: getInitialAuditLogsSeed,
    getInitialNotificationsSeed: getInitialNotificationsSeed
  };
})();
