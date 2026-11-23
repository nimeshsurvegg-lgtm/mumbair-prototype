# 🌬️ MumbAIR
### *Greater Mumbai Air Quality Intelligence & Civic Action Platform*
> **"Observe → Understand → Report → Assign → Investigate → Act → Verify → Improve"**
> *Unified Environmental Surveillance & Municipal Operations Suite for the 24 Administrative Wards of Greater Mumbai (Brihanmumbai Municipal Corporation — BMC / MCGM)*

---

## 📖 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Ecosystem Capabilities (Citizen vs. Authority)](#2-ecosystem-capabilities)
3. [Technology Stack](#3-technology-stack)
4. [Application Architecture & Data Flow](#4-application-architecture--data-flow)
5. [Project Structure & File Inventory](#5-project-structure--file-inventory)
6. [Local Setup & Startup Instructions](#6-local-setup--startup-instructions)
7. [API Configuration & Data Ingestion](#7-api-configuration--data-ingestion)
8. [Authentication & Session Governance](#8-authentication--session-governance)
9. [Municipal Operations & SLA Workflow Engine](#9-municipal-operations--sla-workflow-engine)
10. [Geospatial Map Intelligence & Satellite Layers](#10-geospatial-map-intelligence--satellite-layers)
11. [Appearance & Theme Customization System](#11-appearance--theme-customization-system)
12. [Adaptive Mobile Experience (360px – 768px)](#12-adaptive-mobile-experience)
13. [Document & Report Studio (PDF / CSV Exports)](#13-document--report-studio)
14. [Verified Mumbai News & Environmental Bulletins](#14-verified-mumbai-news--environmental-bulletins)
15. [BMC Schemes & Municipal Initiatives](#15-bmc-schemes--municipal-initiatives)
16. [Air Quality Actions & Solutions Center](#16-air-quality-actions--solutions-center)
17. [Indian National AQI (CPCB) Methodology](#17-indian-national-aqi-cpcb-methodology)
18. [Security & Role-Based Access Control (RBAC)](#18-security--role-based-access-control-rbac)
19. [Deployment Guide](#19-deployment-guide)
20. [System Limitations & Operational Transparency](#20-system-limitations--operational-transparency)

---

## 1. Project Overview

**MumbAIR** is a dedicated environmental intelligence and municipal operations platform purpose-built for the citizens and municipal authorities of Greater Mumbai. 

Greater Mumbai faces unique micro-climatic atmospheric dynamics: nocturnal coastal temperature inversions, intense arterial traffic congestion, heavy redevelopment demolition dust, refinery flare corridors (Chembur/Mahul), and legacy landfill smoldering (Deonar). 

MumbAIR bridges the gap between public atmospheric awareness and municipal enforcement by connecting:
* **Citizens:** Real-time CPCB National AQI, weather context, interactive geospatial map, verified BMC bulletins, practical actions, theme customization, and rapid photo-verified civic reporting.
* **Municipal Administration (MCGM):** A role-scoped Operations Command workspace where field officers, ward executive officers, department heads, and city administrators triage, dispatch, inspect, mitigate, and certify environmental complaints under mandatory SLA timeframes.

---

## 2. Ecosystem Capabilities

### 🧑‍💼 Public Citizen Portal
* **Real-Time AQI Hero Dashboard:** Apple Weather-inspired card with dynamic SVG arc gauge, CPCB categorization (0–500+ scale), and dominant pollutant detection ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$).
* **Surface Weather Context:** Ambient temperature, relative humidity, wind velocity, and onshore Arabian Sea breeze direction ($290^\circ$ Westerly).
* **6-Parameter Pollutant Breakdown:** Real-time concentrations of $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, and $\text{O}_3$ benchmarked against CPCB 24-hour National Ambient Air Quality Standards (NAAQS).
* **Interactive Map:** Esri World Street, Esri Satellite, Light Canvas, and OSM HOT basemaps with 24 ward pins, citizen complaint pins, and industrial inversion hazard zones.
* **Civic Reporting Wizard:** 3-step complaint filing with 1.5 km Haversine duplicate detection, automated ward routing, and photo watermarking (GPS + timestamp).
* **Complaint Tracking Feed:** Public endorsement upvoting, category filtering, and 9-step lifecycle progression timeline.
* **Environmental Bulletin & Schemes:** Curated, verifiable updates from MCGM, MPCB, and CPCB; bookmarking and official circular links.
* **Solutions Center:** Actionable citizen health recommendations (N95 mask standards) and municipal progress tracking.
* **Appearance Customizer:** 6 professionally designed themes with immutable CPCB AQI severity colors.
* **Report Studio:** One-click citizen complaint receipts with printable PDF formatting and CSV download.

### 🏛️ Municipal Operations Portal (`#authority`)
* **Role-Based Authentication:** Protected login with pre-configured Evaluator Quick Switcher for instant testing across 5 personas.
* **Command Center:** Real-time caseload KPIs (Active Caseload, In Field, SLA Breached, Resolution Rate), Operational Attention triage panel, and 24-Ward Operations Ledger.
* **Complaint Inbox:** Central registry with multi-column filtering, bulk assignment, priority overrides, and CSV export.
* **1-Click Dispatch & Assignment:** Assigns available field officers based on live workload, sets mandatory SLA resolution benchmarks (6h, 24h, 48h, 72h), and attaches supervisor directives.
* **Field Inspection Engine:** Mobile-optimized checklist execution for on-ground officers, optical opacity checks, spot-fine notice triggers (MMC Act Section 368), and mitigation evidence submission.
* **Supervisor Resolution Verification:** Side-by-side photographic evidence comparison (Citizen Proof vs. Field Mitigation Proof) with 1-click certification or rejection.
* **24 Administrative Wards & Departments Matrix:** Detailed workload and compliance scorecards across SWM, APC, BUILDING, ROADS, DRAINAGE, and HEALTH.
* **Resource & Fleet Management:** Real-time tracking of anti-smog misting cannons, mobile CAAQMS vans, and mechanized sweepers.
* **Ops AI Assistant:** Deterministic calculation queries for operational bottlenecks, recidivism clusters, and executive briefings.
* **Audit Trail Ledger:** Immutable, append-only log of all triage, dispatch, inspection, and verification actions.

---

## 3. Technology Stack

* **Frontend Framework:** Vanilla Modern JavaScript (ES6+), HTML5, CSS3. Modular, zero-build architecture; runs directly in modern browsers or local HTTP servers.
* **Mapping Engine:** [Leaflet 1.9.4](https://leafletjs.com/) (bundled locally in `/vendor/leaflet/` for offline resilience).
* **Basemap Tile Providers:**
  * Esri World Street Map (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}`)
  * Esri World Imagery Satellite (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`)
  * Esri World Gray Canvas (`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`)
  * OpenStreetMap Humanitarian (`https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png`)
* **Data Visualization:** [Chart.js 4.4.1](https://www.chartjs.org/) (bundled locally in `/vendor/chartjs/`).
* **Atmospheric Data Gateway:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) & Copernicus Atmosphere Monitoring Service (CAMS).
* **Weather Telemetry Gateway:** Open-Meteo Weather Forecast API (ECMWF high-resolution model).
* **State & Persistence:** Browser `localStorage` with reactive multi-dashboard synchronization (`mumbair_state_v3`, `mumbair_auth_session_v3`, `mumbair_theme_preference`).
* **Database Schema (Production Ready):** PostgreSQL schema with Row-Level Security (RLS) located in `/supabase/schema.sql`.

---

## 4. Application Architecture & Data Flow

```
[ Citizen Report Filed ] ───► [ Haversine Duplicate Check ] ───► [ Storage State (mumbair_state_v3) ]
                                                                        │
    ┌───────────────────────────────────────────────────────────────────┼───────────────────────────┐
    ▼                                                                   ▼                           ▼
[ Citizen Tracker Feed ]                                    [ Ward Officer Triage ]     [ City Admin Ledger ]
    │                                                                   │                           │
    │                                                       [ 1-Click Dispatch ]                    │
    │                                                                   │                           │
    │                                                       [ Assigned to Field Officer ]           │
    │                                                                   │                           │
    │                                                       [ Field Checklist & Photo ]             │
    │                                                                   │                           │
    │                                                       [ Resolution Submitted ]                │
    │                                                                   │                           │
    │                                                       [ Supervisor Sign-Off ]                 │
    │                                                                   │                           │
[ Status: RESOLVED ] ◄──────────────────────────────────────────────────┴───────────────────────────┘
```

---

## 5. Project Structure & File Inventory

```
mumbair-prototype/
├── index.html                   # Master application document (Citizen & Municipal Authority shells)
├── serve.js                     # Zero-dependency local Node.js HTTP server
├── start.bat                    # One-click Windows launch script
├── README.md                    # Complete project documentation
├── css/
│   ├── base.css                 # Design tokens, typography, CSS resets, AQI semantic colors
│   ├── theme.css                # 6-theme appearance engine & dark mode tokens
│   ├── layout.css               # Header, citizen grid, sticky navigation, and desktop viewport
│   ├── mobile.css               # Purpose-built adaptive mobile styling & bottom navigation
│   ├── components.css           # Buttons, modals, form inputs, status badges, and cards
│   ├── dashboard.css            # AQI hero gauge card, weather tiles, and pollutant grid
│   ├── map.css                  # Leaflet canvas sizing, custom HTML pins, popups, and layer toggles
│   ├── reports.css              # Reporting wizard, timelines, and Report Studio print stylesheet
│   └── operations.css           # Municipal Authority V2 command bar, sidebar, KPI cards, and modals
├── js/
│   ├── config.js                # 24 Mumbai administrative wards, CPCB breakpoints, and role metadata
│   ├── utils.js                 # Haversine distance, CPCB sub-index formulas, date/time formatters
│   ├── storage.js               # Seed database: 14 interconnected complaints, 13 officers, 8 fleet units
│   ├── api.js                   # Open-Meteo & Copernicus CAMS atmospheric API client
│   ├── auth.js                  # Citizen session & Municipal role-based authentication manager
│   ├── workflow.js              # State-machine transition methods, SLA calculations, audit trail
│   ├── theme.js                 # Citizen appearance customizer & theme switcher
│   ├── map.js                   # Leaflet map controller, multi-basemap layers, and hotspot polygons
│   ├── charts.js                # Chart.js time-series curves and ward comparative bar charts
│   ├── insights.js              # Deterministic environmental intelligence rules
│   ├── reports.js               # Citizen complaint wizard, duplicate detection, and upvoting
│   ├── report-studio.js         # Report Studio document generation, PDF print layout, and CSV exports
│   ├── civic-bulletin.js        # Verified Mumbai news, MPCB directives, and BMC schemes
│   ├── solutions.js             # Air Quality Action Center & municipal mitigation progress tracker
│   ├── notifications.js         # Unified in-app alerts and advisory drawer
│   ├── ai-assistant.js          # Local environmental health assistant
│   ├── operations.js            # Operations Command V2 controller (18 operational modules)
│   └── app.js                   # Application coordinator, hash routing, and tab lifecycles
├── data/
│   └── mumbai-wards.json        # GeoJSON metadata for 24 administrative wards
├── supabase/
│   └── schema.sql               # Production PostgreSQL schema, tables, foreign keys, and RLS policies
└── vendor/
    ├── leaflet/                 # Leaflet 1.9.4 offline library & marker assets
    └── chartjs/                 # Chart.js 4.4.1 offline UMD bundle
```

---

## 6. Local Setup & Startup Instructions

### Prerequisites
* Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
* Optional: Node.js (v16+) for the built-in zero-dependency local server.

### Option A: Using Built-in Node.js Server (Recommended)
1. Open your terminal in the project directory:
   ```powershell
   cd C:\Users\Nimesh\.gemini\antigravity\scratch\mumbair-prototype
   ```
2. Start the lightweight HTTP server:
   ```powershell
   node serve.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Option B: Direct File Execution
Double-click `index.html` or open `file:///C:/Users/Nimesh/.../index.html` in any browser. All vendor libraries (Leaflet, Chart.js) and Esri tile layers are designed with zero referer blocks and zero CORS restrictions.

---

## 7. API Configuration & Data Ingestion

MumbAIR uses free, public, and open atmospheric APIs requiring **zero API keys** and **no environment secrets**:

| Endpoint | Provider | Parameters | Refresh Rate |
| :--- | :--- | :--- | :--- |
| `https://air-quality-api.open-meteo.com/v1/air-quality` | Open-Meteo / Copernicus CAMS | `pm10, pm2_5, carbon_monoxide, nitrogen_dioxide, sulphur_dioxide, ozone` | Every 10 mins |
| `https://api.open-meteo.com/v1/forecast` | Open-Meteo / ECMWF | `temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m` | Every 10 mins |

### Fallback Architecture
If the client machine is offline or internet connectivity is disrupted, MumbAIR automatically falls back to calibrated station baseline records seeded in `js/config.js` to ensure the application remains functional.

---

## 8. Authentication & Session Governance

### 1. Citizen Portal
* **Guest Mode:** Enabled by default. Citizens can browse real-time AQI, explore the map, read news, review solutions, and customize themes without logging in.
* **Citizen Profile:** Citizens can save their name, contact details, and pinned home ward for complaint tracking.

### 2. Municipal Authority Portal (`#authority`)
Protected access with 5 pre-configured personas for demonstration and evaluation:

| Persona | Name | Role Key | Scope |
| :--- | :--- | :--- | :--- |
| **Field Officer** | Sanjay Shinde | `FIELD_OFFICER` | Ward M/E, Solid Waste Management |
| **Ward Officer** | Dr. Priya Kamble | `WARD_OFFICER` | Ward M/E, All Departments |
| **Department Head** | Vikram Deshmukh | `DEPARTMENT_HEAD` | City-wide, Air Pollution Control |
| **City Administrator** | Commissioner Ops | `CITY_ADMIN` | All 24 Wards, All Departments |
| **Super Admin** | Root System Admin | `SUPER_ADMIN` | System-wide Security & Governance |

---

## 9. Municipal Operations & SLA Workflow Engine

Complaints transition through a strict, auditable state machine:

$$\text{SUBMITTED} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{ASSIGNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLUTION\_SUBMITTED} \longrightarrow \text{RESOLVED} \longrightarrow \text{CLOSED}$$

### SLA Benchmark Timelines
* **URGENT (Refinery Sulfur / Open Garbage Burning):** 6-Hour Resolution Target.
* **HIGH (Active Construction Dust / Landfill Smoldering):** 24-Hour Resolution Target.
* **MEDIUM (Idling Heavy Vehicles / Road Silt):** 48-Hour Resolution Target.
* **LOW (General Environmental Inquiries):** 72-Hour Resolution Target.

---

## 10. Geospatial Map Intelligence & Satellite Layers

The central interactive map features:
1. **Four Permitted Basemap Styles:**
   * 🗺️ Detailed Streets (Esri World Street Map)
   * 🛰️ Satellite Imagery (Esri World Imagery + Labels)
   * 🎨 Light Canvas (Esri Light Gray Base)
   * 🌍 OpenStreetMap (Humanitarian OSM HOT)
2. **Layer Overlays:**
   * 🏛️ 24 Official CAAQMS Monitoring Nodes (Color-coded by live CPCB category).
   * 🚨 Citizen Violation Reports (Categorized icons: 🔥 Burning, 🏗️ Construction, 🏭 Industrial).
   * 🔥 Industrial Inversion Risk Hotspots (Chembur, Mahul, Deonar, BKC, Kurla).
   * 🌐 Atmospheric Dispersion Footprint Rings.
3. **Controls:**
   * Instant Search & Fly-To animation.
   * ⛶ Native HTML5 Fullscreen mode.
   * 🎯 GPS User Geolocation with nearest ward calculation.
   * 🔄 Greater Mumbai view reset.

---

## 11. Appearance & Theme Customization System

Citizens can customize their visual experience via the **🎨 Appearance** button. The current Antigravity design remains the **DEFAULT**:

1. **Mumbai Original (Default):** Antigravity palette (Brand teal `#0D9488`, off-white canvas `#F8FAFC`, slate typography `#0F172A`).
2. **Coastal Breeze:** Marine azure (`#0284C7`), sky cyan, fresh ocean mist surfaces.
3. **Forest & Earth:** Botanical foliage green (`#15803D`), eco sage, warm earthy cards.
4. **Sunset Mumbai:** Warm coral (`#EA580C`), golden amber, Marine Drive twilight tones.
5. **Midnight Air:** OLED high-contrast dark mode (`#090D16`), low-glare card surfaces, neon cyan telemetry.
6. **Minimal Monochrome:** Editorial zinc and charcoal grayscale palette with stark high-contrast typography.

> **Life-Safety Mandate:** CPCB AQI severity colors (`Good #10B981`, `Satisfactory #84CC16`, `Moderate #F59E0B`, `Poor #F97316`, `Very Poor #EF4444`, `Severe #991B1B`) remain **identical across all themes** to preserve universal environmental health meaning.

---

## 12. Adaptive Mobile Experience

Rather than shrinking the desktop layout, MumbAIR provides a purpose-built mobile interface:
* **Citizen Mobile Layout ($\le 768\text{px}$):**
  * Slim top header (Brand + Ward selector + Theme button + Bell + Lock).
  * Fixed bottom navigation bar with 5 thumb-friendly items: `📊 Home`, `🗺️ Map`, `📸 Report` (raised circular action button), `📈 Trends`, and `👤 Profile`.
  * Touch targets are a minimum of $44\text{px} \times 44\text{px}$.
  * Minimum input font size of $15\text{px}$ prevents mobile auto-zoom.
* **Municipal Authority Mobile Layout ($\le 768\text{px}$):**
  * Fixed bottom bar: `⚡ Command`, `📥 Inbox`, `🗺️ Map`, `🔍 Inspect`, `☰ More`.
  * Mobile off-canvas drawer replaces the desktop sidebar.
  * Field inspection view optimized for on-ground officers with one-tap protocol checklists.

---

## 13. Document & Report Studio

Accessible from both the Citizen portal and Municipal Authority portal:
* **Citizen Report Dossier:** Official complaint proof receipt with Ref ID, filing timestamp, GPS location, ward code, timeline, and municipal disclaimer.
* **24-Ward Performance Audit:** Compliance percentages, open backlogs, and resolution rates.
* **Department Operations Report:** Workload distribution across SWM, APC, BDR, and RTI.
* **City State of the Air Report:** City-wide atmospheric summary and meteorological correlations.
* **Field Inspection Log:** Checklists and spot-fine notices.
* **Export Options:**
  * 🖨️ Clean print / PDF view with official BMC header, crest, and metadata tables.
  * 📥 CSV dataset export for spreadsheet analysis.

---

## 14. Verified Mumbai News & Environmental Bulletins

Curated, verifiable environmental updates sourced from official bodies:
* **BMC Anti-Smog Gun Mandate:** Deployment of mobile misting cannons under GRAP-II.
* **MPCB Industrial Telemetry Directive:** Automated flare opacity telemetry for Chembur/Trombay refineries.
* **Ward Deep Cleaning Drive:** Mechanized street sweeping using treated STP water.
* **BEST Electric Fleet Milestone:** Addition of zero-emission electric buses on coastal routes.
* **Miyawaki Afforestation:** Native micro-forests planted across suburban flood zones.
* **Features:** Search, Category Filters, Bookmark toggles (saved to `localStorage`), and direct links to official municipal portals.

---

## 15. BMC Schemes & Municipal Initiatives

Dedicated section explaining active environmental programs:
1. **BMC Deep Cleaning Drive:** Mechanical washing of 1,200 km of road corridors with recycled water.
2. **GRAP-II 35-Point Guidelines:** 35-foot perimeter barricades and misting cannons for construction sites $> 5,000\text{ m}^2$.
3. **Mumbai Climate Action Plan (MCAP 2050):** Decarbonization roadmap across mobility, energy, and waste.
4. **Hyper-Local IoT CAAQMS Sensor Densification:** 300+ calibrated sensors deployed across civic schools and dispensaries.

---

## 16. Air Quality Actions & Solutions Center

* **Citizen Health Guidance:** Evidence-based personal mitigation measures (N95 mask recommendations during Poor/Very Poor AQI, transit choices).
* **Municipal Progress Tracker:** Real-time completion progress across key municipal mitigation initiatives.

---

## 17. Indian National AQI (CPCB) Methodology

MumbAIR implements the official **Central Pollution Control Board (CPCB)** sub-index formula:

$$I_p = \left[ \frac{I_{\text{HI}} - I_{\text{LO}}}{B_{\text{HI}} - B_{\text{LO}}} \right] \cdot (C_p - B_{\text{LO}}) + I_{\text{LO}}$$

The overall AQI is governed by the **maximum sub-index** among measured pollutants:

$$\text{AQI} = \max(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{SO2}}, I_{\text{CO}}, I_{\text{O3}})$$

| AQI Range | Category | Color Code | Health Impact Descriptor |
| :--- | :--- | :--- | :--- |
| **0 – 50** | Good | `#10B981` | Minimal impact; clean air. |
| **51 – 100** | Satisfactory | `#84CC16` | Minor breathing discomfort to sensitive people. |
| **101 – 200** | Moderate | `#F59E0B` | Breathing discomfort to people with lungs/asthma/heart disease. |
| **201 – 300** | Poor | `#F97316` | Breathing discomfort to most people on prolonged outdoor exposure. |
| **301 – 400** | Very Poor | `#EF4444` | Respiratory illness on prolonged exposure; outdoor activity discouraged. |
| **401 – 500+** | Severe | `#991B1B` | Severe respiratory impact on healthy people; serious risk to sensitive groups. |

---

## 18. Security & Role-Based Access Control (RBAC)

* **Role Permissions Matrix:**
  * `FIELD_OFFICER`: View assigned queue, execute field checklists, submit photographic mitigation proof.
  * `WARD_OFFICER`: Triage ward complaints, dispatch inspectors, certify/reject resolutions, publish ward advisories.
  * `DEPARTMENT_HEAD`: Departmental caseload allocation, inter-ward routing, fleet management.
  * `CITY_ADMIN`: City-wide command, 24-ward compliance matrix, decision intelligence.
  * `SUPER_ADMIN`: Security governance, RBAC matrix inspection, node diagnostics.
* **Input Sanitization:** All citizen inputs are HTML-escaped using `UTILS.escapeHtml()` to protect against cross-site scripting (XSS).
* **Audit Trail:** Every status transition logs an immutable audit entry with actor, role, and timestamp.

---

## 19. Deployment Guide

### Static Hosting (GitHub Pages / Netlify / Vercel)
MumbAIR requires no compile step:
1. Push the repository to GitHub.
2. In your repository settings, enable **GitHub Pages** from the `main` branch root.
3. Your platform will be accessible immediately with full offline caching and Leaflet tile support.

### Backend PostgreSQL Integration (Supabase)
To connect a live PostgreSQL database:
1. Create a Supabase project.
2. Run the SQL statements in [`supabase/schema.sql`](file:///C:/Users/Nimesh/.gemini/antigravity/scratch/mumbair-prototype/supabase/schema.sql).
3. The schema includes all necessary tables (`profiles`, `complaints`, `inspections`, `audit_logs`, `advisories`, `resources`) with Row-Level Security (RLS) policies enabled.

---

## 20. System Limitations & Operational Transparency

1. **Demonstration Mode:** Municipal authority authentication currently runs in evaluation mode using client-side session state for evaluation and presentation. Connect to Supabase Auth for production deployment.
2. **Measurement vs. Model Simulation:** Real-time AQI values are ingested via Open-Meteo's Copernicus CAMS European atmospheric reanalysis grid ($\sim 11\text{ km}$ resolution). They represent calibrated atmospheric simulations and are clearly labeled as such to distinguish them from direct physical CAAQMS station inlets.
3. **Offline Map Tiles:** Vector coastline geometry renders offline. Detailed satellite and street tiles require internet connectivity to reach the Esri ArcGIS servers.

---

<div align="center">
  <p><strong>MumbAIR — Greater Mumbai Environmental Intelligence Platform</strong></p>
  <p><em>Built with dedication to open environmental transparency across Maharashtra.</em></p>
  <p>MIT License &middot; Brihanmumbai Municipal Corporation (BMC / MCGM)</p>
</div>
