# SKYCAST — College Viva Voce Defense Questions & Comprehensive Answers

This document provides **32 in-depth Viva Voce questions and answers** covering Cloud Computing, AWS Architecture, Python/Flask, Frontend Engineering, Networking, and Security to help you achieve top marks in your college project presentation.

---

## SECTION 1: AWS CLOUD COMPUTING & ARCHITECTURE

### Q1: What is the primary architectural purpose of using an Application Load Balancer (ALB) in SKYCAST?
**Answer:**  
The Application Load Balancer operates at Layer 7 (Application Layer) of the OSI model. Its primary purpose in SKYCAST is to distribute incoming HTTP/HTTPS user traffic across multiple EC2 instances running in different Availability Zones (`ap-south-1a` and `ap-south-1b`). It provides high availability, fault tolerance, health checking (`/api/health`), and automatic failover if any backend instance becomes unhealthy.

---

### Q2: How does the ALB detect if an EC2 instance has failed?
**Answer:**  
The ALB uses a configured Target Group health check. It periodically sends HTTP GET requests to `/api/health` on port 80. If an instance fails to respond with HTTP 200 for 3 consecutive intervals (unhealthy threshold), the ALB marks it as `Unhealthy` and stops routing user traffic to it. Once the instance recovers and passes 2 consecutive checks (healthy threshold), it is automatically restored to active service.

---

### Q3: What is the difference between an Application Load Balancer (ALB) and a Network Load Balancer (NLB)?
**Answer:**  
- **ALB (Layer 7)**: Inspects application-level data such as HTTP headers, request paths (`/api/weather`, `/static/`), host headers, and cookies. It is ideal for HTTP/HTTPS web applications requiring intelligent routing.
- **NLB (Layer 4)**: Operates at the transport layer (TCP/UDP). It routes traffic based on IP addresses and ports with ultra-low latency (millisecond range) and handles millions of requests per second, but cannot inspect HTTP headers or request paths.

---

### Q4: Why is SKYCAST deployed across multiple Availability Zones (Multi-AZ)?
**Answer:**  
Deploying across multiple Availability Zones eliminates physical single points of failure. If an entire AWS data center experiences a power failure, optical network disruption, or natural disaster in `ap-south-1a`, the instances in `ap-south-1b` continue serving traffic seamlessly, ensuring business continuity.

---

### Q5: What is an Auto Scaling Group (ASG) and how is it configured in this project?
**Answer:**  
An Auto Scaling Group automatically adjusts the number of EC2 instances based on demand. In SKYCAST:
- **Min Capacity**: 2 (ensures at least 1 instance in each AZ).
- **Desired Capacity**: 2.
- **Max Capacity**: 4.
- **Scaling Policy**: Target tracking policy based on Average CPU Utilization > 70%. When traffic surges and average CPU exceeds 70%, the ASG automatically launches new instances using a predefined Launch Template.

---

### Q6: What is IMDSv2 and why did you use it instead of IMDSv1?
**Answer:**  
IMDSv2 (Instance Metadata Service Version 2) is AWS's modern, session-oriented method for retrieving EC2 instance metadata (Instance ID, AZ, Public/Private IP).  
Unlike IMDSv1, which allowed simple unauthenticated HTTP GET requests and was vulnerable to Server-Side Request Forgery (SSRF) and open WAF reverse proxies, IMDSv2 requires:
1. A session token obtained via `PUT /latest/api/token` with an explicit TTL header.
2. Passing that token as a bearer header in subsequent GET requests.  
This makes SSRF attacks virtually impossible.

---

### Q7: How does SKYCAST handle running on a local Windows machine where AWS IMDS is not available?
**Answer:**  
In `config.py`, the `detect_aws_metadata()` function attempts to query `http://169.254.169.254` with a strict **0.8-second timeout**. When running on a local PC, the request immediately fails or times out, triggering a graceful fallback to local environment detection using Python's `socket.gethostname()` and `platform.system()`. The dashboard clearly displays **"LOCAL DEVELOPMENT MODE"** without crashing or fabricating fake AWS data.

---

### Q8: What is the role of Amazon DynamoDB in this architecture?
**Answer:**  
DynamoDB is a fully managed, serverless NoSQL key-value database. In SKYCAST, it stores global search query history across all distributed EC2 instances with single-digit millisecond latency. If DynamoDB is disabled or AWS credentials are not configured, the application automatically falls back to local JSON file storage (`data/search_history.json`).

---

### Q9: Why is Nginx used in front of Gunicorn and Flask instead of running Flask directly?
**Answer:**  
1. **Security**: Nginx acts as a reverse proxy, shielding the application server from direct public exposure and handling malicious or malformed HTTP requests.
2. **Static Asset Performance**: Nginx serves CSS, JavaScript, and SVG files directly from disk with Gzip compression and client-side caching headers without consuming Python CPU cycles.
3. **Slow Client Buffering**: Nginx buffers slow client connections, preventing slow internet users from occupying Gunicorn worker threads.

---

### Q10: What is the function of Gunicorn in this project?
**Answer:**  
Gunicorn (Green Unicorn) is a production-grade Python WSGI (Web Server Gateway Interface) HTTP server. Flask’s built-in development server is single-threaded and unsuitable for production. Gunicorn spawns a master process and multiple pre-fork worker processes (e.g. `(2 x Cores) + 1`), allowing the application to process multiple concurrent requests simultaneously.

---

### Q11: Explain the AWS Shared Responsibility Model in the context of this project.
**Answer:**  
- **AWS Responsibility (Security OF the Cloud)**: Physical data center security, hardware maintenance, host hypervisors, network infrastructure, and ALB availability.
- **Customer/Student Responsibility (Security IN the Cloud)**: Configuring Security Groups, patching Ubuntu OS on EC2 instances, securing Flask code, managing IAM policies, and encrypting data.

---

### Q12: Why is it important to clean up AWS resources after the project evaluation?
**Answer:**  
Services such as Application Load Balancers incur hourly running charges (~$0.0225/hour) regardless of whether traffic is flowing. Additionally, AWS charges for allocated public IPv4 addresses ($0.005/hour). Deleting the ASG, ALB, and terminating EC2 instances immediately prevents unexpected credit card charges.

---

## SECTION 2: PYTHON, FLASK & BACKEND ENGINEERING

### Q13: Why did you choose Flask over Django or FastAPI?
**Answer:**  
Flask is a lightweight microframework that provides complete architectural freedom without the bloat of Django's built-in ORM, admin panel, or complex migrations. It is fast, beginner-friendly, and integrates seamlessly with external REST APIs like Open-Meteo while remaining very easy to deploy via Gunicorn.

---

### Q14: How does the `/api/weather` endpoint work from start to finish?
**Answer:**  
1. Accepts user query parameter `city` (e.g. `GET /api/weather?city=Mumbai`).
2. Calls Open-Meteo Geocoding API to resolve the city name into latitude, longitude, and country.
3. Calls Open-Meteo Forecast API with those coordinates to retrieve current, hourly, and daily metrics.
4. Translates WMO numerical codes into human-readable conditions and Lucide icon keys.
5. Runs the rule-based insights engine (evaluating rain probability, UV index, and temperature).
6. Asynchronously records the query into the search history store.
7. Returns a structured JSON payload with HTTP status 200.

---

### Q15: How does your application handle invalid city names or network failures?
**Answer:**  
- If a city is not found by the geocoding service, the backend returns a clean **HTTP 404** with `{ "error": "City '...' could not be located" }`.
- If Open-Meteo times out or network connectivity is severed, the backend catches `requests.exceptions.Timeout` and returns an **HTTP 502/503** with a descriptive message.
- The frontend catches these non-200 responses and displays a friendly error banner without crashing.

---

### Q16: What is the WMO code and why does Open-Meteo use it?
**Answer:**  
WMO stands for the World Meteorological Organization. WMO codes are standardized numerical codes (from 0 to 99) used by meteorological agencies worldwide to represent atmospheric states (e.g., Code 0 = Clear Sky, Code 61 = Light Rain, Code 95 = Thunderstorm). Open-Meteo uses WMO codes for precision and international compatibility.

---

### Q17: What are the rule-based weather insights and how are they generated?
**Answer:**  
The rule-based insights are automated lifestyle suggestions synthesized in `generate_weather_insights()`:
- **Rain Alert**: If precipitation probability >= 50% or rain codes are active ➔ Suggests carrying an umbrella.
- **UV Advisory**: If UV index >= 6 ➔ Advises sunscreen and eye protection.
- **Heat Index**: If temperature >= 33°C or feels-like >= 35°C ➔ Advises optimal hydration.
- **Cold Advisory**: If temperature <= 14°C ➔ Recommends warm layered clothing.

---

## SECTION 3: FRONTEND & UI/UX DESIGN

### Q18: What is Glassmorphism and how is it implemented in CSS?
**Answer:**  
Glassmorphism is a modern UI design aesthetic featuring translucent frosted-glass panels, soft blurred backgrounds, subtle light borders, and multi-layered depth. In SKYCAST, it is implemented using:
```css
background: rgba(15, 23, 42, 0.68);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
```

---

### Q19: Why was pure Vanilla JavaScript and CSS chosen instead of React or Tailwind?
**Answer:**  
1. **Zero Setup Friction**: React requires Node.js, npm, package.json, and compilation steps that often fail on examiners' Windows machines due to missing build tools.
2. **Direct Browser Execution**: Vanilla JS and standard CSS run natively in any modern browser without preprocessing.
3. **High Performance**: Eliminates the 100+ KB overhead of virtual DOM libraries.

---

### Q20: How does the temperature unit toggle (°C / °F) function?
**Answer:**  
The unit switch is handled client-side in `app.js`. When the user clicks `°F`, all displayed values are immediately recalculated using the mathematical conversion formula:
$$F = (C \times \frac{9}{5}) + 32$$
The Chart.js datasets and 7-day forecast cards update dynamically in memory without re-querying the API.

---

### Q21: How is the visual sunrise and sunset arc drawn and animated?
**Answer:**  
The arc is rendered using an SVG `<path>` and `<circle>`. The client calculates the percentage of daylight that has elapsed:
$$\text{Ratio} = \frac{\text{Current Time} - \text{Sunrise Time}}{\text{Sunset Time} - \text{Sunrise Time}}$$
Using standard trigonometry along an elliptical arc ($x = C_x + R_x \cos\theta, y = C_y - R_y \sin\theta$), the sun marker circle is positioned precisely along the curve, with a glowing drop shadow.

---

### Q22: How does Chart.js integrate with dynamic API data in this project?
**Answer:**  
Chart.js is initialized on HTML5 `<canvas>` elements. When the backend returns hourly forecast arrays, `app.js` extracts the time labels and metric values, feeds them into Chart.js datasets with custom cubic spline smoothing (`tension: 0.35`) and linear gradient background fills, and destroys previous chart instances before re-rendering to prevent canvas memory leaks.

---

## SECTION 4: NETWORKING, DEPLOYMENT & TESTING

### Q23: What does `START.bat` do behind the scenes?
**Answer:**  
1. Checks if `python` is in the system PATH.
2. Inspects Python version.
3. Automatically creates a virtual environment `.venv` if one does not exist.
4. Activates `.venv`.
5. Upgrades pip and installs `requirements.txt`.
6. Starts `python app.py` on port 5000.
7. Automatically opens `http://localhost:5000` in the user's default browser after a 2-second delay.

---

### Q24: What does `STOP.bat` do?
**Answer:**  
`STOP.bat` executes a command using `netstat -aon` to identify any active process listening on TCP port 5000, extracts its Process Identifier (PID), and executes `taskkill /F /PID <PID>` to safely terminate the running server.

---

### Q25: What is CORS and how is it handled here?
**Answer:**  
CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts HTTP requests initiated from scripts outside the origin domain. Because SKYCAST serves both the HTML frontend and the Flask API endpoints from the same origin (same domain and port), CORS errors do not occur.

---

### Q26: What is the purpose of the 8 meteorological metrics displayed?
**Answer:**  
1. **Humidity (%)**: Air moisture content impacting human comfort and evaporation.
2. **Wind Speed (km/h)**: Air movement velocity classified via the Beaufort Scale.
3. **Wind Direction (Degrees & Cardinal)**: Direction from which the wind originates, rendered with a 360° compass.
4. **Atmospheric Pressure (hPa)**: Barometric pressure indicating high/fair or low/stormy systems.
5. **Visibility (km)**: Atmospheric clarity for driving and aviation.
6. **UV Index (0-11+)**: Solar ultraviolet radiation risk level.
7. **Cloud Coverage (%)**: Percentage of the sky covered by clouds.
8. **Dew Point (°C)**: Temperature to which air must be cooled to become saturated with water vapor.

---

### Q27: How does the ALB traffic simulation in the AWS tab work?
**Answer:**  
The "Simulate ALB Request Routing" button simulates the Layer 7 round-robin routing of an ALB. Each click toggles the active target between EC2 Instance 1 (`ap-south-1a`) and EC2 Instance 2 (`ap-south-1b`), updating the active pulse rings, node borders, round-trip latency (14ms - 22ms), and logging the transaction to a terminal readout.

---

### Q28: How were the automated tests performed?
**Answer:**  
Automated testing was conducted using Python's `unittest` module in `tests/test_app.py`. The suite exercises Flask's test client (`app.test_client()`) to verify:
- `GET /api/health` returns status `healthy` and HTTP 200.
- `GET /api/instance` returns valid environment info.
- `GET /api/weather?city=Bengaluru` returns valid coordinates and current metrics.
- `GET /api/weather?city=nonexistentcityxyz` returns HTTP 404.
- `GET /api/history` and `POST /api/history` correctly persist and return audit logs.

---

### Q29: What are IAM Roles and why are they preferred over IAM User Access Keys on EC2?
**Answer:**  
IAM Roles for EC2 (Instance Profiles) allow applications running on EC2 to obtain temporary AWS security credentials automatically via IMDS. This eliminates the catastrophic security risk of hardcoding permanent AWS Access Keys and Secret Keys in code or configuration files.

---

### Q30: What is the purpose of Gzip compression in Nginx?
**Answer:**  
Gzip compression compresses text-based responses (HTML, CSS, JavaScript, JSON, SVG) before sending them over the network. This reduces file transfer sizes by 60% to 80%, substantially accelerating page load times and reducing network bandwidth costs.

---

### Q31: If the Open-Meteo API goes down, what happens to the user experience?
**Answer:**  
The Flask backend catches the connection timeout, prevents server crashes, and returns an HTTP 502 Bad Gateway response with an informative message. The frontend catches this error and presents a clean notification banner at the top of the dashboard instructing the user to verify network connectivity or retry.

---

### Q32: What are the key takeaways of this project for an engineering student?
**Answer:**  
This project demonstrates that robust cloud computing is not just about writing application code, but about architecting resilient, decoupled systems that anticipate failure. It provides hands-on mastery of Elastic Load Balancing, Multi-AZ design, systemd service management, reverse proxies, secure metadata protocols (IMDSv2), and modern frontend visualization.
