# MumbAIR 🌫️📲
**Air quality tracking & civic action for Greater Mumbai.**

MumbAIR is a mobile-first web application prototype designed to democratize air quality monitoring and empower citizens to take civic action. The platform provides localized Air Quality Index (AQI) tracking for various municipal wards across Mumbai, coupled with a robust community-driven incident reporting system for environmental violations.

## 🌟 Key Features

* **Authentication & Onboarding**
    * Mobile number login with simulated OTP verification.
    * "Guest Mode" for users who just want to browse live AQI and BMC ticket data without filing reports.
* **Intelligent Localization**
    * Automatic geolocation to detect the user's current ward.
    * Manual search integration covering key Mumbai wards (e.g., Andheri, Bandra, Colaba).
* **Real-Time AQI Dashboard**
    * Live AQI tracking with dynamic categorization (Good, Moderate, Sensitive, Unhealthy, Severe).
    * Interactive ward grid map visually displaying localized pollution levels.
    * Automated Health Alerts: Modal warnings trigger when AQI crosses 200, advising users to wear N95 masks.
    * Live wind condition ribbon and GRAP (Graded Response Action Plan) stage indicators.
* **Civic Action & Reporting Engine**
    * Multi-category reporting for violations: Missing LEDs, Open garbage burning, Industrial smoke, and Construction dust.
    * **Smart Duplicate Check:** Before filing, users are shown existing nearby reports to upvote instead of duplicating tickets.
    * Simulated geotagging and timestamp verification for photo evidence.
* **Ticket Tracking System**
    * Detailed timeline views for raised tickets.
    * Status tracking phases: Ticket Raised, Sent to Ward Desk, In Progress, Action Taken, and Closed Safe.

## 🛠️ Tech Stack

MumbAIR is built as a lightweight, zero-dependency, single-file prototype. 

* **Frontend Structure:** HTML5
* **Styling:** Vanilla CSS (CSS Variables, Flexbox, CSS Grid, Custom Animations)
* **Logic & State Management:** Vanilla JavaScript
* **Typography:** Google Fonts (Archivo, IBM Plex Sans, IBM Plex Mono)

## 🚀 Getting Started

Since this is a client-side only prototype, there is no complex build process or backend setup required.

### Prerequisites
* A modern web browser (Chrome, Firefox, Safari, Edge).

### Installation & Execution
1.  Clone the repository:
    ```bash
    git clone [https://github.com/yourusername/mumbair.git](https://github.com/yourusername/mumbair.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd mumbair
    ```
3.  Open the file directly in your browser:
    ```bash
    # On macOS
    open mumbair_final_gemini.html
    
    # On Linux
    xdg-open mumbair_final_gemini.html
    
    # On Windows
    start mumbair_final_gemini.html
    ```

## 📱 Usage Guide (Demo Mode)

1.  **Login:** Enter any valid 10-digit number and input any 6 digits for the OTP to pass the mock authentication. Alternatively, select "Continue as Guest".
2.  **Set Location:** Use the auto-detect feature (requires browser location permissions) or type a ward name (e.g., "Kandivali" or "G/S") into the search bar.
3.  **Navigate:** Use the bottom navigation bar to switch between the "Home" (Heatmap), "Tickets", and "Report" panels.
4.  **File a Report:** Navigate to the "Report" tab, pass the smart duplicate check, select an issue category, simulate capturing evidence, and submit the ticket. 


This project is licensed under the MIT License - see the `LICENSE` file for details.
