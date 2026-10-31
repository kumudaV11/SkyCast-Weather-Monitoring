"""
SKYCAST Configuration & Cloud Infrastructure Utilities
Handles environment variables, AWS IMDSv2 detection, and service discovery.
"""

import os
import socket
import platform
import logging
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("skycast")

class Config:
    """Base application configuration."""
    APP_NAME = "SKYCAST"
    APP_VERSION = "2.4.0"
    PORT = int(os.environ.get("PORT", 5000))
    HOST = os.environ.get("HOST", "0.0.0.0")
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    SECRET_KEY = os.environ.get("SECRET_KEY", "skycast-production-secret-key-change-in-prod")
    DEFAULT_CITY = os.environ.get("DEFAULT_CITY", "Bengaluru")
    
    # Open-Meteo Public API URLs (Free & No API key required)
    GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
    FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast"
    REQUEST_TIMEOUT = 6.0  # seconds

    # AWS Specific Configuration
    AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
    DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "SkycastSearchHistory")
    ENABLE_DYNAMODB = os.environ.get("ENABLE_DYNAMODB", "0") == "1"
    S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")
    
    # Local Storage Fallback
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    LOCAL_HISTORY_FILE = os.path.join(DATA_DIR, "search_history.json")


def detect_aws_metadata() -> Dict[str, Any]:
    """
    Detects whether the application is running inside an AWS EC2 instance
    using AWS EC2 Instance Metadata Service Version 2 (IMDSv2).
    
    If running locally or outside AWS, fails quickly (<1s) and returns
    local development environment metadata without fabricating AWS data.
    """
    imds_base = "http://169.254.169.254/latest"
    headers = {"X-aws-ec2-metadata-token-ttl-seconds": "60"}
    
    try:
        # Step 1: Request IMDSv2 session token
        token_response = requests.put(
            f"{imds_base}/api/token",
            headers=headers,
            timeout=0.8
        )
        
        if token_response.status_code == 200:
            token = token_response.text
            auth_headers = {"X-aws-ec2-metadata-token": token}
            
            # Step 2: Fetch instance attributes
            def get_meta(path: str) -> str:
                try:
                    res = requests.get(f"{imds_base}/meta-data/{path}", headers=auth_headers, timeout=0.8)
                    return res.text if res.status_code == 200 else "Unavailable"
                except Exception:
                    return "Unavailable"

            instance_id = get_meta("instance-id")
            az = get_meta("placement/availability-zone")
            instance_type = get_meta("instance-type")
            local_ipv4 = get_meta("local-ipv4")
            public_ipv4 = get_meta("public-ipv4")
            ami_id = get_meta("ami-id")
            
            region = az[:-1] if az and az != "Unavailable" else "ap-south-1"
            
            return {
                "is_aws": True,
                "environment": "AWS EC2 Production",
                "instance_id": instance_id,
                "availability_zone": az,
                "region": region,
                "instance_type": instance_type,
                "local_ip": local_ipv4,
                "public_ip": public_ipv4 if public_ipv4 != "Unavailable" else "None (Private Subnet / ALB Target)",
                "ami_id": ami_id,
                "hostname": socket.gethostname(),
                "os": f"{platform.system()} {platform.release()}"
            }
    except Exception:
        # Expected when running on local machine or outside EC2
        pass

    # Fallback to authentic local environment info
    return {
        "is_aws": False,
        "environment": "LOCAL DEVELOPMENT MODE",
        "instance_id": f"local-{socket.gethostname()[:8].lower()}",
        "availability_zone": "localhost / workstation",
        "region": "local",
        "instance_type": "Workstation (Developer Node)",
        "local_ip": "127.0.0.1",
        "public_ip": "Localhost",
        "ami_id": "N/A (Local Process)",
        "hostname": socket.gethostname(),
        "os": f"{platform.system()} {platform.release()}"
    }


# WMO Weather Interpretation Codes mapping (Standard WMO code to friendly title, icon, and description)
WMO_WEATHER_CODES = {
    0: {"condition": "Clear Sky", "icon": "sun", "description": "Crisp and clear atmospheric conditions."},
    1: {"condition": "Mainly Clear", "icon": "sun-medium", "description": "Predominantly clear with a few light clouds."},
    2: {"condition": "Partly Cloudy", "icon": "cloud-sun", "description": "Scattered cloud cover with sunshine intervals."},
    3: {"condition": "Overcast", "icon": "cloud", "description": "Persistent overcast cloud cover."},
    45: {"condition": "Foggy", "icon": "cloud-fog", "description": "Reduced visibility due to atmospheric fog."},
    48: {"condition": "Depositing Rime Fog", "icon": "cloud-fog", "description": "Freezing rime fog conditions."},
    51: {"condition": "Light Drizzle", "icon": "cloud-drizzle", "description": "Fine, light drizzle droplets falling."},
    53: {"condition": "Moderate Drizzle", "icon": "cloud-drizzle", "description": "Steady drizzle with moderate surface dampening."},
    55: {"condition": "Dense Drizzle", "icon": "cloud-drizzle", "description": "Heavy mist and dense drizzle."},
    56: {"condition": "Freezing Drizzle", "icon": "cloud-snow", "description": "Light sub-zero freezing drizzle."},
    57: {"condition": "Dense Freezing Drizzle", "icon": "cloud-snow", "description": "Dense freezing drizzle on surfaces."},
    61: {"condition": "Slight Rain", "icon": "cloud-rain", "description": "Intermittent light rain showers."},
    63: {"condition": "Moderate Rain", "icon": "cloud-rain", "description": "Consistent moderate rainfall."},
    65: {"condition": "Heavy Rain", "icon": "cloud-rain-wind", "description": "Intense torrential precipitation."},
    66: {"condition": "Freezing Rain", "icon": "cloud-snow", "description": "Freezing rain producing ice buildup."},
    67: {"condition": "Heavy Freezing Rain", "icon": "cloud-snow", "description": "Severe freezing rain warning."},
    71: {"condition": "Slight Snow Fall", "icon": "snowflake", "description": "Gentle fluttering snowfall."},
    73: {"condition": "Moderate Snow Fall", "icon": "snowflake", "description": "Accumulating moderate snow flurries."},
    75: {"condition": "Heavy Snow Fall", "icon": "snowflake", "description": "Heavy snowfall and drifting conditions."},
    77: {"condition": "Snow Grains", "icon": "snowflake", "description": "Small crystalline snow grains."},
    80: {"condition": "Slight Rain Showers", "icon": "cloud-rain", "description": "Scattered, short-lived rain showers."},
    81: {"condition": "Moderate Rain Showers", "icon": "cloud-rain", "description": "Passing rain showers with gusty winds."},
    82: {"condition": "Violent Rain Showers", "icon": "cloud-rain-wind", "description": "High-intensity localized rain bursts."},
    85: {"condition": "Slight Snow Showers", "icon": "snowflake", "description": "Brief passing light snow showers."},
    86: {"condition": "Heavy Snow Showers", "icon": "snowflake", "description": "Squall-like heavy snow bursts."},
    95: {"condition": "Thunderstorm", "icon": "cloud-lightning", "description": "Active electrical storm activity."},
    96: {"condition": "Thunderstorm with Slight Hail", "icon": "cloud-lightning", "description": "Thunderstorm accompanied by small hail."},
    99: {"condition": "Severe Thunderstorm with Heavy Hail", "icon": "cloud-lightning", "description": "Severe storm with strong wind gusts and hail."}
}

def get_weather_info(code: int) -> Dict[str, str]:
    """Retrieves friendly condition name, icon and description for a WMO code."""
    return WMO_WEATHER_CODES.get(
        code,
        {"condition": "Cloudy Conditions", "icon": "cloud", "description": "Stable seasonal meteorological conditions."}
    )
