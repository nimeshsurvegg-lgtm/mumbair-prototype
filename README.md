<div align="center">
  <h1>🌬️ MumbAIR</h1>
  <h3><em>Air quality tracking & civic action for Greater Mumbai</em></h3>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
</p>

> **Overview:** MumbAIR is an interactive web-based prototype designed to monitor air pollution. It features a live Air Quality Index (AQI) heatmap and a ticketing system for citizens to report environmental violations.

---

## 📖 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation & Usage](#-installation--usage)
- [Technical Architecture](#-technical-architecture)
- [License](#-license)

---

## 🚀 Features

* **Flexible Authentication:** Users can log in using a mobile number with a 6-digit OTP, or bypass login by continuing in Guest Mode[cite: 3].
* **Live AQI Heatmap:** Features a color-coded ward map displaying real-time air quality bands ranging from "Good" to "Severe"[cite: 3].
* **Location Detection:** Automatically detects the user's nearest ward using Geolocation, or allows manual ward searches[cite: 3].
* **Civic Ticketing System:** Citizens can report issues such as open garbage burning, heavy industrial smoke, uncovered construction dust, and missing LED sensors[cite: 3].
* **Smart Duplicate Checking:** Before filing, the system surfaces existing nearby reports in the user's ward, allowing them to upvote an existing ticket instead of creating a duplicate[cite: 3].
* **Timeline Tracking:** Users can track the status of tickets as they progress from "Ticket Raised" to "Action Taken" and "Closed Safe"[cite: 3].

---

## ⚙️ Prerequisites

This is a frontend-only web application. All you need is a modern web browser (Google Chrome, Mozilla Firefox, Safari, or Edge).

---

## 💻 Installation & Usage

1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/nimeshsurvegg-lgtm/mumbair.git](https://github.com/nimeshsurvegg-lgtm/mumbair.git)
   cd mumbair
2. Open the application:
Simply double-click the index.html file to open it in your default web browser. No local server or build step is required!

Usage Notes:

Demo OTP: You can enter any 6-digit code during the login phase to proceed[cite: 3].

Guest Mode: Guest mode allows browsing of AQI data and existing tickets, but a verified mobile number is required to file new reports[cite: 3].

## 🧠 Technical Architecture
Frontend: Vanilla HTML5, CSS3, and JavaScript.

Design: Custom CSS variables for theming, CSS Grid/Flexbox for layout, and integrated Google Fonts (Archivo, IBM Plex Sans, IBM Plex Mono)[cite: 3].

No Dependencies: The prototype runs entirely entirely in the browser without the need for external libraries like React or Vue.

## 📜 License
Distributed under the MIT License. See LICENSE for more information.
