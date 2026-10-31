# SKYCAST — Academic Abstract & Executive Summary

## Project Title
**SKYCAST: Intelligent Weather Monitoring & AWS Multi-Instance Cloud Platform**

---

## Abstract

Accurate and instantaneous meteorological intelligence is paramount for modern aviation, urban logistics, agricultural planning, and disaster preparedness. However, conventional weather monitoring websites often present cluttered interfaces, slow loading times, and single-point-of-failure monolithic architectures that falter during extreme weather events when user traffic surges exponentially.

**SKYCAST** resolves these challenges by introducing an enterprise-grade, cloud-native weather intelligence and multi-instance distributed platform. The backend is engineered using **Python 3.11+** and the **Flask** microframework, integrating directly with the high-precision **Open-Meteo REST APIs** to stream real-time atmospheric telemetry without requiring third-party API keys or rate-limiting barriers. 

To guarantee 99.99% service availability, SKYCAST is architected on **Amazon Web Services (AWS)** using a multi-instance dual-Availability Zone topology. Inbound HTTP traffic is managed by an **AWS Application Load Balancer (ALB)**, which balances requests across a dynamic **Auto Scaling Group (ASG)** of Ubuntu EC2 instances running **Nginx** reverse proxies and **Gunicorn WSGI** application servers. System health is continuously verified using an automated health probe (`/api/health`), and instance telemetry is authenticated via **EC2 Instance Metadata Service Version 2 (IMDSv2)**.

The frontend is constructed using pure **HTML5, CSS3 Glassmorphism, Vanilla JavaScript (ES6+)**, and **Chart.js**, eliminating the bloat of heavy Node.js or JavaScript build pipelines. It features an interactive single-page SaaS dashboard providing:
1. An 8-point meteorological sensor array (Humidity, Wind Velocity, Wind Direction, Atmospheric Pressure, Visibility, UV Index, Cloud Coverage, Dew Point);
2. Continuous 24-hour hourly and 7-day extended forecast timelines;
3. Rule-based contextual life-safety insights (precipitation advisories, thermal comfort, UV solar radiation warnings);
4. An interactive solar arc visualizer tracking sunrise, sunset, and daylight trajectory;
5. Four multi-variable analytical charts;
6. An interactive AWS Infrastructure visualizer with real-time ALB routing simulation and IMDSv2 metadata inspection.

For college academic evaluation and local demonstration, SKYCAST incorporates zero-configuration **Windows batch scripts (`START.bat` and `STOP.bat`)** that automatically detect Python, provision isolated virtual environments, install dependencies, and launch the platform in the default browser with a single double-click.

---

## Keywords
*Cloud Computing, Amazon Web Services (AWS), Application Load Balancer (ALB), Auto Scaling Group (ASG), EC2, IMDSv2, Open-Meteo API, Flask, Chart.js, Glassmorphism, High Availability.*
