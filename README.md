# SKYCAST — Intelligent Weather Monitoring & AWS Multi-Instance Cloud Platform

<p align="center">
  <img src="static/images/logo.svg" alt="SKYCAST Logo" width="100" height="100">
</p>

<h3 align="center">Weather Intelligence, Reimagined.</h3>

<p align="center">
  A production-style, high-availability meteorological intelligence dashboard architected for AWS Multi-EC2 deployment behind an Application Load Balancer and Auto Scaling Group, featuring zero-key Open-Meteo telemetry ingestion.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+">
  <img src="https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask 3.0+">
  <img src="https://img.shields.io/badge/AWS-EC2%20%7C%20ALB%20%7C%20ASG-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS Cloud">
  <img src="https://img.shields.io/badge/UI-Glassmorphism%20CSS3-7C3AED?style=for-the-badge" alt="Glassmorphism">
  <img src="https://img.shields.io/badge/License-MIT-06B6D4?style=for-the-badge" alt="License">
</p>

---

## ⚡ Super-Easy Windows Execution (Beginner Friendly)

You do **NOT** need Node.js.  
You do **NOT** need npm.  
You do **NOT** need Docker.  
You do **NOT** need AWS credentials or paid API keys.  

### How to Run:
1. **Double-click `START.bat`** in the project folder.
2. The script will automatically:
   - Check your Python installation.
   - Set up an isolated virtual environment (`.venv`).
   - Install required packages (`requirements.txt`).
   - Start the Flask server on port 5000.
   - Automatically open **`http://localhost:5000`** in your default web browser!
3. To safely stop the server anytime, simply **double-click `STOP.bat`**.

---

## 🌟 Key Features

### 1. Modern Glassmorphic SaaS Interface
- **Midnight Navy, Deep Indigo, Electric Violet & Cyan** curated color palette.
- Translucent backdrop blur cards, subtle borders, and micro-interactions.
- Fully responsive across desktop, tablet, and mobile browsers.

### 2. Meteorological Telemetry Array
- **Main Weather Hero**: City name, country, coordinates, real-time temperature, condition title, description, and dynamic animated weather artwork (sun, clouds, rain, lightning).
- **8 Core Metrics**:
  1. **Relative Humidity (%)**: With dew point comfort notes.
  2. **Wind Velocity (km/h)**: With Beaufort Scale classification.
  3. **Wind Direction (Degrees & Cardinal)**: With a dynamic 360° rotating compass needle.
  4. **Barometric Pressure (hPa)**: High/Low pressure system indicator.
  5. **Visibility (km)**: Atmospheric line-of-sight rating.
  6. **UV Solar Index (0-11+)**: Color-coded sun radiation safety level.
  7. **Cloud Coverage (%)**: Overhead cloud density progress track.
  8. **Dew Point (°C)**: Thermal moisture index.

### 3. Predictive Weather Horizons
- **24-Hour Hourly Slider**: Interactive horizontal card carousel with temperatures, rain probabilities, and wind speeds.
- **7-Day Extended Matrix**: Daily outlook with weather icons, rain percentages, and high/low temperature gradient bars.
- **Solar Trajectory Arc**: Dynamic SVG arc tracking dawn, sunrise, solar noon, sunset, and twilight with real-time sun elevation plotting.

### 4. Rule-Based Smart Weather Insights
Automated intelligence suggestions generated from real-time Open-Meteo telemetry:
- ☔ **Precipitation Alert**: Notifies users when rain probability exceeds 30-50% and recommends carrying an umbrella.
- ☀️ **UV Radiation Notice**: Warns of elevated UV index (>= 6) and recommends SPF 50+ sunscreen and polarized sunglasses.
- 🌡️ **Thermal Comfort Advisory**: Highlights high heat index or chilly conditions with clothing and hydration recommendations.
- 💨 **Wind Safety**: Warns against two-wheeler travel during gusty conditions (> 35 km/h).

### 5. Multi-Variable Chart.js Analytics
- 24-Hour Temperature Trajectory Curve.
- Relative Humidity (%) Profile.
- Wind Velocity Vector (km/h).
- Precipitation Probability Density (%).

### 6. AWS Multi-EC2 Cloud Infrastructure Tab
- **Visual Interactive Topography**: Live diagrammatic flow representing User ➔ ALB ➔ Target Group ➔ Multi-AZ EC2 Instances ➔ Cloud Services.
- **Live IMDSv2 Metadata Inspector**: Inspects verified Instance ID, Availability Zone, Region, and Hostname via EC2 IMDSv2 token protocol with authentic Local Development fallback.
- **ALB Round-Robin Simulator**: Click to simulate real-time traffic balancing between Node 1 (`ap-south-1a`) and Node 2 (`ap-south-1b`).
- **CloudWatch Telemetry Monitor**: Tracks simulated/real latency, cluster CPU utilization, and health ratio.

### 7. Search History & Audit Trail
- Logs search queries with timestamp, city, country, temperature, and weather condition.
- One-click **Reload** button to re-inspect any historical city.
- Clear audit log functionality.
- Seamless fallback between Amazon DynamoDB and local JSON storage.

---

## ☁️ AWS Cloud Architecture

```
                      INTERNET / CLIENTS
                              │
                              ▼
                 APPLICATION LOAD BALANCER (ALB)
                   (Public Subnet ap-south-1a/b)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        TARGET GROUP (Port 80)      TARGET GROUP (Port 80)
      Health Check: /api/health   Health Check: /api/health
                │                           │
                ▼                           ▼
      EC2 INSTANCE 1 (Node A)      EC2 INSTANCE 2 (Node B)
       Zone: ap-south-1a            Zone: ap-south-1b
       Nginx ──► Gunicorn ──► Flask Nginx ──► Gunicorn ──► Flask
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
             OUTBOUND: Open-Meteo REST API
             STORAGE: Amazon DynamoDB (Optional)
             MONITORING: Amazon CloudWatch
```

---

## 📁 Project Directory Structure

```
SKYCAST/
│
├── app.py                      # Flask Application Controller & API Endpoints
├── config.py                   # Configuration, IMDSv2 Detection, WMO Codes
├── requirements.txt            # Python Production Dependencies
├── requirements-dev.txt        # Development & Testing Dependencies
├── README.md                   # Complete Project Overview & Guide
├── START.bat                   # 1-Click Automated Windows Startup
├── STOP.bat                    # 1-Click Server Termination
├── .env.example                # Example Environment Variables
├── .gitignore                  # Git Ignore Rules
│
├── templates/
│   └── index.html              # Main Single-Page SaaS Dashboard
│
├── static/
│   ├── css/
│   │   └── style.css           # Master Glassmorphic Stylesheet
│   ├── js/
│   │   └── app.js              # Client Engine, Charts & Telemetry
│   └── images/
│       └── logo.svg            # Skycast Vector Branding
│
├── aws/
│   ├── ec2-setup.sh            # User Data Provisioning Shell Script
│   ├── nginx.conf              # Nginx Reverse Proxy Configuration
│   ├── skycast.service         # Systemd WSGI Service Unit
│   ├── deployment-guide.md     # Step-by-Step AWS Deployment & Teardown
│   └── architecture.md         # Cloud Architecture Documentation
│
├── docs/
│   ├── project-report.md       # Comprehensive 20-Section Academic Report
│   ├── abstract.md             # Academic Abstract & Summary
│   ├── viva-questions.md       # 32 Viva Voce Questions & Answers
│   ├── testing.md              # Test Matrix & Verification Log
│   └── screenshots.md          # Visual Tour & Component Walkthrough
│
├── tests/
│   └── test_app.py             # Automated Unit & Integration Tests
│
└── data/
    └── search_history.json     # Local Search History Storage
```

---

## 🧪 Running Automated Tests

Run the included test suite to verify all endpoints, error handling, and IMDSv2 fallback:

```bash
python -m unittest discover tests/ -v
```

---

## ⚠️ AWS Cost Warning & Resource Cleanup

> [!WARNING]
> While services like EC2 `t3.micro` are Free Tier eligible, **Application Load Balancers (ALB)**, **Public IPv4 address allocations**, and custom CloudWatch metrics may incur hourly charges.
>
> **Always run the teardown commands in `aws/deployment-guide.md` after your college viva presentation to avoid unwanted AWS bills.**

---

## 🎓 Academic Presentation Notes

- **Viva Voce Defense Questions**: Refer to [docs/viva-questions.md](docs/viva-questions.md) for 32 detailed questions and answers across Cloud Computing, Operating Systems, Networking, and Full-Stack Engineering.
- **Comprehensive Project Report**: Refer to [docs/project-report.md](docs/project-report.md) for the complete 20-section report including DFDs, sequence diagrams, and mathematical models.
