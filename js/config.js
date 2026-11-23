/* ==============================================================================
   MumbAIR — Comprehensive Smart-City Config & Standards
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.CONFIG = {
  APP_NAME: 'MumbAIR',
  TAGLINE: 'Understand the air. Change the city.',
  VERSION: '4.0.0-audit-hardened',
  SCHEMA_VERSION: 4,
  ORGANIZATION: 'Brihanmumbai Municipal Corporation (BMC / MCGM) Operations',
  DEFAULT_COORDS: { lat: 19.0760, lng: 72.8777 },
  API_CACHE_TTL_MS: 15 * 60 * 1000,
  STORAGE_KEY: 'mumbair_state_v4',
  DUPLICATE_RADIUS_KM: 1.5,

  // Role Hierarchy & Permissions
  ROLES: {
    CITIZEN: { id: 'CITIZEN', label: 'Citizen', homeTab: 'tab-overview', canModerate: false, scope: 'OWN_ONLY' },
    FIELD_OFFICER: { id: 'FIELD_OFFICER', label: 'Field Operations Officer', homeTab: 'tab-field-ops', canModerate: false, scope: 'ASSIGNED_ONLY' },
    WARD_OFFICER: { id: 'WARD_OFFICER', label: 'Ward Executive Officer', homeTab: 'tab-ward-command', canModerate: true, scope: 'WARD_ONLY' },
    DEPARTMENT_HEAD: { id: 'DEPARTMENT_HEAD', label: 'Department Head', homeTab: 'tab-dept-command', canModerate: true, scope: 'DEPT_ONLY' },
    CITY_ADMIN: { id: 'CITY_ADMIN', label: 'City Operations Administrator', homeTab: 'tab-city-command', canModerate: true, scope: 'CITY_WIDE' },
    SUPER_ADMIN: { id: 'SUPER_ADMIN', label: 'Super Administrator', homeTab: 'tab-system-admin', canModerate: false, scope: 'SYSTEM_ADMIN' }
  },

  // Pre-configured Verified Demo Accounts for Presentation
  DEMO_USERS: [
    { id: 'user_cit_1', name: 'Aarav Patil', role: 'CITIZEN', ward: 'M/E', department: null, email: 'aarav.patil@mumbai.gov.in.demo' },
    { id: 'user_fld_1', name: 'Officer Sanjay Shinde', role: 'FIELD_OFFICER', ward: 'M/E', department: 'SWM', badge: 'BMC-FO-4412', email: 'sanjay.shinde@mcgm.gov.in.demo' },
    { id: 'user_wrd_1', name: 'Dr. Priya Kamble (Ward Officer)', role: 'WARD_OFFICER', ward: 'M/E', department: null, badge: 'MCGM-WO-08', email: 'priya.kamble@mcgm.gov.in.demo' },
    { id: 'user_dpt_1', name: 'Vikram Deshmukh (Dept Head)', role: 'DEPARTMENT_HEAD', ward: 'ALL', department: 'APC', badge: 'BMC-HOD-APC', email: 'vikram.deshmukh@mcgm.gov.in.demo' },
    { id: 'user_cty_1', name: 'Municipal Commissioner Ops', role: 'CITY_ADMIN', ward: 'ALL', department: 'ALL', badge: 'MCGM-COMM-01', email: 'commissioner.ops@mcgm.gov.in.demo' },
    { id: 'user_sup_1', name: 'Root System Admin', role: 'SUPER_ADMIN', ward: 'ALL', department: 'ALL', badge: 'SYS-ROOT-00', email: 'root.admin@mumbair.gov.in.demo' }
  ],

  // Municipal Departments
  DEPARTMENTS: [
    { id: 'SWM', name: 'Solid Waste Management', code: 'SWM', head: 'K. R. Rao' },
    { id: 'APC', name: 'Air Pollution Control & Environment', code: 'APC', head: 'Vikram Deshmukh' },
    { id: 'BUILDING', name: 'Construction & Demolition Regulation', code: 'BDR', head: 'Anita Joshi' },
    { id: 'ROADS', name: 'Roads & Traffic Infrastructure', code: 'RTI', head: 'Manoj Tawde' },
    { id: 'DRAINAGE', name: 'Stormwater & Industrial Drainage', code: 'SWD', head: 'Sunil Pawar' },
    { id: 'HEALTH', name: 'Public Health Surveillance', code: 'PHD', head: 'Dr. Neha Salve' }
  ],

  // Category to Department Automatic Routing Table
  ROUTING_MAP: {
    OPEN_BURNING: 'SWM',
    CONSTRUCTION_DUST: 'BUILDING',
    INDUSTRIAL_EMISSIONS: 'APC',
    VEHICLE_POLLUTION: 'ROADS',
    SMOKE_LANDFILL: 'SWM',
    SENSOR_ISSUE: 'APC'
  },

  // Service Level Agreement (SLA) Targets in Hours
  SLA_POLICIES: {
    URGENT: { ackHours: 2, inspectHours: 6, resolveHours: 12, label: 'Urgent (12 Hours)' },
    HIGH:   { ackHours: 4, inspectHours: 12, resolveHours: 24, label: 'High (24 Hours)' },
    MEDIUM: { ackHours: 8, inspectHours: 24, resolveHours: 48, label: 'Medium (48 Hours)' },
    LOW:    { ackHours: 12, inspectHours: 36, resolveHours: 72, label: 'Standard (72 Hours)' }
  },

  // Full Centralized Complaint Lifecycle States & Valid Transitions
  STATUS_LIFECYCLE: {
    SUBMITTED: {
      label: 'Submitted',
      next: ['UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'REJECTED', 'DUPLICATE'],
      requiresReason: false
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      next: ['VERIFIED', 'ASSIGNED', 'ON_HOLD', 'REJECTED', 'DUPLICATE'],
      requiresReason: false
    },
    VERIFIED: {
      label: 'Verified',
      next: ['ASSIGNED', 'ON_HOLD', 'ESCALATED', 'REJECTED', 'DUPLICATE'],
      requiresReason: false
    },
    ASSIGNED: {
      label: 'Assigned to Officer',
      next: ['IN_PROGRESS', 'REASSIGNED', 'ON_HOLD', 'ESCALATED'],
      requiresReason: false
    },
    IN_PROGRESS: {
      label: 'Field Investigation',
      next: ['INSPECTION_COMPLETED', 'RESOLUTION_SUBMITTED', 'REASSIGNED', 'ON_HOLD', 'ESCALATED'],
      requiresReason: false
    },
    INSPECTION_COMPLETED: {
      label: 'Inspection Completed',
      next: ['RESOLUTION_SUBMITTED', 'ON_HOLD', 'ESCALATED'],
      requiresReason: false
    },
    RESOLUTION_SUBMITTED: {
      label: 'Resolution Awaiting Review',
      next: ['RESOLUTION_REVIEW', 'RESOLVED', 'IN_PROGRESS'],
      requiresReason: false
    },
    RESOLUTION_REVIEW: {
      label: 'Resolution Under Review',
      next: ['RESOLVED', 'IN_PROGRESS'],
      requiresReason: false
    },
    ON_HOLD: {
      label: 'On Hold (Dependency)',
      next: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'],
      requiresReason: true
    },
    ESCALATED: {
      label: 'Escalated Tier-2',
      next: ['ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'RESOLVED'],
      requiresReason: true
    },
    REASSIGNED: {
      label: 'Reassigned',
      next: ['ASSIGNED', 'IN_PROGRESS'],
      requiresReason: true
    },
    REOPENED: {
      label: 'Reopened by Citizen',
      next: ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
      requiresReason: true
    },
    RESOLVED: {
      label: 'Resolved & Mitigated',
      next: ['CLOSED', 'REOPENED'],
      requiresReason: false
    },
    REJECTED: {
      label: 'Rejected (Invalid / Non-Jurisdiction)',
      next: ['REOPENED'],
      requiresReason: true
    },
    DUPLICATE: {
      label: 'Merged Duplicate',
      next: [],
      requiresReason: true
    },
    CLOSED: {
      label: 'Closed Safe',
      next: ['REOPENED'],
      requiresReason: false
    }
  },

  // Official Central Pollution Control Board (CPCB) Standard Breakpoints (India National AQI)
  CPCB_BREAKPOINTS: {
    PM25: [
      { bpLow: 0,   bpHigh: 30,  iLow: 0,   iHigh: 50,  category: 'Good',          color: '#16A34A' },
      { bpLow: 31,  bpHigh: 60,  iLow: 51,  iHigh: 100, category: 'Satisfactory',  color: '#65A30D' },
      { bpLow: 61,  bpHigh: 90,  iLow: 101, iHigh: 200, category: 'Moderate',      color: '#CA8A04' },
      { bpLow: 91,  bpHigh: 120, iLow: 201, iHigh: 300, category: 'Poor',          color: '#EA580C' },
      { bpLow: 121, bpHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor',     color: '#DC2626' },
      { bpLow: 251, bpHigh: 500, iLow: 401, iHigh: 500, category: 'Severe',        color: '#7F1D1D' }
    ],
    PM10: [
      { bpLow: 0,   bpHigh: 50,  iLow: 0,   iHigh: 50,  category: 'Good',          color: '#16A34A' },
      { bpLow: 51,  bpHigh: 100, iLow: 51,  iHigh: 100, category: 'Satisfactory',  color: '#65A30D' },
      { bpLow: 101, bpHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate',      color: '#CA8A04' },
      { bpLow: 251, bpHigh: 350, iLow: 201, iHigh: 300, category: 'Poor',          color: '#EA580C' },
      { bpLow: 351, bpHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor',     color: '#DC2626' },
      { bpLow: 431, bpHigh: 600, iLow: 401, iHigh: 500, category: 'Severe',        color: '#7F1D1D' }
    ],
    NO2: [
      { bpLow: 0,   bpHigh: 40,  iLow: 0,   iHigh: 50,  category: 'Good',          color: '#16A34A' },
      { bpLow: 41,  bpHigh: 80,  iLow: 51,  iHigh: 100, category: 'Satisfactory',  color: '#65A30D' },
      { bpLow: 81,  bpHigh: 180, iLow: 101, iHigh: 200, category: 'Moderate',      color: '#CA8A04' },
      { bpLow: 181, bpHigh: 280, iLow: 201, iHigh: 300, category: 'Poor',          color: '#EA580C' },
      { bpLow: 281, bpHigh: 400, iLow: 301, iHigh: 400, category: 'Very Poor',     color: '#DC2626' },
      { bpLow: 401, bpHigh: 500, iLow: 401, iHigh: 500, category: 'Severe',        color: '#7F1D1D' }
    ],
    SO2: [
      { bpLow: 0,   bpHigh: 40,  iLow: 0,   iHigh: 50,  category: 'Good',          color: '#16A34A' },
      { bpLow: 41,  bpHigh: 80,  iLow: 51,  iHigh: 100, category: 'Satisfactory',  color: '#65A30D' },
      { bpLow: 81,  bpHigh: 380, iLow: 101, iHigh: 200, category: 'Moderate',      color: '#CA8A04' },
      { bpLow: 381, bpHigh: 800, iLow: 201, iHigh: 300, category: 'Poor',          color: '#EA580C' },
      { bpLow: 801, bpHigh: 1600, iLow: 301, iHigh: 400, category: 'Very Poor',    color: '#DC2626' },
      { bpLow: 1601, bpHigh: 2000, iLow: 401, iHigh: 500, category: 'Severe',      color: '#7F1D1D' }
    ],
    CO: [ // 8-hr avg in mg/m³
      { bpLow: 0,   bpHigh: 1.0,  iLow: 0,   iHigh: 50,  category: 'Good',         color: '#16A34A' },
      { bpLow: 1.1, bpHigh: 2.0,  iLow: 51,  iHigh: 100, category: 'Satisfactory', color: '#65A30D' },
      { bpLow: 2.1, bpHigh: 10.0, iLow: 101, iHigh: 200, category: 'Moderate',     color: '#CA8A04' },
      { bpLow: 10.1, bpHigh: 17.0, iLow: 201, iHigh: 300, category: 'Poor',        color: '#EA580C' },
      { bpLow: 17.1, bpHigh: 34.0, iLow: 301, iHigh: 400, category: 'Very Poor',   color: '#DC2626' },
      { bpLow: 34.1, bpHigh: 50.0, iLow: 401, iHigh: 500, category: 'Severe',      color: '#7F1D1D' }
    ],
    O3: [ // 8-hr avg in µg/m³
      { bpLow: 0,   bpHigh: 50,  iLow: 0,   iHigh: 50,  category: 'Good',          color: '#16A34A' },
      { bpLow: 51,  bpHigh: 100, iLow: 51,  iHigh: 100, category: 'Satisfactory',  color: '#65A30D' },
      { bpLow: 101, bpHigh: 168, iLow: 101, iHigh: 200, category: 'Moderate',      color: '#CA8A04' },
      { bpLow: 169, bpHigh: 208, iLow: 201, iHigh: 300, category: 'Poor',          color: '#EA580C' },
      { bpLow: 209, bpHigh: 748, iLow: 301, iHigh: 400, category: 'Very Poor',     color: '#DC2626' },
      { bpLow: 749, bpHigh: 1000, iLow: 401, iHigh: 500, category: 'Severe',       color: '#7F1D1D' }
    ],
    NH3: [ // 24-hr avg in µg/m³
      { bpLow: 0,    bpHigh: 200,  iLow: 0,   iHigh: 50,  category: 'Good',         color: '#16A34A' },
      { bpLow: 201,  bpHigh: 400,  iLow: 51,  iHigh: 100, category: 'Satisfactory', color: '#65A30D' },
      { bpLow: 401,  bpHigh: 800,  iLow: 101, iHigh: 200, category: 'Moderate',     color: '#CA8A04' },
      { bpLow: 801,  bpHigh: 1200, iLow: 201, iHigh: 300, category: 'Poor',        color: '#EA580C' },
      { bpLow: 1201, bpHigh: 1800, iLow: 301, iHigh: 400, category: 'Very Poor',   color: '#DC2626' },
      { bpLow: 1801, bpHigh: 2500, iLow: 401, iHigh: 500, category: 'Severe',      color: '#7F1D1D' }
    ]
  },

  // Violation Categories
  CATEGORIES: [
    { id: 'OPEN_BURNING', icon: '🔥', label: 'Open Garbage / Biomass Burning', defaultPriority: 'HIGH', desc: 'Combustion of municipal solid waste, leaf litter, or plastic scrap.' },
    { id: 'CONSTRUCTION_DUST', icon: '🏗️', label: 'Uncovered Construction & Demolition', defaultPriority: 'MEDIUM', desc: 'Building excavation and rubble without mandatory green dust barrier mesh.' },
    { id: 'INDUSTRIAL_EMISSIONS', icon: '🏭', label: 'Heavy Industrial Smoke / Flare', defaultPriority: 'URGENT', desc: 'Petrochemical refinery flaring or unscrubbed industrial boiler exhaust.' },
    { id: 'VEHICLE_POLLUTION', icon: '🚛', label: 'Excessive Vehicular Exhaust', defaultPriority: 'MEDIUM', desc: 'Grossly polluting heavy trucks or prolonged idling corridors.' },
    { id: 'SMOKE_LANDFILL', icon: '⛰️', label: 'Dumping Ground / Landfill Smoke', defaultPriority: 'URGENT', desc: 'Subsurface methane fires at municipal landfill perimeters.' },
    { id: 'SENSOR_ISSUE', icon: '📍', label: 'Public Sensor / Display Malfunction', defaultPriority: 'LOW', desc: 'Outdoor LED display screen off or public CAAQMS monitoring issue.' }
  ],

  // 24 Administrative Wards of Greater Mumbai
  WARDS_DATA: [
    { code: 'A', name: 'Colaba / Fort', nameMr: 'कुलाबा / फोर्ट', zone: 'Island City', lat: 18.9067, lng: 72.8147, station: 'Colaba CAAQMS', defaultCause: 'Maritime diesel exhaust & coastal salt-dust' },
    { code: 'B', name: 'Masjid Bunder / Dongri', nameMr: 'मशीद बंदर / डोंगरी', zone: 'Island City', lat: 18.9634, lng: 72.8322, station: 'Mazgaon MPCB Station', defaultCause: 'Heavy freight truck congestion & port logistics dust' },
    { code: 'C', name: 'Marine Lines / Kalbadevi', nameMr: 'मरीन लाईन्स / काळबादेवी', zone: 'Island City', lat: 18.9440, lng: 72.8258, station: 'Chhatrapati Shivaji Terminus CAAQMS', defaultCause: 'Arterial traffic congestion & diesel genset emissions' },
    { code: 'D', name: 'Malabar Hill / Breach Candy', nameMr: 'मलबार हिल / ब्रीच कँडी', zone: 'Island City', lat: 18.9547, lng: 72.8081, station: 'Haji Ali CAAQMS', defaultCause: 'Coastal corridor transit & marine aerosol background' },
    { code: 'E', name: 'Byculla / Mazgaon', nameMr: 'भायखळा / माझगाव', zone: 'Island City', lat: 18.9750, lng: 72.8327, station: 'Byculla Zoo MPCB Station', defaultCause: 'Demolition dust & rail freight logistics' },
    { code: 'F/N', name: 'Matunga / Sion', nameMr: 'माटुंगा / सायन', zone: 'Island City', lat: 19.0270, lng: 72.8554, station: 'Sion CAAQMS', defaultCause: 'Highway vehicular exhaust & transit node congestion' },
    { code: 'F/S', name: 'Parel / Sewri', nameMr: 'परळ / शिवडी', zone: 'Island City', lat: 19.0027, lng: 72.8407, station: 'Parel Hospital Complex CAAQMS', defaultCause: 'High-rise construction dust & heavy transit' },
    { code: 'G/N', name: 'Dadar / Mahim / Dharavi', nameMr: 'दादर / माहीम / धारावी', zone: 'Island City', lat: 19.0330, lng: 72.8397, station: 'Mahim Nature Park CAAQMS', defaultCause: 'Micro-industrial fabrication emissions & traffic hub exhaust' },
    { code: 'G/S', name: 'Worli / Lower Parel', nameMr: 'वरळी / लोअर परळ', zone: 'Island City', lat: 19.0100, lng: 72.8170, station: 'Worli Dairy CAAQMS', defaultCause: 'Mega-infrastructure dust & high-rise construction particulate' },
    { code: 'H/E', name: 'Bandra East / BKC', nameMr: 'वांद्रे पूर्व / बीकेसी', zone: 'Western Suburbs', lat: 19.0600, lng: 72.8500, station: 'Bandra Kurla Complex (BKC) CAAQMS', defaultCause: 'Intense transit corridors & metro project excavation dust' },
    { code: 'H/W', name: 'Bandra West / Khar', nameMr: 'वांद्रे पश्चिम / खार', zone: 'Western Suburbs', lat: 19.0596, lng: 72.8295, station: 'Linking Road CAAQMS', defaultCause: 'Commercial street vehicular transit & urban dust' },
    { code: 'K/E', name: 'Andheri East / Vile Parle E', nameMr: 'अंधेरी पूर्व / विलेपार्ले पूर्व', zone: 'Western Suburbs', lat: 19.1150, lng: 72.8700, station: 'Chhatrapati Shivaji Maharaj Airport CAAQMS', defaultCause: 'Aviation emissions, industrial units & arterial road congestion' },
    { code: 'K/W', name: 'Andheri West / Juhu / Versova', nameMr: 'अंधेरी पश्चिम / जुहू / वर्सोवा', zone: 'Western Suburbs', lat: 19.1364, lng: 72.8296, station: 'Versova MPCB Station', defaultCause: 'Vehicular transit & construction activity on Link Road' },
    { code: 'L', name: 'Kurla / Chunabhatti', nameMr: 'कुर्ला / चुनाभट्टी', zone: 'Eastern Suburbs', lat: 19.0728, lng: 72.8826, station: 'Kurla West CAAQMS', defaultCause: 'Scrap metal processing, diesel auto exhaust & urban waste burning' },
    { code: 'M/E', name: 'Chembur / Mahul / Trombay', nameMr: 'चेंबर / माहूल / ट्रॉम्बे', zone: 'Eastern Suburbs', lat: 19.0522, lng: 72.9005, station: 'Mahul Petrochemical CAAQMS', defaultCause: 'Refinery hydrocarbon emissions, VOCs & industrial sulphur dioxide' },
    { code: 'M/W', name: 'Govandi / Deonar / Mankhurd', nameMr: 'गोवंडी / देवनार / मानखुर्द', zone: 'Eastern Suburbs', lat: 19.0550, lng: 72.9150, station: 'Deonar Dumping Ground CAAQMS', defaultCause: 'Landfill methane fires, toxic smoke & biomedical incineration' },
    { code: 'N', name: 'Ghatkopar / Vikhroli W', nameMr: 'घाटकोपर / विक्रोळी पश्चिम', zone: 'Eastern Suburbs', lat: 19.0863, lng: 72.9081, station: 'Ghatkopar CAAQMS', defaultCause: 'Highway freight exhaust & building reconstruction debris' },
    { code: 'P/N', name: 'Malad / Marve', nameMr: 'मालाड / मार्वे', zone: 'Western Suburbs', lat: 19.1860, lng: 72.8490, station: 'Malad West MPCB Station', defaultCause: 'Commercial hub vehicular flow & local debris accumulation' },
    { code: 'P/S', name: 'Goregaon / Oshiwara', nameMr: 'गोरेगाव / ओशिवरा', zone: 'Western Suburbs', lat: 19.1663, lng: 72.8526, station: 'Aarey Colony Perimeter CAAQMS', defaultCause: 'Arterial highway congestion & vehicular tailpipe exhaust' },
    { code: 'R/C', name: 'Dahisar / Borivali N', nameMr: 'दहिसर / बोरिवली उत्तर', zone: 'Western Suburbs', lat: 19.2540, lng: 72.8590, station: 'Dahisar Toll Plaza CAAQMS', defaultCause: 'Toll gate heavy vehicle idling & highway freight transit' },
    { code: 'R/N', name: 'Borivali West & East', nameMr: 'बोरिवली पश्चिम आणि पूर्व', zone: 'Western Suburbs', lat: 19.2307, lng: 72.8567, station: 'Borivali National Park CAAQMS', defaultCause: 'Transit hub density balanced by Sanjay Gandhi National Park canopy' },
    { code: 'R/S', name: 'Kandivali West & East', nameMr: 'कांदिवली पश्चिम आणि पूर्व', zone: 'Western Suburbs', lat: 19.2095, lng: 72.8526, station: 'Kandivali Industrial Area CAAQMS', defaultCause: 'Industrial fabrication units & residential construction dust' },
    { code: 'S', name: 'Bhandup / Kanjurmarg', nameMr: 'भांडुप / कांजूरमार्ग', zone: 'Eastern Suburbs', lat: 19.1440, lng: 72.9350, station: 'Kanjurmarg Landfill CAAQMS', defaultCause: 'Landfill methane & bio-waste decomposition odor and particles' },
    { code: 'T', name: 'Mulund / Nahur', nameMr: 'मुलुंड / नाहूर', zone: 'Eastern Suburbs', lat: 19.1720, lng: 72.9560, station: 'Mulund East CAAQMS', defaultCause: 'Intercity freight traffic & transit corridor particulate' }
  ]
};
