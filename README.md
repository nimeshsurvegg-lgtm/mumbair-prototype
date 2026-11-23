# 🌬️ MumbAIR
### *Greater Mumbai Air Quality Intelligence & Municipal Operations Platform*
> **"Observe → Understand → Report → Assign → Investigate → Act → Verify → Improve"**  
> *Unified Environmental Surveillance & Municipal Governance Suite for the 24 Administrative Wards of Greater Mumbai (Brihanmumbai Municipal Corporation — BMC / MCGM)*

---

## 📖 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Ecosystem Architecture (Citizen Portal vs. Authority Operations)](#2-ecosystem-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Official CPCB National AQI (NAQI) Calculation Engine](#4-official-cpcb-national-aqi-naqi-calculation-engine)
5. [Atmospheric Telemetry & Source Transparency](#5-atmospheric-telemetry--source-transparency)
6. [Validated 16-State Complaint Lifecycle](#6-validated-16-state-complaint-lifecycle)
7. [Role-Based Access Control (RBAC) & Scope Boundaries](#7-role-based-access-control-rbac--scope-boundaries)
8. [Separation of Duties & Four-Eyes Verification](#8-separation-of-duties--four-eyes-verification)
9. [SLA Calculation Engine & Deadline Enforcement](#9-sla-calculation-engine--deadline-enforcement)
10. [Application Security & Injection Hardening (XSS / CWE-1236)](#10-application-security--injection-hardening)
11. [Storage Architecture & Atomic State Transactions](#11-storage-architecture--atomic-state-transactions)
12. [Geospatial Map Intelligence & Satellite Layers](#12-geospatial-map-intelligence--satellite-layers)
13. [Desktop Header Responsiveness & Viewport Compatibility](#13-desktop-header-responsiveness--viewport-compatibility)
14. [Adaptive Mobile Experience (360px – 768px)](#14-adaptive-mobile-experience)
15. [Document & Report Studio (PDF / CSV Exports)](#15-document--report-studio)
16. [Verified Mumbai News & Environmental Bulletins](#16-verified-mumbai-news--environmental-bulletins)
17. [Automated Test Suite & Verification Instructions](#17-automated-test-suite--verification-instructions)
18. [Project File Inventory](#18-project-file-inventory)
19. [Local Setup & Startup Guide](#19-local-setup--startup-guide)
20. [System Limitations & Operational Transparency](#20-system-limitations--operational-transparency)

---

## 1. Executive Summary & Purpose

**MumbAIR** is a full-featured, scientifically grounded environmental intelligence and municipal operations platform purpose-built for the residents and municipal administration of Greater Mumbai.

Greater Mumbai faces intricate micro-climatic atmospheric challenges:
* **Nocturnal Coastal Temperature Inversions:** Low-altitude trapping of pollutants during winter months.
* **Heavy Redevelopment & Demolition:** Coarse dust ($\text{PM}_{10}$) from over 1,500 active infrastructure and high-rise construction sites.
* **Refinery & Chemical Corridors:** Elevated sulphur dioxide ($\text{SO}_2$) and hydrocarbon flares in Chembur, Mahul, and Trombay (Ward M/E).
* **Legacy Landfill Smoldering:** Subsurface methane combustion generating particulate smoke at Deonar and Mulund dumping grounds.
* **Arterial Traffic Congestion:** Nitrogen dioxide ($\text{NO}_2$) and fine particulates ($\text{PM}_{2.5}$) along the Western and Eastern Express Highways.

MumbAIR connects public atmospheric awareness with verifiable municipal accountability. It gives citizens an honest, transparent view of the air they breathe while providing municipal officers with an auditable, four-eyes verified operations management platform.

---

## 2. Ecosystem Architecture

MumbAIR is partitioned into two distinct operational portals sharing a single synchronized state engine:

### 🧑‍💼 Public Citizen Portal
* **Real-Time AQI Hero Dashboard:** Apple Weather-inspired card with dynamic SVG arc gauge, official CPCB categorizations (0–500+ scale), and dominant pollutant detection ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$).
* **Surface Weather Telemetry:** Ambient temperature, relative humidity, wind velocity, and onshore Arabian Sea breeze direction ($290^\circ$ Westerly).
* **6-Parameter Pollutant Breakdown:** Concentrations benchmarked against CPCB 24-hour National Ambient Air Quality Standards (NAAQS) with explicit CAMS model grid attribution.
* **Interactive Map:** Leaflet-powered multi-basemap (Streets, Satellite, Light Canvas, OSM HOT) with 24 administrative ward pins, real CAAQMS stations, and geotagged community complaints.
* **Civic Reporting Wizard:** 3-step complaint filing with 1.5 km Haversine duplicate collision prevention, automated ward routing, and photo watermarking.
* **Complaint Tracking Feed:** Public endorsement upvoting, category filtering, and transparent 16-step lifecycle progression.
* **Environmental Bulletin & Schemes:** Curated, verifiable updates from MCGM, MPCB, and CPCB with official circular links.
* **Solutions Center:** Evidence-based citizen health guidance and municipal mitigation progress tracking.
* **Appearance Customizer:** 6 professionally designed themes preserving immutable CPCB AQI severity colors.
* **Report Studio:** One-click citizen complaint receipts with printable PDF formatting and CSV download.

### 🏛️ Municipal Operations Portal (`#authority`)
* **Role-Based Authentication:** Authenticated access restricted to verified municipal demo personas (`FIELD_OFFICER`, `WARD_OFFICER`, `DEPARTMENT_HEAD`, `CITY_ADMIN`, `SUPER_ADMIN`).
* **Command Center:** Real-time caseload KPIs (Active Caseload, In Field Investigation, SLA Breached, Certified Resolution Rate), Operational Attention triage panel, and Ward Operations Ledger.
* **Complaint Inbox:** Central registry with multi-column filtering, priority overrides, and role-scoped CSV export.
* **1-Click Dispatch & Assignment:** Assigns available field officers based on live workload, sets mandatory SLA resolution benchmarks (6h, 24h, 48h, 72h), and attaches supervisor directives.
* **Field Inspection Engine:** Mobile-optimized checklist execution for on-ground officers, optical opacity checks, spot-fine notice triggers (MMC Act Section 368), and mitigation evidence submission.
* **Separation of Duties (Four-Eyes Verification):** Dedicated verification modal blocking self-approvals by inspecting officers and requiring independent supervisory review notes.
* **24 Administrative Wards & Departments Matrix:** Detailed workload and compliance scorecards across SWM, APC, BUILDING, ROADS, DRAINAGE, and HEALTH.
* **Resource & Fleet Management:** Real-time tracking of anti-smog misting cannons, mobile CAAQMS vans, and mechanized sweepers.
* **Ops AI Assistant:** Deterministic calculation queries for operational bottlenecks, recidivism clusters, and executive briefings.
* **Audit Trail Ledger:** Immutable, append-only log of all triage, dispatch, inspection, and verification actions.

---

## 3. Technology Stack

* **Frontend Architecture:** Vanilla JavaScript (ES6+), HTML5, CSS3. Zero-build architecture; runs directly in any modern browser without compilers or bundlers.
* **Mapping Engine:** [Leaflet 1.9.4](https://leafletjs.com/) (bundled locally in `/vendor/leaflet/` for offline resilience).
* **Basemap Tile Providers:**
  * Esri World Street Map (`server.arcgisonline.com`)
  * Esri World Imagery Satellite (`server.arcgisonline.com`)
  * Esri World Light Gray Canvas (`server.arcgisonline.com`)
  * OpenStreetMap Humanitarian (`tile.openstreetmap.fr/hot`)
* **Data Visualization:** [Chart.js 4.4.1](https://www.chartjs.org/) (bundled locally in `/vendor/chartjs/`).
* **Atmospheric Data Gateway:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) & Copernicus Atmosphere Monitoring Service (CAMS).
* **Weather Telemetry Gateway:** Open-Meteo Weather Forecast API (ECMWF high-resolution model).
* **State & Persistence:** Browser `localStorage` with reactive multi-dashboard synchronization (`mumbair_state_v4`, `mumbair_auth_session_v4`, `mumbair_theme_preference`).
* **Database Schema (Production Ready):** PostgreSQL schema with Row-Level Security (RLS) located in `/supabase/schema.sql`.

---

## 4. Official CPCB National AQI (NAQI) Calculation Engine

MumbAIR strictly adheres to the official **Central Pollution Control Board (CPCB)** National Air Quality Index calculation methodology:

### Sub-Index Linear Interpolation Formula
For any pollutant concentration $C_p$ falling within breakpoint range $[B_{\text{LO}}, B_{\text{HI}}]$ with sub-index range $[I_{\text{LO}}, I_{\text{HI}}]$:

$$I_p = \left[ \frac{I_{\text{HI}} - I_{\text{LO}}}{B_{\text{HI}} - B_{\text{LO}}} \right] \cdot (C_p - B_{\text{LO}}) + I_{\text{LO}}$$

### Composite AQI
$$\text{AQI} = \max\left(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{SO2}}, I_{\text{CO}}, I_{\text{O3}}, I_{\text{NH3}}\right)$$

### Official CPCB Breakpoints Matrix
| Pollutant | Good (0–50) | Satisfactory (51–100) | Moderate (101–200) | Poor (201–300) | Very Poor (301–400) | Severe (401–500) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$\text{PM}_{2.5}$** ($\mu\text{g/m}^3$) | 0 – 30 | 31 – 60 | 61 – 90 | 91 – 120 | 121 – 250 | 251 – 500 |
| **$\text{PM}_{10}$** ($\mu\text{g/m}^3$) | 0 – 50 | 51 – 100 | 101 – 250 | 251 – 350 | 351 – 430 | 431 – 600 |
| **$\text{NO}_2$** ($\mu\text{g/m}^3$) | 0 – 40 | 41 – 80 | 81 – 180 | 181 – 280 | 281 – 400 | 401 – 500 |
| **$\text{SO}_2$** ($\mu\text{g/m}^3$) | 0 – 40 | 41 – 80 | 81 – 380 | 381 – 800 | 801 – 1600 | 1601 – 2000 |
| **$\text{CO}$** ($\text{mg/m}^3$) | 0 – 1.0 | 1.1 – 2.0 | 2.1 – 10.0 | 10.1 – 17.0 | 17.1 – 34.0 | 34.1 – 50.0 |
| **$\text{O}_3$** ($\mu\text{g/m}^3$) | 0 – 50 | 51 – 100 | 101 – 168 | 169 – 208 | 209 – 748 | 749 – 1000 |
| **$\text{NH}_3$** ($\mu\text{g/m}^3$) | 0 – 200 | 201 – 400 | 401 – 800 | 801 – 1200 | 1201 – 1800 | 1801 – 2500 |

### Critical Engineering Safeguards:
1. **CO Unit Normalization:** Open-Meteo returns carbon monoxide in $\mu\text{g/m}^3$ (e.g. $1300\ \mu\text{g/m}^3$). CPCB breakpoints strictly evaluate CO in $\text{mg/m}^3$ ($1.3\ \text{mg/m}^3$). `UTILS.calcSubIndex` automatically detects values $> 50$ and divides by $1000$, eliminating massive artificial distortions.
2. **CPCB 3-Parameter Mandate:** Under CPCB rules, an official AQI requires a minimum of **three measured parameters**, of which **at least one must be a particulate parameter** ($\text{PM}_{2.5}$ or $\text{PM}_{10}$). Datasets failing this test are flagged as `isOfficial: false` and rendered with an "Indicative Only" disclaimer.
3. **No Fabricated Multipliers:** Eliminates arbitrary scaling factors (such as `currPm25 * 2.1`).

---

## 5. Atmospheric Telemetry & Source Transparency

MumbAIR ensures honest and transparent data sourcing:
* **Copernicus CAMS Model Grid:** Real-time pollutant readings are fetched from Open-Meteo's Copernicus Atmosphere Monitoring Service (CAMS) European atmospheric reanalysis grid ($\sim 11\text{ km}$ resolution). The UI clearly labels: `"Values from Copernicus CAMS model grid (~11km)"`.
* **Station Baseline Distinctions:** Physical CAAQMS station coordinates (e.g., Mahul Petrochemical CAAQMS, Bandra Kurla Complex CAAQMS) are distinguished from model grid estimates.
* **Offline Calibrated Fallback:** When internet access is disconnected, the system loads calibrated station baseline records and explicitly notifies the user: `"Simulated baseline (offline cache)"`.
* **Coordinate-Specific Caching:** Telemetry cache keys are tied to exact geographic coordinates (`lat_lng`), preventing cross-ward data contamination when switching between locations.

---

## 6. Validated 16-State Complaint Lifecycle

Civic complaints transition through a centralized, strictly validated state machine defined in `CONFIG.STATUS_LIFECYCLE`:

```
   ┌─────────────────────────────────────────────────────────────┐
   │                        SUBMITTED                            │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
                   ▼                             ▼
            UNDER_REVIEW                     DUPLICATE
                   │                             │
                   ▼                             ▼
                VERIFIED                      (CLOSED)
                   │
                   ▼
                ASSIGNED ◄────────┐
                   │              │
                   ▼              │
              IN_PROGRESS         │ (REASSIGNED)
                   │              │
                   ▼              │
          INSPECTION_COMPLETED    │
                   │              │
                   ▼              │
         RESOLUTION_SUBMITTED ────┼─────────────┐
                   │              │             │
                   ▼              │             ▼
           RESOLUTION_REVIEW ─────┘          ON_HOLD / ESCALATED
                   │
                   ▼
                RESOLVED ◄──────────────────────┐
                   │                            │
                   ▼                            │ (REOPENED)
                 CLOSED ────────────────────────┘
```

### Transition & Prerequisite Matrix:
| State | Legal Next States | Prerequisites / Mandatory Fields |
| :--- | :--- | :--- |
| `SUBMITTED` | `UNDER_REVIEW`, `DUPLICATE`, `REJECTED` | Valid GPS, citizen contact, category |
| `UNDER_REVIEW` | `VERIFIED`, `REJECTED`, `DUPLICATE` | Preliminary ward officer triage notes |
| `VERIFIED` | `ASSIGNED`, `REJECTED` | Ward verification sign-off |
| `ASSIGNED` | `IN_PROGRESS`, `REASSIGNED`, `ON_HOLD` | Valid officer assignment ID and target SLA |
| `IN_PROGRESS` | `INSPECTION_COMPLETED`, `ESCALATED`, `ON_HOLD` | Field officer checklist execution |
| `INSPECTION_COMPLETED`| `RESOLUTION_SUBMITTED`, `ESCALATED` | Site inspection notes & optical opacity check |
| `RESOLUTION_SUBMITTED`| `RESOLUTION_REVIEW`, `REASSIGNED` | Photographic proof of on-ground mitigation |
| `RESOLUTION_REVIEW` | `RESOLVED`, `REJECTED`, `IN_PROGRESS` | Four-eyes supervisory review |
| `ON_HOLD` | `IN_PROGRESS`, `ASSIGNED` | **Mandatory documented justification reason** |
| `ESCALATED` | `ASSIGNED`, `IN_PROGRESS` | **Mandatory escalation reason and priority boost** |
| `REASSIGNED` | `ASSIGNED`, `IN_PROGRESS` | **Mandatory reassignment transfer reason** |
| `REOPENED` | `UNDER_REVIEW`, `ASSIGNED` | **Mandatory citizen/supervisor reopening reason** |
| `RESOLVED` | `CLOSED`, `REOPENED` | Approved resolution verification |
| `REJECTED` | `REOPENED` | **Mandatory rejection reason** |
| `DUPLICATE` | `CLOSED` | Target parent complaint ID link |
| `CLOSED` | `REOPENED` | Final case archival |

---

## 7. Role-Based Access Control (RBAC) & Scope Boundaries

MumbAIR enforces strict scope boundaries across all user personas:

| Role Key | Role Name | Geographic & Functional Scope | Allowed Actions |
| :--- | :--- | :--- | :--- |
| `CITIZEN` | Public Citizen | `OWN_ONLY` (Own complaints) | File reports, track status, upvote public complaints, export personal receipt. |
| `FIELD_OFFICER` | On-Ground Inspector | `ASSIGNED_ONLY` (Explicitly assigned cases) | View assigned tasks, fill field checklists, submit photographic resolution proof. |
| `WARD_OFFICER` | Ward Executive Officer | `WARD_ONLY` (Assigned administrative ward) | Triage ward cases, dispatch officers, verify resolutions, publish ward advisories. |
| `DEPARTMENT_HEAD`| Department Chief | `DEPT_ONLY` (Assigned civic department) | Allocate departmental caseload, manage fleet & misting cannons, audit compliance. |
| `CITY_ADMIN` | Municipal Commissioner | `CITY_WIDE` (All 24 Wards & Departments) | City-wide oversight, cross-ward reallocation, export city ledger, executive analytics. |
| `SUPER_ADMIN` | System Administrator | `SYSTEM_ADMIN` (Security & Core Config) | Platform diagnostics, audit log inspection, schema management. |

### Verified Demo Roster
Pre-configured authenticated demo accounts matching official municipal records:
* **Field Officer:** `sanjay.shinde@mcgm.gov.in.demo` (Ward M/E · Solid Waste Management)
* **Ward Executive Officer:** `priya.sharma@mcgm.gov.in.demo` (Ward M/E · Ward Executive Officer)
* **Department Head:** `vikram.deshmukh@mcgm.gov.in.demo` (City-Wide · Air Pollution Control)
* **City Administrator:** `commissioner.ops@mcgm.gov.in.demo` (Greater Mumbai Operations Command)
* **Super Admin:** `root.admin@mcgm.gov.in.demo` (System Security & Governance)

---

## 8. Separation of Duties & Four-Eyes Verification

To prevent operational collusion and fraudulent case closures, MumbAIR implements the **Four-Eyes Principle (Separation of Duties)**:
1. **Self-Approval Blocked:** An inspecting officer who executed the field work or submitted the mitigation proof is **mathematically and structurally blocked** from approving the resolution:
   $$\text{actor.id} == \text{complaint.assignedOfficerId} \implies \text{BLOCKED}$$
2. **Supervisory Review Required:** Resolutions must be independently examined and certified by a supervisor (`WARD_OFFICER`, `DEPARTMENT_HEAD`, or `CITY_ADMIN`).
3. **Dedicated Verification Modal:** Replaces crude browser `prompt()` and `alert()` popups with a formal verification modal requiring:
   * Side-by-side comparison of Citizen Proof vs. Field Mitigation Proof.
   * Mandatory detailed supervisory assessment notes ($\ge 10$ characters).
   * Formal Acceptance or Rejection (reverting case back to `IN_PROGRESS` with remedial instructions).
4. **Super Admin Guard:** Super Admins are restricted from routine operational field approvals to preserve independent governance.

---

## 9. SLA Calculation Engine & Deadline Enforcement

MumbAIR's SLA engine accurately distinguishes between on-ground operational states:

| Status Class | Condition | Compliance Status |
| :--- | :--- | :--- |
| `ON_TRACK` | Case active and current time $< \text{SLA Deadline}$ | `isCompliant: true` |
| `DUE_SOON` | Case active and remaining time $< 25\%$ of benchmark | `isCompliant: true` |
| `BREACHED` | Case active and current time $> \text{SLA Deadline}$ | `isCompliant: false` |
| `PAUSED` | Case placed on justified `ON_HOLD` status | `isCompliant: true` (Clock frozen) |
| `COMPLETED_ON_TIME` | Case resolved at timestamp $\le \text{SLA Deadline}$ | `isCompliant: true` |
| `COMPLETED_LATE` | Case resolved at timestamp $> \text{SLA Deadline}$ | `isCompliant: false` (Strictly recorded as non-compliant) |

---

## 10. Application Security & Injection Hardening

### Context-Safe HTML Escaping (Stored XSS Defense)
All dynamic citizen inputs (complaint titles, descriptions, locations, user names) are sanitized through `UTILS.escapeHtml()`. Characters `&`, `<`, `>`, `"`, `'` are mapped to HTML entities before DOM insertion:
```javascript
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### CSV Formula Injection Protection (CWE-1236 Defense)
Spreadsheet applications (Microsoft Excel, LibreOffice Calc) interpret cells beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` as formulas, posing remote code execution and data exfiltration risks. `UTILS.sanitizeCsvCell` neutralizes these cells by prepending a single quote (`'`):
```javascript
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  var str = String(val).trim();
  var firstChar = str.charAt(0);
  if (['=', '+', '-', '@', '\t', '\r'].indexOf(firstChar) >= 0) {
    str = "'" + str;
  }
  return '"' + str.replace(/"/g, '""') + '"';
}
```

### Excel Devanagari Preservation (UTF-8 BOM)
All generated CSV downloads (`UTILS.downloadCsvBlob`) are prefixed with the UTF-8 Byte Order Mark (`\uFEFF`). This guarantees that Marathi and Hindi ward names (e.g., मानखुर्द, वरळी, अंधेरी) display correctly in Microsoft Excel without character encoding corruption.

### Privacy & Scoped Access
Citizen telephone numbers are masked (`+91 98200 •••••`) in standard municipal views to protect citizen privacy, remaining unmasked only for authorized supervisory officers.

---

## 11. Storage Architecture & Atomic State Transactions

To eliminate lost-write race conditions and data corruption across concurrent events, MumbAIR implements an atomic transaction wrapper:

```javascript
STORAGE.atomicUpdate(function(state) {
  // 1. Receives fresh, uncorrupted state
  // 2. Applies state mutations
  // 3. Appends immutable audit log and notification
  return { success: true };
});
```

* **Versioned Schema (`SCHEMA_VERSION = 4`):** Isolates the upgraded state in `mumbair_state_v4`.
* **Reseeding Bug Fixed:** Checks the `_initialized` flag so that empty collections (`reports: []`) are never accidentally overwritten by default seeds.
* **Storage Corruption Recovery:** Traps JSON parse exceptions, backs up corrupted data, and initializes a clean schema.
* **Multi-Tab Sync:** Listens to `window.storage` events, instantly propagating state updates across open tabs.

---

## 12. Geospatial Map Intelligence & Satellite Layers

The Leaflet-powered geospatial map provides full Greater Mumbai coverage:
1. **Four Permitted Tile Layers:**
   * 🗺️ Detailed Streets (Esri World Street Map)
   * 🛰️ Satellite Imagery (Esri World Imagery)
   * 🎨 Light Canvas (Esri World Light Gray Base)
   * 🌍 OpenStreetMap (Humanitarian OSM HOT)
2. **Accurate Geospatial Markers:**
   * 🏛️ Official CAAQMS Stations: 24 monitoring nodes color-coded by live CPCB category.
   * 🚨 Geotagged Civic Complaints: Rendered at authentic GPS coordinates with category icons (🔥 Burning, 🏗️ Construction, 🏭 Industrial).
   * 🎯 Interactive Location Fly-To: Smooth zoom and pan to any ward or complaint.
3. **Removal of Unsubstantiated Geometry:** Fake, arbitrary dispersion circles and speculative hotspot polygons have been removed in favor of authentic station locations and verified complaint clusters.

---

## 13. Desktop Header Responsiveness & Viewport Compatibility

The desktop navigation header has been engineered to eliminate horizontal overflow across all desktop displays:
* **Root Cause Identified:** `.header-inner` was previously constrained to `max-width: 1360px`, while all child containers had `flex-shrink: 0;`, creating a minimum width of $1386\text{px}$ that pushed the rightmost `"🔒 Authority"` button off-screen at $1280\text{px}$ and $1366\text{px}$.
* **Structural Solution:**
  * `.header-inner` updated to `max-width: 100%`.
  * `.citizen-nav` configured with flexible gaps and responsive link padding.
  * `.header-actions` locked with `flex-shrink: 0; min-width: max-content;`.
* **Verified Viewports:** Tested and confirmed in headless Chromium/Edge with zero overflow and 100% button visibility:
  * $1280\text{px} \times 800\text{px}$
  * $1366\text{px} \times 768\text{px}$
  * $1440\text{px} \times 900\text{px}$
  * $1600\text{px} \times 900\text{px}$
  * $1920\text{px} \times 1080\text{px}$

---

## 14. Adaptive Mobile Experience

Rather than compressing desktop elements, MumbAIR provides a purpose-built mobile layout ($\le 768\text{px}$):
* **Citizen Mobile:**
  * Slim top brand header with Ward selector, theme button, and notifications.
  * Fixed thumb-friendly bottom navigation bar: `📊 Home`, `🗺️ Map`, `📸 Report` (raised floating action button), `📈 Trends`, `👤 Profile`.
  * Minimum touch targets of $44\text{px} \times 44\text{px}$.
  * Form inputs use $16\text{px}$ font size to prevent mobile browser auto-zoom.
* **Authority Mobile:**
  * Fixed bottom command bar: `⚡ Command`, `📥 Inbox`, `🗺️ Map`, `🔍 Inspect`, `☰ More`.
  * Off-canvas mobile navigation drawer.
  * High-contrast field inspection cards for on-ground officers.

---

## 15. Document & Report Studio

Accessible from both Citizen and Authority portals:
* **Citizen Report Dossier:** Official complaint proof receipt with Reference ID, filing timestamp, GPS location, ward code, timeline, and municipal disclaimer.
* **24-Ward Performance Audit:** Compliance percentages, open backlogs, and resolution rates.
* **Department Operations Report:** Workload distribution across SWM, APC, BUILDING, and ROADS.
* **City State of the Air Report:** City-wide atmospheric summary and meteorological correlations.
* **Field Inspection Log:** Checklists and spot-fine notices.
* **Export Options:**
  * 🖨️ Clean print / PDF view with official BMC header and crest.
  * 📥 CSV dataset export protected against spreadsheet injection.

---

## 16. Verified Mumbai News & Environmental Bulletins

Curated, verifiable environmental updates sourced from official bodies:
* **BMC Anti-Smog Gun Mandate:** Deployment of mobile misting cannons under GRAP-II.
* **MPCB Industrial Telemetry Directive:** Automated flare opacity telemetry for Chembur/Trombay refineries.
* **Ward Deep Cleaning Drive:** Mechanized street sweeping using treated STP water.
* **BEST Electric Fleet Milestone:** Addition of zero-emission electric buses on coastal routes.
* **Miyawaki Afforestation:** Native micro-forests planted across suburban flood zones.
* **Features:** Search, Category Filters, Bookmark toggles (saved to `localStorage`), and direct links to official municipal circulars.

---

## 17. Automated Test Suite & Verification Instructions

MumbAIR includes a comprehensive automated test runner verifying all critical mathematical, security, and workflow algorithms.

### Executing the Test Suite
Open your terminal in the project directory and run:
```powershell
cd C:\Users\Nimesh\.gemini\antigravity\scratch\mumbair-prototype
node tests/run-tests.js
```

### Verified Test Coverage (38 Tests Across 7 Suites):
1. **Suite 1: CPCB NAQI Calculation & Scientific Accuracy (8 Tests)**
   * Upper boundary mapping ($30\ \mu\text{g/m}^3 \implies \text{AQI } 50$).
   * Satisfactory range mapping ($31\ \mu\text{g/m}^3 \implies \text{AQI } 51\text{–}53$).
   * Fractional concentration interpolation without premature rounding errors.
   * Carbon Monoxide $\mu\text{g/m}^3 \to \text{mg/m}^3$ unit normalization.
   * CPCB 3-parameter rule enforcement (`isOfficial: false` for $< 3$ pollutants or missing PM).
   * Valid multi-pollutant dataset yielding official CPCB NAQI.
   * Null/empty dataset handling without `NaN` errors.
2. **Suite 2: Security & Input Sanitization (4 Tests)**
   * Stored XSS defense through context-safe HTML escaping.
   * CSV formula injection defense for `=` prefix.
   * CSV formula injection defense for `@` prefix.
   * RFC 4180 quote and comma escaping.
3. **Suite 3: Storage Engine & Atomic State Operations (8 Tests)**
   * Storage initialization with Schema Version 4.
   * `_initialized` flag persistence.
   * Empty collections preserved without reseeding.
   * Atomic mutation persistence.
   * Sequence number incrementation.
   * Transaction rollback on rejection.
4. **Suite 4: Validated Complaint State Machine (4 Tests)**
   * Legal status transitions (`SUBMITTED` $\to$ `UNDER_REVIEW`).
   * Illegal transition rejection (`SUBMITTED` $\to$ `RESOLVED` blocked).
   * Justification enforcement for `ON_HOLD`.
5. **Suite 5: Role-Based Authorization & Scope Boundaries (5 Tests)**
   * Assigned field officer authorization.
   * Unassigned field officer rejection.
   * Field officer blocked from assigning complaints.
   * Ward officer assignment within ward.
   * Cross-ward action blocked.
6. **Suite 6: Separation of Duties & Four-Eyes Verification (4 Tests)**
   * Self-approval by inspecting officer strictly blocked.
   * Independent supervisor verification approved.
   * Audit trail logging of supervisor assessment.
   * Super Admin restricted from field closures.
7. **Suite 7: SLA Calculation & Deadline Accuracy (5 Tests)**
   * Active case within deadline marked `ON_TRACK` (`isCompliant: true`).
   * Active case exceeding deadline marked `BREACHED` (`isCompliant: false`).
   * Case resolved before deadline marked `COMPLETED_ON_TIME`.
   * Late resolution strictly marked `COMPLETED_LATE` (`isCompliant: false`).
   * Case on hold pauses SLA clock.

---

## 18. Project File Inventory

```
mumbair-prototype/
├── index.html                   # Master application document (Citizen & Authority shells)
├── serve.js                     # Zero-dependency local Node.js HTTP server
├── start.bat                    # One-click Windows launch script
├── README.md                    # Complete project engineering documentation
├── tests/
│   └── run-tests.js             # Comprehensive 7-suite automated test runner
├── css/
│   ├── base.css                 # Design tokens, typography, CSS resets, CPCB AQI colors
│   ├── theme.css                # 6-theme appearance engine & dark mode tokens
│   ├── layout.css               # Header, citizen grid, navigation, and desktop viewport
│   ├── mobile.css               # Purpose-built adaptive mobile styling & bottom navigation
│   ├── components.css           # Buttons, modals, form inputs, status badges, and cards
│   ├── dashboard.css            # AQI hero gauge card, weather tiles, and pollutant grid
│   ├── map.css                  # Leaflet canvas sizing, custom HTML pins, and popups
│   ├── reports.css              # Reporting wizard, timelines, and Report Studio print styles
│   └── operations.css           # Municipal Authority V2 command bar, sidebar, and modals
├── js/
│   ├── config.js                # 24 Mumbai administrative wards, CPCB breakpoints, roles, lifecycle
│   ├── utils.js                 # CPCB NAQI math, Haversine formula, XSS escaping, CSV sanitization
│   ├── storage.js               # Atomic transaction engine, Schema v4, multi-tab synchronization
│   ├── api.js                   # Open-Meteo & Copernicus CAMS atmospheric API client
│   ├── auth.js                  # Citizen session & Municipal role-based authentication manager
│   ├── workflow.js              # State machine transitions, four-eyes review, SLA calculations
│   ├── theme.js                 # Citizen appearance customizer & theme switcher
│   ├── map.js                   # Leaflet map controller, multi-basemap layers, station markers
│   ├── charts.js                # Chart.js time-series curves and ward comparative bar charts
│   ├── insights.js              # Deterministic environmental intelligence rules
│   ├── reports.js               # Citizen complaint wizard, duplicate detection, and upvoting
│   ├── report-studio.js         # Report Studio document generation, PDF layout, and CSV exports
│   ├── civic-bulletin.js        # Verified Mumbai news, MPCB directives, and BMC schemes
│   ├── solutions.js             # Air Quality Action Center & municipal mitigation progress tracker
│   ├── notifications.js         # Scoped in-app alerts and advisory drawer
│   ├── ai-assistant.js          # Local environmental health assistant
│   ├── operations.js            # Operations Command V2 controller (18 operational modules)
│   └── app.js                   # Application coordinator, hash routing, and tab lifecycles
├── data/
│   └── mumbai-wards.json        # GeoJSON metadata for 24 administrative wards
├── supabase/
│   └── schema.sql               # Production PostgreSQL schema, foreign keys, and RLS policies
└── vendor/
    ├── leaflet/                 # Leaflet 1.9.4 offline library & marker assets
    └── chartjs/                 # Chart.js 4.4.1 offline UMD bundle
```

---

## 19. Local Setup & Startup Guide

### Prerequisites
* Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
* Optional: Node.js (v16+) for running the test suite or built-in HTTP server.

### Option A: Using Built-in Node.js Server (Recommended)
1. Open PowerShell or Command Prompt:
   ```powershell
   cd C:\Users\Nimesh\.gemini\antigravity\scratch\mumbair-prototype
   ```
2. Start the local HTTP server:
   ```powershell
   node serve.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Option B: Direct File Execution
Double-click `index.html` or open `file:///C:/Users/Nimesh/.../index.html` directly in your browser. All vendor libraries (Leaflet, Chart.js) and Esri tile layers operate with zero CORS and zero referrer restrictions.

---

## 20. System Limitations & Operational Transparency

1. **Demonstration Mode:** Municipal authority authentication runs in client-side evaluation mode with authenticated demo personas. For production multi-tenant deployments, connect to Supabase Auth or municipal OAuth identity providers.
2. **Measurement vs. Model Simulation:** Real-time AQI values are ingested via Open-Meteo's Copernicus CAMS European atmospheric reanalysis grid ($\sim 11\text{ km}$ resolution). They represent calibrated atmospheric simulations and are clearly labeled as such to distinguish them from direct physical CAAQMS station inlets.
3. **Offline Map Tiles:** Vector coastline geometry renders offline. Detailed satellite and street tiles require internet connectivity to reach the Esri ArcGIS servers.

---

<div align="center">
  <p><strong>MumbAIR — Greater Mumbai Environmental Intelligence Platform</strong></p>
  <p><em>Engineered for data accuracy, operational security, and municipal transparency across Greater Mumbai.</em></p>
  <p>MIT License &middot; Brihanmumbai Municipal Corporation (BMC / MCGM)</p>
</div>
