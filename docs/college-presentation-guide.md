# SKYCAST — College Presentation & Viva Voce Master Guide

**Project Name**: SKYCAST — Intelligent Weather Monitoring & AWS Multi-Instance Cloud Platform  
**Target Time**: 5 to 7 Minutes Presentation + Viva Defense  
**Runtime Status**: Fully Functional Local Production Server on Port 5000 (Tested & Verified)

---

## 1. 5-Minute Presentation Script (What to Say to the Examiners)

Use this script verbatim or adapt it into your own words. It is timed for a crisp 5-minute delivery.

### Slide / Screen 1: Title & Introduction (Minute 0:00 – 1:00)
> *"Respected external examiner, internal guide, and faculty members, good morning.*  
> *Today, I am presenting **SKYCAST: An Intelligent Weather Monitoring and AWS Multi-Instance Cloud Platform**.*  
> 
> *During extreme weather events such as cyclones or localized heavy rains, millions of citizens access weather portals at the same moment. Traditional single-server systems crash under these sudden traffic spikes due to a single point of failure.  
> To address this challenge, SKYCAST combines a modern, zero-build Python/Flask meteorological analytics platform with an enterprise-grade, high-availability AWS cloud architecture featuring an Application Load Balancer, Multi-AZ EC2 instances, and automated instance metadata security.*"

---

### Slide / Screen 2: How SkyCast Works (Minute 1:00 – 2:15)
> *(Open the live dashboard in your browser: `http://localhost:5000`)*  
> 
> *"Let me demonstrate the working application running here on our system:*  
> 1. ***Zero-Key Ingestion***: When I search for any global city—such as Bengaluru, Mumbai, or London—the Flask backend coordinates with the Open-Meteo Geocoding API to resolve coordinates and streams live synoptic meteorological data with zero paid API keys.  
> 2. ***8-Point Sensor Array***: We display Relative Humidity, Wind Velocity with Beaufort Scale classification, Wind Direction with a dynamic 360-degree compass needle, Barometric Pressure, Line-of-sight Visibility, UV Solar Index, Cloud Coverage, and Dew Point.  
> 3. ***Predictive Horizons***: The user can interact with a 24-hour hourly slider, a 7-day extended forecast with thermal gradient spans, and an automated solar trajectory arc tracking sunrise and sunset.  
> 4. ***Rule-Based Weather Insights***: Rather than just numbers, SkyCast computes automated safety advisories—alerting users to carry umbrellas if rain probability exceeds 30%, warning against prolonged sun exposure if UV index reaches 6, and recommending hydration or warm clothing based on real-time heat indices."*

---

### Slide / Screen 3: Interactive Analytics & Architecture Visualizer (Minute 2:15 – 3:30)
> *(Click the **Analytics** tab and then the **AWS Infrastructure** tab)*  
> 
> *"On the Analytics tab, hardware-accelerated Chart.js visualizations plot 24-hour temperature trajectories, humidity curves, wind vectors, and precipitation probability density.  
> 
> On the AWS Infrastructure tab, we have designed an interactive topology map representing the dual-instance architecture.  
> When I click **'Simulate ALB Request Routing'**, you can see how an Application Load Balancer distributes incoming HTTP requests across two instances in different Availability Zones (ap-south-1a and ap-south-1b) using round-robin distribution with simulated sub-20ms latency.*"

---

### Slide / Screen 4: Local Implementation vs. Cloud Readiness (Minute 3:30 – 4:15)
> *"For our project demonstration today, the application is running in **Local Development Mode** on port 5000.  
> We have engineered the backend with AWS **IMDSv2** (Instance Metadata Service Version 2) compatibility. When running locally, it detects that it is outside EC2 within 800 milliseconds and displays 'Local Development Mode' without crashing or fabricating fake AWS data.  
> 
> When deployed to AWS, our ready-to-deploy provisioning scripts (`aws/ec2-setup.sh`, `aws/nginx.conf`, and `aws/skycast.service`) launch identical Ubuntu 22.04 instances running Nginx reverse proxies and Gunicorn WSGI workers behind an AWS Application Load Balancer.*"

---

### Slide / Screen 5: Summary & Conclusion (Minute 4:15 – 5:00)
> *"In conclusion, SKYCAST achieves three major goals:*  
> *First, it delivers an intuitive, glassmorphic SaaS interface without bloated JavaScript build pipelines.  
> Second, it provides actionable rule-based weather intelligence.  
> And third, it establishes a production-ready blueprint for high-availability cloud deployment with automated failover and zero single points of failure.  
> Thank you, and I am now open to your questions."*

---

## 2. Core AWS Cloud Concepts Explained Simply

If the examiner asks you to explain any AWS service, use these straightforward answers:

### 1. Amazon EC2 (Elastic Compute Cloud)
- **What it is**: Secure, resizable virtual servers (compute instances) running in the AWS cloud.
- **In our project**: We use Ubuntu 22.04 LTS `t3.micro` instances. EC2 runs our Python 3 runtime, Gunicorn WSGI application server, and Nginx reverse proxy.

### 2. AWS Application Load Balancer (ALB)
- **What it is**: A Layer-7 (Application Layer) load balancer that inspects incoming HTTP/HTTPS web traffic and distributes it across multiple backend compute targets.
- **In our project**: The ALB sits at the public internet edge across two Availability Zones (`ap-south-1a` and `ap-south-1b`). It routes user requests to healthy EC2 instances using a round-robin algorithm and offloads traffic from unhealthy instances.

### 3. Target Groups
- **What it is**: A logical grouping of compute targets (such as EC2 instances or IP addresses) that receive traffic routed by a load balancer.
- **In our project**: Target Group `skycast-tg` groups EC2 Instance 1 and EC2 Instance 2 on Port 80 and performs periodic health checks by polling our `/api/health` endpoint every 15 seconds.

### 4. Amazon CloudWatch
- **What it is**: AWS's native monitoring and observability service that collects metrics, logs, and alarms from AWS resources.
- **In our project**: CloudWatch monitors ALB `HealthyHostCount`, `TargetResponseTime` (latency), and EC2 `CPUUtilization` to trigger autoscaling alarms if server load exceeds 70%.

### 5. Amazon VPC (Virtual Private Cloud)
- **What it is**: An isolated, private virtual network dedicated to your AWS account.
- **In our project**: The VPC provides the private IP CIDR block (`172.31.0.0/16`) and subnets spanning multiple Availability Zones, ensuring compute nodes communicate securely while isolating private application ports from public exposure.

### 6. AWS IAM (Identity and Access Management)
- **What it is**: A security service that controls authentication and authorization for AWS resources and users.
- **In our project**: We use an **IAM Instance Role** attached to EC2 instances. This grants the instances temporary, rotating credentials via IMDSv2 to read/write to Amazon DynamoDB and CloudWatch, eliminating the severe security risk of hardcoding permanent access keys in source code.

---

## 3. How the Actual SkyCast Application Works (Technical Flow)

```
[User Browser]
      │ HTTP Request (e.g. GET /api/weather?city=Mumbai)
      ▼
[Flask Server (app.py : Port 5000)]
      │
      ├── 1. IMDSv2 Detection (config.py)
      │      Checks http://169.254.169.254/latest/api/token (<0.8s)
      │      Result on Laptop: "LOCAL DEVELOPMENT MODE" (Host, IP, OS)
      │      Result on AWS: EC2 Instance ID, Zone, AMI ID, Region
      │
      ├── 2. Geocoding Query
      │      Calls: https://geocoding-api.open-meteo.com/v1/search?name=Mumbai
      │      Returns: Latitude (19.07), Longitude (72.87), Country, Timezone
      │
      ├── 3. Forecast Query
      │      Calls: https://api.open-meteo.com/v1/forecast with lat/lon parameters
      │      Retrieves: Current, 24h Hourly, and 7-day Daily synoptic metrics
      │
      ├── 4. Rule-Based Intelligence Engine
      │      Evaluates rain odds, UV radiation, and ambient/feels-like temperatures
      │      Generates contextual lifestyle advice (Umbrella, Sunscreen, Hydration)
      │
      ├── 5. Audit Logging
      │      Records query to local JSON (or DynamoDB if enabled)
      │
      ▼
[JSON Response to Frontend]
      │
      ├── Renders Hero Card & 8 Metrics
      ├── Computes SVG Solar Arc (Sun position from sunrise/sunset timestamps)
      ├── Smooths Chart.js curves on HTML5 Canvas
      └── Updates Search History Table
```

---

## 4. 20 Likely College Viva Questions & Simple Answers

### Q1: What problem does your project solve?
**Answer**: It eliminates single points of failure in weather forecasting portals during sudden regional weather emergencies by designing a scalable, load-balanced multi-instance cloud architecture while providing actionable lifestyle insights instead of raw numbers.

### Q2: Why did you choose Open-Meteo instead of OpenWeatherMap?
**Answer**: Open-Meteo is open-source, non-commercial, and requires zero paid API keys or credit card registration. It provides reliable WMO-standard meteorological data with high accuracy without hitting rate limits during student testing.

### Q3: What is IMDSv2 and why is it important?
**Answer**: Instance Metadata Service Version 2 is an AWS security standard used by EC2 instances to retrieve metadata. Unlike IMDSv1, it requires a session token via an HTTP PUT request, preventing Server-Side Request Forgery (SSRF) vulnerabilities that could expose cloud credentials.

### Q4: How does your code know it is running on a laptop versus an AWS EC2 instance?
**Answer**: In `config.py`, the function `detect_aws_metadata()` attempts an HTTP PUT request to AWS link-local IP `169.254.169.254` with a 0.8-second timeout. On our laptop, the request times out safely and returns local machine information without crashing. On EC2, it receives the metadata token and returns the real AWS instance ID and Availability Zone.

### Q5: What is the purpose of the `/api/health` endpoint?
**Answer**: It acts as the health check probe for the Application Load Balancer. The ALB polls this endpoint every 15 seconds. If it returns HTTP 200 with status `healthy`, the load balancer knows the instance is capable of serving user traffic.

### Q6: What is a Reverse Proxy, and why do we use Nginx?
**Answer**: A reverse proxy sits between the internet and the application server. We use Nginx on Port 80 because it serves static assets (CSS, JS, images) with caching and Gzip compression at high speeds, and shields the Gunicorn Python process from slow client connections.

### Q7: Why can't we run Flask's built-in development server in production?
**Answer**: Flask's built-in server is single-threaded, intended only for local development, and cannot handle concurrent connections efficiently. In production on EC2, we use Gunicorn WSGI, which spawns multiple pre-fork worker processes to handle simultaneous requests.

### Q8: What is the Beaufort Scale?
**Answer**: An empirical scale ranging from 0 to 12 that relates wind velocity to observed conditions at sea or on land. In SkyCast, wind speed is classified into Beaufort categories such as "Light Breeze" or "Moderate Breeze" on Metric Card 2.

### Q9: How is the sunrise and sunset solar arc calculated?
**Answer**: In `app.js`, we compare the current timestamp against the sunrise and sunset times returned by the API to calculate elapsed daylight percentage. We then plot the glowing sun marker along an SVG elliptical arc using cosine and sine trigonometric formulas.

### Q10: How does the temperature toggle between Celsius and Fahrenheit?
**Answer**: The conversion is handled instantly on the client side in JavaScript using the formula $F = (C \times \frac{9}{5}) + 32$. All numbers, cards, and Chart.js datasets update in memory without requiring a new API call.

### Q11: What is High Availability (HA)?
**Answer**: High Availability means designing a system to operate continuously without interruption for a desirable period, typically achieved by eliminating single points of failure through redundancy across multiple Availability Zones.

### Q12: What happens if one EC2 instance crashes in the AWS architecture?
**Answer**: The Application Load Balancer's target group detects that `/api/health` failed 3 consecutive times, marks the instance as `Unhealthy`, and automatically routes 100% of user traffic to the healthy second instance in the other Availability Zone without downtime.

### Q13: What is the role of an Auto Scaling Group (ASG)?
**Answer**: It automatically increases or decreases the number of EC2 instances based on demand (for example, adding instances when average CPU utilization exceeds 70%), ensuring consistent performance during traffic spikes while saving costs during quiet periods.

### Q14: How is search history stored in your application?
**Answer**: SkyCast supports dual persistence: locally, it writes query audit logs to `data/search_history.json`. When deployed on AWS with DynamoDB enabled, it persists searches to a managed `SkycastSearchHistory` NoSQL table via Boto3.

### Q15: Why didn't you use React or Node.js for this project?
**Answer**: Using pure HTML5, modern CSS3 Glassmorphism, and Vanilla JavaScript avoids the complex build steps (npm, webpack) and memory overhead of heavy frameworks, ensuring the project launches instantly on any Windows laptop without dependency issues.

### Q16: What is a WMO Weather Code?
**Answer**: A standardized code established by the World Meteorological Organization (e.g., Code 0 for Clear Sky, Code 61 for Light Rain, Code 95 for Thunderstorm). SkyCast translates these numeric codes into clear descriptions and Lucide icons.

### Q17: What security measures are implemented in your project?
**Answer**: 
1. Strict IMDSv2 token authentication.
2. Non-root user execution (`skycast` user in systemd).
3. Private subnet isolation where EC2 instances only accept HTTP traffic from the ALB security group.
4. Input sanitization on city queries with proper HTTP status codes (400 for empty queries, 404 for invalid cities).

### Q18: What is CloudWatch, and what metrics would you monitor?
**Answer**: Amazon CloudWatch is an AWS monitoring service. Key metrics monitored include `HealthyHostCount` (verifying target nodes are active), `TargetResponseTime` (measuring latency), and `CPUUtilization` (measuring compute load).

### Q19: What is the difference between Public Subnet and Private Subnet?
**Answer**: A public subnet has a route to an Internet Gateway and can receive inbound internet traffic (where the ALB resides). A private subnet does not have a direct route to the Internet Gateway, keeping backend database and compute nodes secure.

### Q20: What are the main limitations of the current implementation?
**Answer**: 
1. Current weather updates rely on an active internet connection to query Open-Meteo.
2. Historical data is currently limited to the last 30 queries when running in local file storage mode.

---

## 5. Honest Representation: Local Prototype vs. AWS Cloud Blueprint

During the presentation, state clearly and honestly:

| Aspect | Current Verified Status on Laptop | Planned Production AWS Blueprint |
| :--- | :--- | :--- |
| **Running Environment** | Running locally on Python 3.12 Flask (`http://localhost:5000`) | Multi-AZ Ubuntu 22.04 LTS `t3.micro` EC2 instances |
| **API Ingestion** | Fully active & real (live Open-Meteo global API queries) | Fully active & identical |
| **IMDSv2 Status** | Authentic fallback to **"LOCAL DEVELOPMENT MODE"** (verified) | Reads real EC2 instance ID, AZ, and AMI via token |
| **Load Balancing** | Interactive client-side simulator showing round-robin routing | Layer-7 AWS Application Load Balancer with Target Group |
| **Database State** | Local JSON store (`data/search_history.json`) | Amazon DynamoDB NoSQL table (`SkycastSearchHistory`) |
| **Deployment Scripts** | Ready in `aws/` (`ec2-setup.sh`, `nginx.conf`, `skycast.service`) | Executed during EC2 launch via Launch Template / User Data |

*Tip for Examiners*: *"We chose to demonstrate the working system locally on our development node to guarantee zero latency during the college presentation while avoiding unnecessary cloud billing. All production cloud deployment scripts and architecture files are verified and packaged in the `aws/` directory."*

---

## 6. Screenshots You Can Show from the Running Application

To showcase your project, simply capture and display these sections from your live browser at `http://localhost:5000`:

1. **Overview Hero Card & 8 Metrics**:
   - Shows live temperature, condition title, animated sun/clouds illustration, and the 8 cards (Humidity, Wind speed, Compass, Barometric pressure, Visibility, UV index, Cloud cover, Dew point).
2. **Predictive Horizons & Solar Arc**:
   - Shows the 24-hour horizontal card slider, the sunrise/sunset arc with the glowing sun marker, and the 7-day extended forecast with high/low gradient bars.
3. **Smart Weather Insights**:
   - Highlights the automated rule-based advisories (umbrella recommendation, UV radiation safety, hydration alert).
4. **Interactive Analytics Tab**:
   - Displays the 4 Chart.js curves: Temperature Fluctuation Profile, Relative Humidity Curve, Wind Velocity Vector, and Precipitation Probability Density.
5. **AWS Infrastructure Tab**:
   - Shows the interactive topography diagram (End Users ➔ ALB ➔ Target Group ➔ EC2 Instances), the IMDSv2 Metadata Inspector table displaying `LOCAL DEVELOPMENT MODE`, and the ALB simulation log.
6. **Search History Tab**:
   - Shows the search audit log with cities, timestamps, recorded temperatures, and the one-click **Reload** button.
