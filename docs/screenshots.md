# SKYCAST — Visual Tour & UI Component Walkthrough

This document showcases the user interface, design system, responsive layouts, and interactive modules of the **SKYCAST** platform.

---

## 1. Visual Design Architecture

SKYCAST implements a bespoke dark-mode design system with deep midnight navy, electric violet, and cyan highlights:

| Component | Theme Token / Style | Purpose |
| :--- | :--- | :--- |
| **Primary Background** | `#060911` / Radial Gradient | Deep space atmospheric backdrop |
| **Card Surface** | `rgba(15, 23, 42, 0.68)` | Translucent glassmorphism |
| **Backdrop Filter** | `blur(16px)` | Frosted glass optical depth |
| **Primary Accents** | `#7C3AED` (Violet), `#06B6D4` (Cyan) | SaaS analytical high-contrast cues |
| **Status Dot** | `#10B981` (Green Pulse) | Real-time live data stream indicator |

---

## 2. Dashboard Sections & Component Breakdown

### A. Navigation Sidebar
- **Branding**: Stylized cloud and lightning vector logo with glowing drop shadow.
- **Navigation Tabs**:
  - `Overview`: Hero card, 8-point sensor array, rule-based insights, sunrise/sunset arc.
  - `Weather Forecast`: 24-hour horizontal card slider + 7-day extended forecast matrix.
  - `Analytics`: 4 interactive Chart.js graphs.
  - `AWS Infrastructure`: Topography flow, live IMDSv2 inspector, CloudWatch panel.
  - `Search History`: Historical query audit log with quick reload actions.
  - `About Project`: Academic presentation summary and viva preparation links.
- **Sidebar Footer**: Displays live host node status (`AWS EC2 ACTIVE` or `LOCAL DEV MODE`) with verified Instance ID and Availability Zone.

---

### B. Top Header
- **Personalized Greeting**: Dynamic greeting updated by time of day (Morning, Afternoon, Evening, Night).
- **Live Digital Clock**: Monospaced HH:MM:SS AM/PM clock ticking in real time.
- **City Search Bar**: Pill-shaped input with instant submission on Enter key or button click.
- **Popular City Shortcuts**: Quick pills for `Bengaluru`, `Mumbai`, `Delhi`, `Chennai`, `Hyderabad`, `London`, `Tokyo`, `New York`.
- **Temperature Unit Switcher**: Instant `°C` / `°F` toggle without page reloads.
- **Refresh Action**: One-click refresh button with smooth 360° spinning animation.
- **AWS ALB Status Pill**: Real-time target group status indication.

---

### C. Main Weather Hero Card
- **Location Badge**: City name, country tag, geographical coordinates (Latitude & Longitude), and live status indicator.
- **Thermal Display**: 5.5rem bold gradient typography displaying the current temperature with unit symbol.
- **Condition Information**: Clear WMO condition title and descriptive meteorological statement.
- **Animated Weather Illustration**: CSS-animated sun glow, floating cumulus clouds, and dynamic weather elements.
- **Sub-Metric Pills**: Feels-like temperature, Daily High/Low thermal span, Wind velocity, and Relative humidity.

---

### D. 8 Core Meteorological Metric Cards
1. **Relative Humidity**: Gauge bar with atmospheric comfort rating.
2. **Wind Velocity**: Gauge bar with Beaufort scale tag (e.g. "Gentle Breeze").
3. **Wind Direction**: 360° interactive compass with rotating needle and cardinal orientation (N, NE, SE, etc.).
4. **Barometric Pressure**: Pressure track calibrated to sea-level atmospheric standards.
5. **Visibility**: Atmospheric clarity indicator (10+ km line of sight).
6. **UV Solar Index**: Color-coded severity badge (Low, Moderate, High, Extreme).
7. **Cloud Coverage**: Cloud density percentage track.
8. **Dew Point**: Thermal moisture saturation index with comfort interpretation.

---

### E. Predictive Weather Horizons
- **24-Hour Hourly Slider**: Smooth horizontal scroll container displaying hourly times, weather icons, temperatures, precipitation odds, and wind speeds.
- **Hourly Interactive Chart**: Dual-axis line and bar chart displaying thermal trajectory and rain odds over the next 24 hours.
- **7-Day Extended Forecast**: Daily forecast rows featuring day name, date, WMO weather icon, condition description, rain probability, daily min/max temperature gradient bar, and UV tag.

---

### F. Solar Trajectory & Twilight Arc
- Visual SVG arc tracking the sun's trajectory from sunrise to sunset.
- Calculates total daylight minutes and positions the glowing sun marker at the current daytime percentage.
- Displays exact sunrise and sunset times.

---

### G. AWS Infrastructure Visualizer
- **Topography Diagram**: Interactive multi-tier map displaying:
  $$\text{End Users} \longrightarrow \text{AWS ALB} \longrightarrow \text{Target Group} \longrightarrow \text{EC2 Node 1 \& Node 2} \longrightarrow \text{DynamoDB \& CloudWatch}$$
- **Simulate ALB Request Routing Button**: Interactively simulates Layer 7 round-robin distribution between Node 1 and Node 2, updating active borders, pulse rings, and latency telemetry in real-time.
- **Live IMDSv2 Metadata Table**: Displays Instance Identifier, Placement Zone & Region, Hardware Instance Type, Private Subnet IPv4, Public IPv4, and OS Kernel.
- **CloudWatch Panel**: Displays ALB response latency (ms), cluster CPU utilization (%), and target health ratio.

---

### H. Search History & Audit Trail
- Formatted table logging search query history with timestamps, city, country, temperature, and condition.
- One-click **Reload** button to re-fetch any past search.
- **Clear Audit Log** button to purge search history.
