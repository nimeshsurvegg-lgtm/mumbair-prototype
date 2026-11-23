<div align="center">

# 🌬️ MumbAIR
### *Greater Mumbai Air Quality Intelligence & Municipal Operations Platform*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Build%20ES6+-brightgreen.svg)](#3-technology-stack)
[![AQI Standard](https://img.shields.io/badge/AQI%20Standard-CPCB%20NAQI-orange.svg)](#4-official-cpcb-national-aqi-naqi-calculation-engine)
[![Tests](https://img.shields.io/badge/Automated%20Tests-38%20Passing-success.svg)](#17-automated-test-suite--verification-instructions)

> **"Observe → Understand → Report → Assign → Investigate → Act → Verify → Improve"**  
> *Unified Environmental Surveillance & Municipal Governance Suite for the 24 Administrative Wards of Greater Mumbai (Brihanmumbai Municipal Corporation — BMC / MCGM)*

</div>

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
- **Nocturnal Coastal Temperature Inversions:** Low-altitude trapping of pollutants during winter months.
- **Heavy Redevelopment & Demolition:** Coarse dust ($\text{PM}_{10}$) from over 1,500 active infrastructure and high-rise construction sites.
- **Refinery & Chemical Corridors:** Elevated sulphur dioxide ($\text{SO}_2$) and hydrocarbon flares in Chembur, Mahul, and Trombay (Ward M/E).
- **Legacy Landfill Smoldering:** Subsurface methane combustion generating particulate smoke at Deonar and Mulund dumping grounds.
- **Arterial Traffic Congestion:** Nitrogen dioxide ($\text{NO}_2$) and fine particulates ($\text{PM}_{2.5}$) along the Western and Eastern Express Highways.

MumbAIR connects public atmospheric awareness with verifiable municipal accountability. It gives citizens an honest, transparent view of the air they breathe while providing municipal officers with an auditable, four-eyes verified operations management platform.

---

## 2. Ecosystem Architecture

MumbAIR is partitioned into two distinct operational portals sharing a single synchronized state engine:

### 🧑‍💼 Public Citizen Portal
- **Real-Time AQI Hero Dashboard:** Apple Weather-inspired card with dynamic SVG arc gauge, official CPCB categorizations (0–500+ scale), and dominant pollutant detection ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$).
- **Surface Weather Telemetry:** Ambient temperature, relative humidity, wind velocity, and onshore Arabian Sea breeze direction ($290^\circ$ Westerly).
- **6-Parameter Pollutant Breakdown:** Concentrations benchmarked against CPCB 24-hour National Ambient Air Quality Standards (NAAQS) with explicit CAMS model grid attribution.
- **Interactive Map:** Leaflet-powered multi-basemap (Streets, Satellite, Light Canvas, OSM HOT) with 24 administrative ward pins, real CAAQMS stations, and geotagged community complaints.
- **Civic Reporting Wizard:** 3-step complaint filing with 1.5 km Haversine duplicate collision prevention, automated ward routing, and photo watermarking.
- **Complaint Tracking Feed:** Public endorsement upvoting, category filtering, and transparent 16-step lifecycle progression.
- **Environmental Bulletin & Schemes:** Curated, verifiable updates from MCGM, MPCB, and CPCB with official circular links.
- **Solutions Center:** Evidence-based citizen health guidance and municipal mitigation progress tracking.
- **Appearance Customizer:** 6 professionally designed themes preserving immutable CPCB AQI severity colors.
- **Report Studio:** One-click citizen complaint receipts with printable PDF formatting and CSV download.

### 🏛️ Municipal Operations Portal (`#authority`)
- **Role-Based Authentication:** Authenticated access restricted to verified municipal demo personas (`FIELD_OFFICER`, `WARD_OFFICER`, `DEPARTMENT_HEAD`, `CITY_ADMIN`, `SUPER_ADMIN`).
- **Command Center:** Real-time caseload KPIs (Active Caseload, In Field Investigation, SLA Breached, Certified Resolution Rate), Operational Attention triage panel, and Ward Operations Ledger.
- **Complaint Inbox:** Central registry with multi-column filtering, priority overrides, and role-scoped CSV export.
- **1-Click Dispatch & Assignment:** Assigns available field officers based on live workload, sets mandatory SLA resolution benchmarks (6h, 24h, 48h, 72h), and attaches supervisor directives.
- **Field Inspection Engine:** Mobile-optimized checklist execution for on-ground officers, optical opacity checks, spot-fine notice triggers (MMC Act Section 368), and mitigation evidence submission.
- **Separation of Duties (Four-Eyes Verification):** Dedicated verification modal blocking self-approvals by inspecting officers and requiring independent supervisory review notes.
- **24 Administrative Wards & Departments Matrix:** Detailed workload and compliance scorecards across SWM, APC, BUILDING, ROADS, DRAINAGE, and HEALTH.
- **Resource & Fleet Management:** Real-time tracking of anti-smog misting cannons, mobile CAAQMS vans, and mechanized sweepers.
- **Ops AI Assistant:** Deterministic calculation queries for operational bottlenecks, recidivism clusters, and executive briefings.
- **Audit Trail Ledger:** Immutable, append-only log of all triage, dispatch, inspection, and verification actions.

---

## 3. Technology Stack

- **Frontend Architecture:** Vanilla JavaScript (ES6+), HTML5, CSS3. Zero-build architecture; runs directly in any modern browser without compilers or bundlers.
- **Mapping Engine:** [Leaflet 1.9.4](https://leafletjs.com/) (bundled locally in `/vendor/leaflet/` for offline resilience).
- **Basemap Tile Providers:**
  - Esri World Street Map (`server.arcgisonline.com`)
  - Esri World Imagery Satellite (`server.arcgisonline.com`)
  - Esri World Light Gray Canvas (`server.arcgisonline.com`)
  - OpenStreetMap Humanitarian (`tile.openstreetmap.fr/hot`)
- **Data Visualization:** [Chart.js 4.4.1](https://www.chartjs.org/) (bundled locally in `/vendor/chartjs/`).
- **Atmospheric Data Gateway:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) & Copernicus Atmosphere Monitoring Service (CAMS).
- **Weather Telemetry Gateway:** Open-Meteo Weather Forecast API (ECMWF high-resolution model).
- **State & Persistence:** Browser `localStorage` with reactive multi-dashboard synchronization (`mumbair_state_v4`, `mumbair_auth_session_v4`, `mumbair_theme_preference`).
- **Database Schema (Production Ready):** PostgreSQL schema with Row-Level Security (RLS) located in `/supabase/schema.sql`.

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
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **$\text{PM}_{2.5}$** ($\mu\text{g/m}^3$) | 0 – 30 | 31 – 60 | 61 – 90 | 91 – 120 | 121 – 250 | 251 – 500 |
| **$\text{PM}_{10}$** ($\mu\text{g/m}^3$) | 0 – 50 | 51 – 100 | 101 – 250 | 251 – 350 | 351 – 430 | 431 – 600 |
| **$\text{NO}_2$** ($\mu\text{g/m}^3$) | 0 – 40 | 41 – 80 | 81 – 180 | 181 – 280 | 281 – 400 | 401 – 500 |
| **$\text{SO}_2$** ($\mu\text{g/m}^3$) | 0 – 40 | 41 – 80 | 81 – 380 | 381 – 800 | 801 – 1600 | 1601 – 2000 |
| **$\text{CO}$** ($\text{mg/m}^3$) | 0 – 1.0 | 1.1 – 2.0 | 2.1 – 10.0 | 10.1 – 17.0 | 17.1 – 34.0 | 34.1 – 50.0 |
| **$\text{O}_3$** ($\mu\text{g/m}^3$) | 0 – 50 | 51 – 100 | 101 – 168 | 169 – 208 | 209 – 748 | 749 – 1000 |
| **$\text{NH}_3$** ($\mu\text{g/m}^3$) | 0 – 200 | 201 – 400 | 401 – 800 | 801 – 1200 | 1201 – 1800 | 1801 – 2500 |

### Critical Engineering Safeguards
1. **CO Unit Normalization:** Open-Meteo returns carbon monoxide in $\mu\text{g/m}^3$ (e.g., $1300\ \mu\text{g/m}^3$). CPCB breakpoints strictly evaluate CO in $\text{mg/m}^3$ ($1.3\ \text{mg/m}^3$). `UTILS.calcSubIndex` automatically detects values $> 50$ and divides by $1000$, eliminating massive artificial distortions.
2. **CPCB 3-Parameter Mandate:** Under CPCB rules, an official AQI requires a minimum of **three measured parameters**, of which **at least one must be a particulate parameter** ($\text{PM}_{2.5}$ or $\text{PM}_{10}$). Datasets failing this test are flagged as `isOfficial: false` and rendered with an *"Indicative Only"* disclaimer.
3. **No Fabricated Multipliers:** Eliminates arbitrary scaling factors (such as `currPm25 * 2.1`).

---

## 5. Atmospheric Telemetry & Source Transparency

MumbAIR ensures honest and transparent data sourcing:
- **Copernicus CAMS Model Grid:** Real-time pollutant readings are fetched from Open-Meteo's Copernicus Atmosphere Monitoring Service (CAMS) European atmospheric reanalysis grid ($\sim 11\text{ km}$ resolution). The UI clearly labels: `"Values from Copernicus CAMS model grid (~11km)"`.
- **Station Baseline Distinctions:** Physical CAAQMS station coordinates (e.g., Mahul Petrochemical CAAQMS, Bandra Kurla Complex CAAQMS) are distinguished from model grid estimates.
- **Offline Calibrated Fallback:** When internet access is disconnected, the system loads calibrated station baseline records and explicitly notifies the user: `"Simulated baseline (offline cache)"`.
- **Coordinate-Specific Caching:** Telemetry cache keys are tied to exact geographic coordinates (`lat_lng`), preventing cross-ward data contamination when switching between locations.

---

## 6. Validated 16-State Complaint Lifecycle

Civic complaints transition through a centralized, strictly validated state machine defined in `CONFIG.STATUS_LIFECYCLE`:

```text
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
