/**
 * MumbAIR Automated Test Suite
 * Comprehensive verification of AQI Mathematics, RBAC, State Machine,
 * Separation of Duties, Atomic Transactions, SLA Engine, and Security.
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment
const localStorageMock = (function(){
  let store = {};
  return {
    getItem: (key) => store[key] !== undefined ? store[key] : null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();

global.window = {
  localStorage: localStorageMock,
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.localStorage = localStorageMock;
global.CustomEvent = class CustomEvent {
  constructor(name, opts){ this.name = name; this.detail = opts ? opts.detail : null; }
};
global.Blob = class Blob {
  constructor(parts, opts){ this.parts = parts; this.type = opts ? opts.type : ''; }
};

// 2. Load Core Application Modules in Order
const baseDir = path.resolve(__dirname, '..');
function loadModule(relPath){
  const code = fs.readFileSync(path.join(baseDir, relPath), 'utf8');
  eval(code);
}

loadModule('js/config.js');
loadModule('js/utils.js');
loadModule('js/storage.js');
loadModule('js/auth.js');
loadModule('js/workflow.js');

const CONFIG = window.MumbAIR.CONFIG;
const UTILS = window.MumbAIR.UTILS;
const STORAGE = window.MumbAIR.STORAGE;
const AUTH = window.MumbAIR.AUTH;
const WORKFLOW = window.MumbAIR.WORKFLOW;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details){
  totalTests++;
  if(condition){
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✕ FAIL: ${testName}`);
    if(details) console.error(`    Details: ${details}`);
  }
}

console.log('\n======================================================');
console.log('       MumbAIR COMPREHENSIVE AUTOMATED TEST SUITE     ');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: CPCB NAQI Calculation & Breakpoint Mathematics
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: CPCB NAQI Calculation & Scientific Accuracy ---');

// Test 1.1: Exact breakpoint boundary for PM2.5 Good (0-30 -> AQI 0-50)
const subGood = UTILS.calcSubIndex('PM25', 30);
assert(subGood === 50, 'PM2.5 concentration of 30 µg/m³ maps exactly to Sub-Index 50 (Good upper boundary)', `got ${subGood}`);

// Test 1.2: Exact breakpoint boundary for PM2.5 Satisfactory start (31 -> AQI ~52)
const subSat = UTILS.calcSubIndex('PM25', 31);
assert(subSat >= 51 && subSat <= 53, 'PM2.5 concentration of 31 µg/m³ maps to Satisfactory (AQI 51-53)', `got ${subSat}`);

// Test 1.3: Fractional pollutant concentration does not throw or prematurely distort
const subFrac = UTILS.calcSubIndex('PM25', 68.4);
assert(typeof subFrac === 'number' && subFrac > 100 && subFrac < 200, 'Fractional concentration 68.4 µg/m³ correctly yields Moderate sub-index without premature rounding errors', `got ${subFrac}`);

// Test 1.4: CO unit normalization from µg/m³ to mg/m³
const subCoUg = UTILS.calcSubIndex('CO', 1500); // 1500 µg/m³ = 1.5 mg/m³ -> Satisfactory (AQI 51-100)
const subCoMg = UTILS.calcSubIndex('CO', 1.5);
assert(subCoUg === subCoMg && subCoUg > 50 && subCoUg <= 100, 'Carbon Monoxide automatically normalizes µg/m³ to mg/m³ according to CPCB standard', `got ug=${subCoUg}, mg=${subCoMg}`);

// Test 1.5: CPCB 3-pollutant rule (Minimum 3 parameters with at least one PM2.5 or PM10)
const aqiSingle = UTILS.calculateIndianAqi({ pm25: 85 });
assert(aqiSingle.isOfficial === false && aqiSingle.aqi !== null, 'Single pollutant yields indicative AQI with isOfficial: false (CPCB mandate)', `isOfficial=${aqiSingle.isOfficial}`);

const aqiTwoNoPm = UTILS.calculateIndianAqi({ no2: 45, so2: 25, co: 1.2 });
assert(aqiTwoNoPm.isOfficial === false, 'Three pollutants lacking PM2.5 and PM10 yields isOfficial: false', `isOfficial=${aqiTwoNoPm.isOfficial}`);

const aqiOfficial = UTILS.calculateIndianAqi({ pm25: 95, pm10: 180, no2: 45, so2: 20 });
assert(aqiOfficial.isOfficial === true && aqiOfficial.dominant === 'PM2.5' && aqiOfficial.category === 'Poor', 'Valid multi-pollutant dataset yields official CPCB NAQI with correct dominant pollutant and category', `aqi=${aqiOfficial.aqi}, dominant=${aqiOfficial.dominant}, cat=${aqiOfficial.category}`);

// Test 1.6: Null/NaN inputs handling
const aqiEmpty = UTILS.calculateIndianAqi({});
assert(aqiEmpty.aqi === null && aqiEmpty.category === 'Unavailable', 'Empty pollutant dataset returns aqi: null and Unavailable status without NaN errors', `category=${aqiEmpty.category}`);

// -----------------------------------------------------------------------------
// SUITE 2: Security, XSS & CSV Formula Injection Protection
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Security & Input Sanitization (XSS & CSV Injection) ---');

// Test 2.1: Context-safe HTML escaping
const xssPayload = '<script>alert("pwned")</script><img src=x onerror=alert(1)>';
const escapedHtml = UTILS.escapeHtml(xssPayload);
assert(!escapedHtml.includes('<script>') && !escapedHtml.includes('<img'), 'HTML escaping eliminates executable HTML tags and event handlers', `escaped: ${escapedHtml}`);

// Test 2.2: CSV Formula Injection Prevention (CWE-1236)
const formulaPayload = '=SUM(1+1)';
const sanitizedCell = UTILS.sanitizeCsvCell(formulaPayload);
assert(sanitizedCell.includes("'=SUM"), 'CSV cell starting with "=" is prefixed with a single quote to neutralize formula execution in spreadsheet software', `cell=${sanitizedCell}`);

const atPayload = '@SUM(A1:A10)';
assert(UTILS.sanitizeCsvCell(atPayload).includes("'@"), 'CSV cell starting with "@" is neutralized', `cell=${UTILS.sanitizeCsvCell(atPayload)}`);

// Test 2.3: CSV quote and newline escaping
const commaCell = 'Worli, Lower Parel, "Mumbai"';
const escapedCommaCell = UTILS.sanitizeCsvCell(commaCell);
assert(escapedCommaCell.startsWith('"') && escapedCommaCell.endsWith('"') && escapedCommaCell.includes('""Mumbai""'), 'CSV cells containing commas and quotes are RFC 4180 escaped with doubled quotes', `cell=${escapedCommaCell}`);

// -----------------------------------------------------------------------------
// SUITE 3: Storage Engine, Atomic Transactions & Reseeding Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Storage Engine & Atomic State Operations ---');

STORAGE.resetAll();
const initialState = STORAGE.loadState();
assert(initialState.schemaVersion === 4, 'Storage initializes with Schema Version 4', `version=${initialState.schemaVersion}`);
assert(initialState._initialized === true, 'Storage sets _initialized flag on first boot', `_init=${initialState._initialized}`);

// Test 3.1: Reseeding prevention when reports array is intentionally empty
initialState.reports = [];
STORAGE.saveState(initialState);
const reloadedEmpty = STORAGE.loadState();
assert(Array.isArray(reloadedEmpty.reports) && reloadedEmpty.reports.length === 0, 'Empty reports collection is preserved without accidental reseeding defaults', `length=${reloadedEmpty.reports.length}`);

// Test 3.2: Atomic update transaction
STORAGE.resetAll(); // Reset to clean initial seed
const initialSeq = STORAGE.loadState()._seq;
const updateResult = STORAGE.atomicUpdate(function(state){
  state.reports[0].upvotes = 999;
  return { success: true, count: 999 };
});
assert(updateResult.success === true, 'Atomic transaction completes with success', `success=${updateResult.success}`);
const verifySavedState = STORAGE.loadState();
assert(verifySavedState.reports[0].upvotes === 999, 'Atomic mutation persists to storage', `upvotes=${verifySavedState.reports[0].upvotes}`);
assert(verifySavedState._seq > initialSeq, 'Atomic transaction increments sequence number', `seq=${verifySavedState._seq}`);

// Test 3.3: Atomic transaction rollback on validation failure
const rollbackResult = STORAGE.atomicUpdate(function(state){
  state.reports[0].upvotes = 1;
  return { success: false, error: 'Simulated business rule failure' };
});
assert(rollbackResult.success === false, 'Atomic transaction returns failure when mutator rejects', `success=${rollbackResult.success}`);
const postRollbackState = STORAGE.loadState();
assert(postRollbackState.reports[0].upvotes === 999, 'State was NOT mutated when transaction returned success: false', `upvotes=${postRollbackState.reports[0].upvotes}`);

// -----------------------------------------------------------------------------
// SUITE 4: Validated Complaint State Machine
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Validated Complaint State Machine ---');

// Test 4.1: Legal transition: SUBMITTED -> UNDER_REVIEW
const valLegal = WORKFLOW.validateStateTransition('SUBMITTED', 'UNDER_REVIEW');
assert(valLegal.valid === true, 'SUBMITTED to UNDER_REVIEW is recognized as a legal transition', `valid=${valLegal.valid}`);

// Test 4.2: Illegal transition: SUBMITTED directly to RESOLVED
const valIllegal = WORKFLOW.validateStateTransition('SUBMITTED', 'RESOLVED');
assert(valIllegal.valid === false, 'SUBMITTED directly to RESOLVED is strictly rejected as illegal', `valid=${valIllegal.valid}, error=${valIllegal.error}`);

// Test 4.3: Mandatory justification requirement for REJECTED and ON_HOLD
const valHoldNoReason = WORKFLOW.validateStateTransition('IN_PROGRESS', 'ON_HOLD', { reason: '' });
assert(valHoldNoReason.valid === false, 'Transition to ON_HOLD without justification is rejected', `valid=${valHoldNoReason.valid}`);

const valHoldWithReason = WORKFLOW.validateStateTransition('IN_PROGRESS', 'ON_HOLD', { reason: 'Awaiting court order on refinery flaring protocol' });
assert(valHoldWithReason.valid === true, 'Transition to ON_HOLD with documented justification is accepted', `valid=${valHoldWithReason.valid}`);

// -----------------------------------------------------------------------------
// SUITE 5: Role-Based Access Control (RBAC) & Scope Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Strict Role-Based Authorization & Scope Boundaries ---');

const fieldOfficerSanjay = { id: 'user_fld_1', name: 'Officer Sanjay Shinde', role: 'FIELD_OFFICER', ward: 'M/E' };
const fieldOfficerRahul = { id: 'user_fld_2', name: 'Officer Rahul Mane', role: 'FIELD_OFFICER', ward: 'G/S' };
const wardOfficerPriya = { id: 'user_wrd_1', name: 'Dr. Priya Kamble', role: 'WARD_OFFICER', ward: 'M/E' };
const wardOfficerRajesh = { id: 'user_wrd_2', name: 'Rajesh Varma', role: 'WARD_OFFICER', ward: 'G/S' };
const citizenUserAarav = { id: 'user_cit_1', name: 'Aarav Patil', role: 'CITIZEN' };
const superAdminRoot = { id: 'user_sup_1', name: 'Root System Admin', role: 'SUPER_ADMIN' };

const caseMb1001 = STORAGE.loadState().reports.find(r => r.id === 'MB-1001'); // Ward M/E, assigned to Sanjay

// Test 5.1: Field officer can only inspect assigned case
const foAssignedCheck = WORKFLOW.canActorPerformAction('START_INSPECTION', caseMb1001, fieldOfficerSanjay);
assert(foAssignedCheck.allowed === true, 'Assigned Field Officer Sanjay is authorized to inspect case MB-1001', `allowed=${foAssignedCheck.allowed}`);

const foUnassignedCheck = WORKFLOW.canActorPerformAction('START_INSPECTION', caseMb1001, fieldOfficerRahul);
assert(foUnassignedCheck.allowed === false, 'Unassigned Field Officer Rahul is prohibited from inspecting case MB-1001', `error=${foUnassignedCheck.error}`);

// Test 5.2: Field officer cannot assign cases or approve resolutions
const foAssignCheck = WORKFLOW.canActorPerformAction('ASSIGN_OFFICER', caseMb1001, fieldOfficerSanjay);
assert(foAssignCheck.allowed === false, 'Field Officer is prohibited from assigning complaints', `error=${foAssignCheck.error}`);

// Test 5.3: Ward Officer restricted to authorized ward
const woSameWardCheck = WORKFLOW.canActorPerformAction('ASSIGN_OFFICER', caseMb1001, wardOfficerPriya);
assert(woSameWardCheck.allowed === true, 'Ward Officer Priya is authorized to assign cases within Ward M/E', `allowed=${woSameWardCheck.allowed}`);

const woDiffWardCheck = WORKFLOW.canActorPerformAction('ASSIGN_OFFICER', caseMb1001, wardOfficerRajesh);
assert(woDiffWardCheck.allowed === false, 'Ward Officer Rajesh (Ward G/S) is prohibited from acting on Ward M/E case', `error=${woDiffWardCheck.error}`);

// -----------------------------------------------------------------------------
// SUITE 6: Separation of Duties (Four-Eyes Principle)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Separation of Duties & Four-Eyes Verification ---');

// Test 6.1: Field Inspector who submitted resolution CANNOT approve own resolution
const selfApprovalAttempt = WORKFLOW.verifyResolution('MB-1001', fieldOfficerSanjay, true, 'Looks fine to me');
assert(selfApprovalAttempt.success === false, 'Self-approval by assigned inspecting officer is strictly blocked (Four-Eyes Principle)', `error=${selfApprovalAttempt.error}`);

// Test 6.2: Independent Ward Officer CAN approve resolution
const independentApproval = WORKFLOW.verifyResolution('MB-1001', wardOfficerPriya, true, 'Field mitigation verified compliant with BMC clean air standards.');
assert(independentApproval.success === true, 'Independent supervisor successfully verifies and approves resolution', `success=${independentApproval.success}`);

const postApprovalCase = STORAGE.loadState().reports.find(r => r.id === 'MB-1001');
assert(postApprovalCase.status === 'RESOLVED' && postApprovalCase.resolution.approvedBy === 'Dr. Priya Kamble', 'Complaint status updated to RESOLVED with supervisor audit trail', `status=${postApprovalCase.status}`);

// Test 6.3: Super Admin cannot routinely approve field resolutions
const superAdminApprovalCheck = WORKFLOW.canActorPerformAction('APPROVE_RESOLUTION', caseMb1001, superAdminRoot);
assert(superAdminApprovalCheck.allowed === false, 'Super Admin role is prevented from routine field resolution approvals', `error=${superAdminApprovalCheck.error}`);

// -----------------------------------------------------------------------------
// SUITE 7: SLA Calculation Engine & Timelines
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 7: SLA Calculation & Deadline Accuracy ---');

const now = Date.now();

// Test 7.1: Active case within deadline -> ON_TRACK
const caseOnTrack = { createdAt: new Date(now - 2 * 3600 * 1000).toISOString(), priority: 'MEDIUM', status: 'IN_PROGRESS' };
const slaOnTrack = WORKFLOW.calculateSla(caseOnTrack);
assert(slaOnTrack.status === 'ON_TRACK' && slaOnTrack.isCompliant === true, 'Active case well within deadline returns ON_TRACK with isCompliant: true', `status=${slaOnTrack.status}`);

// Test 7.2: Active case breached deadline -> BREACHED
const caseBreached = { createdAt: new Date(now - 55 * 3600 * 1000).toISOString(), priority: 'MEDIUM', status: 'IN_PROGRESS' };
const slaBreached = WORKFLOW.calculateSla(caseBreached);
assert(slaBreached.status === 'BREACHED' && slaBreached.isCompliant === false, 'Active case exceeding SLA policy returns BREACHED with isCompliant: false', `status=${slaBreached.status}`);

// Test 7.3: Resolved case on-time -> COMPLETED_ON_TIME
const caseResolvedOnTime = {
  createdAt: new Date(now - 10 * 3600 * 1000).toISOString(),
  resolvedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
  priority: 'MEDIUM',
  status: 'RESOLVED'
};
const slaResOnTime = WORKFLOW.calculateSla(caseResolvedOnTime);
assert(slaResOnTime.status === 'COMPLETED_ON_TIME' && slaResOnTime.isCompliant === true, 'Case resolved before deadline is classified as COMPLETED_ON_TIME', `status=${slaResOnTime.status}`);

// Test 7.4: Resolved case late -> COMPLETED_LATE (MANDATORY: Never marked compliant!)
const caseResolvedLate = {
  createdAt: new Date(now - 80 * 3600 * 1000).toISOString(),
  resolvedAt: new Date(now - 2 * 3600 * 1000).toISOString(), // Took 78h on a 48h SLA
  priority: 'MEDIUM',
  status: 'RESOLVED'
};
const slaResLate = WORKFLOW.calculateSla(caseResolvedLate);
assert(slaResLate.status === 'COMPLETED_LATE' && slaResLate.isCompliant === false, 'Late resolution is strictly classified as COMPLETED_LATE and NOT compliant', `status=${slaResLate.status}, isCompliant=${slaResLate.isCompliant}`);

// Test 7.5: On-Hold case -> PAUSED
const caseOnHold = { createdAt: new Date(now - 10 * 3600 * 1000).toISOString(), priority: 'HIGH', status: 'ON_HOLD', holdReason: 'Court Stay' };
const slaHold = WORKFLOW.calculateSla(caseOnHold);
assert(slaHold.status === 'PAUSED' && slaHold.isCompliant === true, 'Case on hold correctly pauses SLA clock with reason', `status=${slaHold.status}`);

// -----------------------------------------------------------------------------
// SUMMARY & EXIT
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TOTAL TESTS:  ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log('======================================================\n');

if(failedTests > 0){
  console.error(`❌ TEST SUITE FAILED with ${failedTests} failing tests.`);
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY! 100% Core Requirements Verified.');
  process.exit(0);
}
