# MumbAIR — Interactive Prototype

An interactive web prototype (v5) focused on air pollution tracking and civic action for Greater Mumbai.

## 🌟 Features

* **User Authentication:** Users can log in using a 10-digit mobile number and a 6-digit OTP, or browse in a restricted "Guest" mode. Guest mode restricts the ability to file citizen reports.

* **Location Tracking:** Users can automatically detect their location using the Geolocation API or manually search and select a specific Mumbai ward (e.g., Andheri).

* **Live AQI Dashboard:** Features a map grid and a hero card displaying real-time Air Quality Index (AQI) values, severity bands (Good, Moderate, Unhealthy, Severe), and probable pollution causes like construction dust or landfill smoke.

* **Health Advisories:** Displays active GRAP (Graded Response Action Plan) stages and triggers a modal warning advising users to wear an N95 mask and avoid exertion if the AQI exceeds 200.

* **Environmental Simulation:** Includes an animated "wind ribbon" that visually indicates sea breeze or stalled wind conditions. The application uses a mock API and tick loop to simulate live AQI fluctuations and automatically drafts or escalates tickets for sustained high pollution levels.

* **Civic Ticketing System:** Users can view active and closed municipal tickets and track their status timeline from "Ticket Raised" to "Closed Safe".

* **Smart Citizen Reporting:** A 3-step reporting flow allows verified users to log pollution violations with simulated geotagged photo evidence. It includes a smart duplicate check to display nearby active reports, allowing users to upvote existing issues rather than creating duplicates.


## 🛠️ Technical Implementation

* The prototype is built entirely as a single-file application using HTML, CSS, and plain JavaScript.
* It utilizes Google Fonts for its typography, specifically Archivo, IBM Plex Sans, and IBM Plex Mono.

## 🚀 How to Run

Because the project relies on mock data and simulated API fetching, the application runs locally in a web browser without requiring a backend server. Simply open the HTML file in any modern mobile or desktop browser to test the prototype.

LINK : https://nimeshsurvegg-lgtm.github.io/mumbair-prototype/
