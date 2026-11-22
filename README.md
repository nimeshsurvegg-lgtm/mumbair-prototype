<div align="center">
  <h1>🌬️ MumbAIR</h1>
  <h3><em>Smart City Environmental Intelligence &amp; Municipal Operations Platform for Greater Mumbai</em></h3>
  <p><strong>"Observe → Understand → Report → Assign → Investigate → Act → Verify → Improve"</strong></p>
  <p><em>Official Civic Technology &amp; Municipal Operations Suite for the 24 Administrative Wards of Greater Mumbai</em></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Modular-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Open--Meteo-Live%20Atmospheric%20API-0D9488?logo=air-purifier&logoColor=white" alt="Open-Meteo">
  <img src="https://img.shields.io/badge/Leaflet-1.9.4-16A34A?logo=leaflet&logoColor=white" alt="Leaflet">
  <img src="https://img.shields.io/badge/Chart.js-4.4.1-FF6384?logo=chartdotjs&logoColor=white" alt="Chart.js">
  <img src="https://img.shields.io/badge/Supabase-Enterprise%20Postgres-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
</p>

---

## 📖 Table of Contents
- [Executive Overview](#-executive-overview)
- [Clean Information Architecture](#-clean-information-architecture)
- [Public Citizen Portal (Primary Product)](#-public-citizen-portal-primary-product)
- [Protected Municipal Authority Workspace](#-protected-municipal-authority-workspace)
- [The Geospatial Intelligence Map](#-the-geospatial-intelligence-map)
- [Environmental Methodology & CPCB NAQI Calculation](#-environmental-methodology--cpcb-naqi-calculation)
- [Complaint Lifecycle & SLA Engine](#-complaint-lifecycle--sla-engine)
- [Smart Duplicate Report Detection](#-smart-duplicate-report-detection)
- [System Architecture & File Organization](#-system-architecture--file-organization)
- [Enterprise Supabase PostgreSQL Schema](#-enterprise-supabase-postgresql-schema)
- [Installation & How to Run](#-installation--how-to-run)
- [Evaluator & Demo Persona Quick Testing](#-evaluator--demo-persona-quick-testing)
- [Attribution & License](#-attribution--license)

---

## 🌟 Executive Overview

**MumbAIR** is a dedicated environmental intelligence and municipal operations platform purpose-built for the residents and municipal administration of Greater Mumbai (Brihanmumbai Municipal Corporation — BMC / MCGM).

The application bridges two distinct worlds with purpose-crafted interfaces:
1. **The Public Citizen Portal:** An Apple Weather-inspired, light-mode consumer environmental application prioritizing real-time AQI clarity, geospatial discovery, 24-ward monitoring, and frictionless civic reporting.
2. **The Municipal Operations Command Center:** A strictly separated, role-protected municipal operations workspace where field officers, ward executive officers, department heads, and city administrators investigate, triage, and resolve citizen complaints with verifiable proof.

---

## 🧭 Clean Information Architecture

The application strictly avoids overwhelming users with cluttered dashboards. The public citizen experience features a compact top navigation bar with **6 core tabs**:

1. **📊 Home:**
   - Apple Weather-style Hero AQI card with animated semi-circular SVG arc gauge.
   - Dynamic CPCB National Air Quality Index calculation with calibrated needle cursor.
   - Dominant pollutant indicator (`PM2.5` / `PM10`) and Graded Response Action Plan (`GRAP Stage II`) status.
   - Plain-language health interpretation and sensitive group advisories.
   - Compact 6-parameter pollutant strip ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$) benchmarked against CPCB 24-hour limits.
   - Coastal marine dispersion weather corridor analyzing Arabian Sea onshore breeze vectors.
   - Quick action shortcuts to the interactive map, violation reporting, and 24h trends.

2. **🧪 Air Quality:**
   - 24 Greater Mumbai Administrative Wards Directory (Island City, Western Suburbs, Eastern Suburbs).
   - Real-time station benchmarks, local emission vectors, and instant text filtering.
   - Interactive side-by-side ward comparator with dynamic Chart.js comparative bars.

3. **🗺️ Explore Map:**
   - Full-height (620px) Leaflet interactive map centered on Greater Mumbai (`19.0760° N, 72.8777° E`).
   - Open-source OpenStreetMap standard tiles with Esri World Light Gray fallback (100% free, zero API key required).
   - Automatic container resize invalidation (`MAP.invalidateSize()`) on tab display.
   - High-contrast custom HTML pins displaying Ward Code and live AQI value.
   - Layer toggles: `24 Wards / Stations`, `Dispersion Footprints`, and `Civic Reports`.
   - Real-time search to zoom and inspect any ward or CAAQMS station.
   - "Locate Me" button with browser GPS and automatic closest ward detection.
   - Floating CPCB air quality scale legend.

4. **📈 Trends:**
   - 24-hour and 48-hour particulate curves ($\text{PM}_{2.5}$ and $\text{PM}_{10}$) powered by live Copernicus CAMS and ECMWF model ingestion.
   - Deterministic environmental intelligence cards analyzing atmospheric trends and temperature inversion hazards.

5. **📸 Pollution Reports:**
   - **File a Report Wizard:** 4-step mobile-first reporting flow with category selection, automated administrative ward routing, 1.5 km Haversine duplicate warning, and cryptographic photo watermarking (GPS coordinates, Ward Code, and IST timestamp).
   - **Track Civic Complaints:** Filterable community stream with citizen upvoting / endorsement and an interactive 9-step resolution timeline.

6. **🔔 Alerts:**
   - Active Graded Response Action Plan (GRAP Stage II) protocol directives.
   - Coastal nocturnal inversion warnings.
   - Deterministic localized AI Environmental Assistant for health and outdoor activity queries.

---

## 🔒 Protected Municipal Authority Workspace

Municipal operations are **strictly separated** from the citizen portal and accessed via the protected entry point:
* **Authority Login:** `#authority` (or clicking the "Municipal Authority" button in the top header).
* **Authority Command Workspace:** Accessible only upon successful authentication.

### Role-Based Access Hierarchy:
* **⚡ Field Operations Officer (`FIELD_OFFICER`):**
  - Mobile-first inspection queue with SLA clocks (`On Track`, `Due Soon`, `SLA Breached`).
  - Automated field protocol checklist generated by category.
  - Action taken submission with before/after mitigation verification.
* **🏛️ Ward Executive Officer (`WARD_OFFICER`):**
  - Ward desk overview for the assigned ward (e.g., Ward M/E Chembur).
  - Unassigned complaints triage with officer dispatch workflow.
  - Workload balancing and public ward advisory broadcasting.
* **🏢 Department Head (`DEPARTMENT_HEAD`):**
  - Multi-ward departmental queue (Solid Waste Management, Air Pollution Control, Roads, Building Regulation).
  - Inter-ward SLA compliance analytics and overdue escalation monitor.
* **🌆 City Operations Administrator (`CITY_ADMIN`):**
  - Greater Mumbai 24-ward compliance matrix.
  - City-wide pollution hotspots and public transparency benchmarks.
* **🔒 Super Administrator (`SUPER_ADMIN`):**
  - Immutable security and operational audit trail ledger.
  - Role management and system configuration.

---

## 🗺️ The Geospatial Intelligence Map

The Leaflet map engine is designed with zero display glitches:
* **Explicit Container Dimensions:** Guaranteed 620px height with responsive resizing for mobile viewports.
* **Automatic Layout Invalidation:** Explicitly calls `map.invalidateSize()` whenever the Map tab becomes visible or the browser window is resized.
* **Smart Marker Popups:** Rich cards displaying station metadata, live AQI, category color, primary emission sources, and quick action links.
* **Real Geolocation:** Browser GPS integration with Haversine distance calculations to pinpoint the user's nearest administrative ward.

---

## 🧪 Environmental Methodology & CPCB NAQI Calculation

MumbAIR strictly adheres to the official **Central Pollution Control Board (CPCB)** National Air Quality Index linear interpolation formula:

$$I_p = \frac{I_{HI} - I_{LO}}{B_{HI} - B_{LO}} \times (C_p - B_{LO}) + I_{LO}$$

Where:
* $C_p$ is the pollutant concentration.
* $B_{HI}$ and $B_{LO}$ are the breakpoint concentrations greater and smaller than $C_p$.
* $I_{HI}$ and $I_{LO}$ are the corresponding sub-index values.
* The overall $\text{AQI} = \max(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, \dots)$ with the dominant pollutant explicitly surfaced.

### Indian National AQI Breakpoints:
| Category | AQI Range | Color Token | Health Statement |
| :--- | :---: | :---: | :--- |
| **Good** | 0 – 50 | `#16A34A` | Minimal health impact. |
| **Satisfactory** | 51 – 100 | `#65A30D` | Minor breathing discomfort to sensitive people. |
| **Moderate** | 101 – 200 | `#CA8A04` | Breathing discomfort to people with lung disease/asthma. |
| **Poor** | 201 – 300 | `#EA580C` | Breathing discomfort to most people on prolonged exposure. |
| **Very Poor** | 301 – 400 | `#DC2626` | Respiratory illness on prolonged exposure. |
| **Severe** | 401 – 500+ | `#7F1D1D` | Affects healthy people and seriously impacts sensitive groups. |

---

## 🔍 Smart Duplicate Report Detection

Before a citizen submits a complaint, MumbAIR performs a spatial proximity query using the **Haversine formula**:

$$d = 2R \arcsin\left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

If an active complaint exists within **1.5 kilometers** under the same category, MumbAIR triggers an alert banner prompting the citizen to **Endorse Existing Report (+1 Upvote)** to escalate municipal priority, or proceed with a separate specific ticket.

---

## 🏗️ System Architecture & File Organization

```
mumbair-prototype/
├── index.html                 # Single Page Application host with clean citizen & authority portals
├── css/
│   ├── base.css               # Design tokens, typography, CPCB color palette & reset
│   ├── layout.css             # Topbar navigation, citizen layout, authority layout, breakpoints
│   ├── components.css         # Buttons, modals, badges, location selector drawer, toasts
│   ├── dashboard.css          # Apple Weather AQI hero, circular arc gauge, pollutant strip
│   ├── map.css                # Leaflet sizing, custom ward pins, legend, search bar
│   ├── reports.css            # Reporting wizard, canvas photo watermarking, complaint timeline
│   └── operations.css         # Municipal authority command centers, SLA tags, tables
├── js/
│   ├── config.js              # Roles, demo accounts, departments, SLA policies, 24 wards
│   ├── utils.js               # Haversine distance, CPCB sub-index math, time formatters
│   ├── storage.js             # LocalStorage abstraction, state persistence, voter fingerprinting
│   ├── api.js                 # Open-Meteo client, 15m TTL caching, offline fallback
│   ├── auth.js                # Citizen guest vs registered mode & protected authority session
│   ├── workflow.js            # 9-state complaint state machine, SLA clocks, audit logger
│   ├── notifications.js       # In-app notification dispatcher with unread counters
│   ├── ai-assistant.js        # Deterministic local AI intelligence (Citizen & Municipal)
│   ├── map.js                 # Leaflet interactive map, custom HTML markers, popups, search
│   ├── charts.js              # Chart.js time-series curves, ward comparisons
│   ├── insights.js            # Environmental intelligence & health advisories
│   ├── reports.js             # Civic reporting wizard, duplicate detection, watermarking
│   ├── operations.js          # Municipal authority command centers & officer workflows
│   └── app.js                 # Master controller, tab router, portal switcher, event bus
├── data/
│   └── mumbai-wards.json      # Structured municipal ward geospatial metadata (24 wards)
├── supabase/
│   └── schema.sql             # Enterprise PostgreSQL schema, 18 tables, RLS policies & triggers
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── README.md
```

---

## 🗄️ Enterprise Supabase PostgreSQL Schema

The [`supabase/schema.sql`](file:///C:/Users/Nimesh/.gemini/antigravity/scratch/mumbair-prototype/supabase/schema.sql) file provides a production-grade PostgreSQL relational backend:
- **18 Tables:** `profiles`, `roles`, `zones`, `wards`, `departments`, `complaints`, `complaint_evidence`, `complaint_votes`, `complaint_status_history`, `field_inspections`, `resolution_verifications`, `notifications`, `announcements`, `audit_logs`.
- **Row Level Security (RLS):** Strict public read vs authenticated officer write rules.
- **Audit Trigger:** Automated status progression tracking, upvote increments, and tamper-evident audit logging.

---

## 💻 Installation & How to Run

### Zero Build Dependencies — Double-Click to Launch
No Node.js, npm, Webpack, or build step is required. The application executes directly in modern web browsers:

```bash
# 1. Clone the repository
git clone https://github.com/nimeshsurvegg-lgtm/mumbair-prototype.git
cd mumbair-prototype

# 2. Open index.html directly in your web browser
# On Windows:
start index.html

# On macOS:
open index.html

# On Linux:
xdg-open index.html
```

---

## 🎯 Evaluator & Demo Persona Quick Testing

For presentations, hackathon evaluations, and reviewer grading, the **Municipal Authority Login** screen (`#authority` or clicking `"Municipal Authority"` in the header) includes a **One-Click Evaluator Persona Switcher**:

* ⚡ **Field Officer:** Logs in as Inspector *Sanjay Shinde* (SWM, Ward M/E). Test the field queue, AI checklist, and resolution evidence submission.
* 🏛️ **Ward Officer:** Logs in as *Dr. Priya Kamble* (Ward M/E Executive). Test unassigned complaint triage and officer dispatching.
* 🏢 **Dept Head:** Logs in as *Vikram Deshmukh* (Air Pollution Control). Test inter-ward SLA compliance and escalation monitoring.
* 🌆 **City Admin:** Logs in as *Municipal Commissioner Operations*. Test city-wide 24-ward matrix and CSV export.
* 🔒 **Super Admin:** Logs in as *Root System Administrator*. Test immutable audit logs and security permissions.

---

## 📜 Attribution & License

* **Atmospheric Data:** [Open-Meteo](https://open-meteo.com/) (Licensed under CC BY 4.0 / Copernicus CAMS & ECMWF).
* **Map Data:** &copy; [OpenStreetMap](https://www.openstreetmap.org/) contributors, &copy; Esri. Zero API key required.
* **Typography:** Archivo, IBM Plex Sans, IBM Plex Mono (SIL Open Font License).
* **Software License:** Distributed under the **MIT License**. See [LICENSE](file:///C:/Users/Nimesh/.gemini/antigravity/scratch/mumbair-prototype/LICENSE) for details.
