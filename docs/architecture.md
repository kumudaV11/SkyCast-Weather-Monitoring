# SKYCAST — System Architecture & Data Flow Diagrams

## 1. High-Level System Architecture Diagram

```mermaid
graph TD
    Client["Client Web Browser (Desktop / Mobile)"] -->|HTTP / HTTPS Port 80/443| Nginx["Nginx Reverse Proxy Server"]
    Nginx -->|Proxy Pass http://127.0.0.1:5000| Gunicorn["Gunicorn WSGI Master Process"]
    Gunicorn --> Worker1["Worker 1 (Python 3.11+)"]
    Gunicorn --> Worker2["Worker 2 (Python 3.11+)"]
    Gunicorn --> Worker3["Worker 3 (Python 3.11+)"]
    
    subgraph AppLayer["Flask Application Core (app.py)"]
        Worker1 --> Routes["Flask Router (/api/weather, /api/forecast, /api/health)"]
        Routes --> Geo["Geocoding Engine"]
        Routes --> Forecast["Forecast Telemetry Engine"]
        Routes --> RuleEngine["Rule-Based Weather Insights Engine"]
        Routes --> IMDS["IMDSv2 Discovery Module"]
        Routes --> StateEngine["History Storage Controller"]
    end
    
    Geo -->|Outbound REST GET| OM_Geo["Open-Meteo Geocoding API"]
    Forecast -->|Outbound REST GET| OM_Forecast["Open-Meteo Forecast API"]
    IMDS -->|HTTP PUT/GET :80| IMDSv2_Service["EC2 IMDSv2 (169.254.169.254)"]
    StateEngine -->|Local Fallback| JSONStore[("data/search_history.json")]
    StateEngine -.->|Cloud Mode| DynamoDB[("Amazon DynamoDB")]
```

---

## 2. AWS Multi-EC2 High-Availability Deployment Diagram

```mermaid
graph TD
    subgraph InternetZone["Public Internet"]
        Users["Global Web Users"]
    end

    Users -->|HTTPS / 443| ALB["AWS Application Load Balancer<br/>Public Subnets (Multi-AZ)"]
    
    subgraph VPC["Amazon VPC (Virtual Private Cloud)"]
        ALB -->|Target Tracking Round-Robin| TG["Target Group: skycast-tg<br/>Health Check: GET /api/health (15s)"]
        
        subgraph ASG["Auto Scaling Group (Min: 2, Desired: 2, Max: 4)"]
            subgraph AZ_A["Availability Zone: ap-south-1a"]
                EC2_A["EC2 Instance 1 (t3.micro)<br/>Ubuntu 22.04 LTS<br/>Nginx + Gunicorn + Flask"]
            end
            
            subgraph AZ_B["Availability Zone: ap-south-1b"]
                EC2_B["EC2 Instance 2 (t3.micro)<br/>Ubuntu 22.04 LTS<br/>Nginx + Gunicorn + Flask"]
            end
        end
        
        TG --> EC2_A
        TG --> EC2_B
    end
    
    EC2_A -->|HTTPS 443| OpenMeteo["Open-Meteo REST API"]
    EC2_B -->|HTTPS 443| OpenMeteo
    
    EC2_A -.->|IAM Instance Role| DynamoDB[("Amazon DynamoDB")]
    EC2_B -.->|IAM Instance Role| DynamoDB
    
    EC2_A -.->|Metrics Agent| CloudWatch["Amazon CloudWatch"]
    EC2_B -.->|Metrics Agent| CloudWatch
```

---

## 3. Application State & Workflow Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle: User Opens Dashboard
    Idle --> Geocoding: Enters City or Clicks Pill
    Geocoding --> FetchingForecast: Geocoding Resolved (Lat, Lon)
    Geocoding --> ErrorState: City Not Found (HTTP 404)
    FetchingForecast --> Transforming: Synoptic Telemetry Received
    FetchingForecast --> ErrorState: Timeout / Network Failure (HTTP 502)
    Transforming --> RuleEvaluation: Parse Current, Hourly, Daily & Units
    RuleEvaluation --> Rendering: Generate Lifestyle & Safety Insights
    Rendering --> HistoryLogged: Update DOM, Canvas Charts & Sun Arc
    HistoryLogged --> Idle: Save to DynamoDB / Local Storage
    ErrorState --> Idle: User Closes Notification
```
