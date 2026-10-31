"""
SKYCAST — Intelligent Weather Monitoring & AWS Multi-Instance Cloud Platform
Flask Application Backend
"""

import os
import json
import time
import datetime
import logging
from typing import Dict, Any, List, Optional
import requests
from flask import Flask, render_template, request, jsonify

from config import Config, detect_aws_metadata, get_weather_info

# Initialize Flask application
app = Flask(__name__)
app.config.from_object(Config)

logger = logging.getLogger("skycast.app")

# Ensure local data directory exists for search history
os.makedirs(Config.DATA_DIR, exist_ok=True)
if not os.path.exists(Config.LOCAL_HISTORY_FILE):
    with open(Config.LOCAL_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

SERVER_START_TIME = time.time()


# ==========================================
# HISTORY STORAGE (LOCAL JSON & DYNAMODB)
# ==========================================

def get_history_entries(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve recent search history from DynamoDB if enabled, otherwise from local file."""
    if Config.ENABLE_DYNAMODB:
        try:
            import boto3 # pyright: ignore[reportMissingImports]
            dynamodb = boto3.resource("dynamodb", region_name=Config.AWS_REGION)
            table = dynamodb.Table(Config.DYNAMODB_TABLE_NAME)
            response = table.scan(Limit=limit)
            items = response.get("Items", [])
            # Sort by timestamp desc
            items.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
            return items[:limit]
        except Exception as e:
            logger.warning(f"DynamoDB read failed, falling back to local storage: {e}")

    try:
        if os.path.exists(Config.LOCAL_HISTORY_FILE):
            with open(Config.LOCAL_HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
                return sorted(history, key=lambda x: x.get("timestamp", 0), reverse=True)[:limit]
    except Exception as e:
        logger.error(f"Error reading local history: {e}")
    return []


def save_history_entry(city: str, country: str, temp: float, condition: str) -> None:
    """Save city search to DynamoDB or local JSON."""
    entry = {
        "id": f"{int(time.time() * 1000)}",
        "city": city,
        "country": country,
        "temperature": temp,
        "condition": condition,
        "timestamp": int(time.time()),
        "formatted_time": datetime.datetime.now().strftime("%d %b, %I:%M %p")
    }

    if Config.ENABLE_DYNAMODB:
        try:
            import boto3 # type: ignore
            dynamodb = boto3.resource("dynamodb", region_name=Config.AWS_REGION)
            table = dynamodb.Table(Config.DYNAMODB_TABLE_NAME)
            table.put_item(Item=entry)
            return
        except Exception as e:
            logger.warning(f"DynamoDB write failed, falling back to local file: {e}")

    try:
        history = []
        if os.path.exists(Config.LOCAL_HISTORY_FILE):
            with open(Config.LOCAL_HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        # Avoid consecutive duplicate city entries
        if history and history[0].get("city", "").lower() == city.lower():
            history[0] = entry
        else:
            history.insert(0, entry)
        history = history[:30]  # keep last 30
        with open(Config.LOCAL_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving history locally: {e}")


# ==========================================
# WEATHER INTELLIGENCE RULE ENGINE
# ==========================================

def generate_weather_insights(current: Dict[str, Any], daily: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generates rule-based contextual lifestyle & safety insights based on live forecast telemetry."""
    insights = []
    
    temp = current.get("temperature", 24)
    apparent_temp = current.get("apparent_temperature", temp)
    humidity = current.get("humidity", 50)
    wind_speed = current.get("wind_speed", 10)
    rain_prob = daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0
    uv_index = daily.get("uv_index_max", [0])[0] if daily.get("uv_index_max") else 0
    weather_code = current.get("weather_code", 0)

    # 1. Rain & Precipitation Advice
    if rain_prob >= 50 or weather_code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]:
        insights.append({
            "type": "rain",
            "category": "Precipitation Alert",
            "title": "High Probability of Rain",
            "message": f"Precipitation probability is elevated at {rain_prob}%. Carry an umbrella and plan travel with caution.",
            "icon": "umbrella",
            "badge_color": "cyan"
        })
    elif rain_prob >= 25:
        insights.append({
            "type": "rain",
            "category": "Precipitation Notice",
            "title": "Chance of Light Showers",
            "message": f"Spotty showers possible ({rain_prob}% probability). Keep a compact umbrella handy.",
            "icon": "cloud-drizzle",
            "badge_color": "blue"
        })

    # 2. UV Index Guidance
    if uv_index >= 8:
        insights.append({
            "type": "uv",
            "category": "UV Radiation Advisory",
            "title": "Very High UV Levels",
            "message": f"Maximum UV index is {uv_index}. Use SPF 50+ sunscreen, wear polarized sunglasses, and seek shade between 11 AM - 4 PM.",
            "icon": "sun",
            "badge_color": "red"
        })
    elif uv_index >= 5:
        insights.append({
            "type": "uv",
            "category": "UV Guidance",
            "title": "Moderate to High UV Index",
            "message": f"Peak UV index reaches {uv_index}. Protective eyewear and sun hats recommended for prolonged outdoor exposure.",
            "icon": "sun",
            "badge_color": "amber"
        })

    # 3. Temperature & Hydration
    if temp >= 33 or apparent_temp >= 35:
        insights.append({
            "type": "heat",
            "category": "Thermal Comfort",
            "title": "High Heat Index Detected",
            "message": f"Feels like {apparent_temp:.1f}°C. Maintain optimal hydration, consume electrolytes, and prioritize cool indoor spaces.",
            "icon": "thermometer-sun",
            "badge_color": "amber"
        })
    elif temp <= 14:
        insights.append({
            "type": "cold",
            "category": "Thermal Comfort",
            "title": "Chilly Atmosphere",
            "message": f"Ambient temperature is {temp:.1f}°C. Layered thermal clothing or jackets recommended for early morning and evening.",
            "icon": "thermometer-snowflake",
            "badge_color": "indigo"
        })

    # 4. Wind Speed
    if wind_speed >= 35:
        insights.append({
            "type": "wind",
            "category": "Aerodynamic Activity",
            "title": "Gusty Winds Active",
            "message": f"Wind speeds are elevated at {wind_speed:.1f} km/h. Secure loose outdoor fixtures and exercise care on two-wheelers.",
            "icon": "wind",
            "badge_color": "violet"
        })

    # 5. Humidity Index
    if humidity >= 80:
        insights.append({
            "type": "humidity",
            "category": "Moisture Index",
            "title": "High Relative Humidity",
            "message": f"Relative humidity stands at {humidity}%. Atmospheric moisture may cause sweat to evaporate slower.",
            "icon": "droplets",
            "badge_color": "teal"
        })

    # Fallback insight if conditions are calm
    if not insights:
        insights.append({
            "type": "general",
            "category": "Optimal Conditions",
            "title": "Pleasant Weather Outlook",
            "message": f"Mild temperature ({temp:.1f}°C) and favorable conditions across the region. Excellent for outdoor activities.",
            "icon": "check-circle",
            "badge_color": "green"
        })

    return insights


# ==========================================
# GEOCODING & OPEN-METEO FETCHER
# ==========================================

def geocode_city(city_name: str) -> Optional[Dict[str, Any]]:
    """Geocodes a human city name to latitude, longitude and country using Open-Meteo Geocoding API."""
    params = {
        "name": city_name.strip(),
        "count": 5,
        "language": "en",
        "format": "json"
    }
    
    try:
        response = requests.get(Config.GEOCODING_API_URL, params=params, timeout=Config.REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            if results:
                top = results[0]
                return {
                    "name": top.get("name"),
                    "latitude": top.get("latitude"),
                    "longitude": top.get("longitude"),
                    "country": top.get("country", ""),
                    "country_code": top.get("country_code", ""),
                    "admin1": top.get("admin1", ""),
                    "timezone": top.get("timezone", "auto")
                }
    except requests.exceptions.Timeout:
        logger.error(f"Geocoding request timed out for city: {city_name}")
    except Exception as e:
        logger.error(f"Geocoding error for {city_name}: {e}")
    return None


def fetch_open_meteo_weather(lat: float, lon: float, timezone: str = "auto") -> Optional[Dict[str, Any]]:
    """Queries Open-Meteo forecast API for current weather, hourly forecast and 7-day daily forecast."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "cloud_cover",
            "pressure_msl",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m"
        ],
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",
            "apparent_temperature",
            "precipitation_probability",
            "weather_code",
            "pressure_msl",
            "cloud_cover",
            "visibility",
            "wind_speed_10m"
        ],
        "daily": [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "sunrise",
            "sunset",
            "uv_index_max",
            "precipitation_probability_max",
            "wind_speed_10m_max"
        ],
        "timezone": timezone
    }
    
    try:
        response = requests.get(Config.FORECAST_API_URL, params=params, timeout=Config.REQUEST_TIMEOUT)
        if response.status_code == 200:
            return response.json()
    except requests.exceptions.Timeout:
        logger.error(f"Weather forecast request timed out for {lat},{lon}")
    except Exception as e:
        logger.error(f"Weather forecast request failed: {e}")
    return None


# Helper for wind direction degrees to cardinal compass string
def get_cardinal_direction(deg: float) -> str:
    val = int((deg / 22.5) + 0.5)
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return directions[val % 16]


# ==========================================
# FLASK ROUTE HANDLERS
# ==========================================

@app.route("/")
def index():
    """Serves the primary Skycast single-page dashboard."""
    instance_meta = detect_aws_metadata()
    return render_template("index.html", instance=instance_meta, default_city=Config.DEFAULT_CITY)


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Application Health Check Endpoint.
    Used by AWS Application Load Balancer Target Group health checks.
    """
    uptime = time.time() - SERVER_START_TIME
    instance_meta = detect_aws_metadata()
    
    return jsonify({
        "status": "healthy",
        "app": Config.APP_NAME,
        "version": Config.APP_VERSION,
        "uptime_seconds": round(uptime, 2),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "aws_metadata": instance_meta
    }), 200


@app.route("/api/instance", methods=["GET"])
def instance_info():
    """Returns detected AWS EC2 IMDSv2 metadata or Local Development fallback info."""
    return jsonify(detect_aws_metadata()), 200


@app.route("/api/weather", methods=["GET"])
def get_weather():
    """
    Primary endpoint for current weather conditions, 8 metric cards,
    and rule-based weather insights for a specified city.
    """
    city_name = request.args.get("city", Config.DEFAULT_CITY).strip()
    if not city_name:
        return jsonify({"error": "City parameter is required"}), 400

    # Step 1: Geocode
    geo = geocode_city(city_name)
    if not geo:
        return jsonify({
            "error": f"City '{city_name}' could not be located. Please check spelling or try another major city."
        }), 404

    # Step 2: Query Weather
    raw = fetch_open_meteo_weather(geo["latitude"], geo["longitude"], geo.get("timezone", "auto"))
    if not raw:
        return jsonify({
            "error": "Failed to fetch live weather telemetry from Open-Meteo. Please check network connection."
        }), 502

    current = raw.get("current", {})
    daily = raw.get("daily", {})
    hourly = raw.get("hourly", {})

    weather_code = current.get("weather_code", 0)
    wmo_info = get_weather_info(weather_code)

    # Calculate Dew Point from hourly or approximation
    dew_point = hourly.get("dew_point_2m", [None])[0] if hourly.get("dew_point_2m") else None
    if dew_point is None:
        t = current.get("temperature_2m", 20)
        rh = current.get("relative_humidity_2m", 50)
        dew_point = round(t - ((100 - rh) / 5), 1)

    # Visibility from hourly
    visibility_m = hourly.get("visibility", [10000])[0] if hourly.get("visibility") else 10000
    visibility_km = round(visibility_m / 1000.0, 1)

    # UV Index
    uv_max = daily.get("uv_index_max", [0])[0] if daily.get("uv_index_max") else 0

    # Format sunrise / sunset
    sunrise_str = daily.get("sunrise", [""])[0] if daily.get("sunrise") else ""
    sunset_str = daily.get("sunset", [""])[0] if daily.get("sunset") else ""
    sunrise_display = sunrise_str.split("T")[-1] if "T" in sunrise_str else sunrise_str
    sunset_display = sunset_str.split("T")[-1] if "T" in sunset_str else sunset_str

    current_data = {
        "temperature": current.get("temperature_2m"),
        "apparent_temperature": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_speed": current.get("wind_speed_10m"),
        "wind_direction": current.get("wind_direction_10m"),
        "wind_cardinal": get_cardinal_direction(current.get("wind_direction_10m", 0)),
        "pressure": current.get("pressure_msl", current.get("surface_pressure", 1013.25)),
        "cloud_cover": current.get("cloud_cover", 0),
        "visibility": visibility_km,
        "dew_point": round(dew_point, 1),
        "uv_index": uv_max,
        "is_day": current.get("is_day", 1),
        "weather_code": weather_code,
        "condition": wmo_info["condition"],
        "icon": wmo_info["icon"],
        "description": wmo_info["description"],
        "temp_max": daily.get("temperature_2m_max", [current.get("temperature_2m")])[0],
        "temp_min": daily.get("temperature_2m_min", [current.get("temperature_2m")])[0],
        "sunrise": sunrise_display,
        "sunset": sunset_display,
        "raw_sunrise": sunrise_str,
        "raw_sunset": sunset_str,
        "rain_probability": daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0
    }

    # Generate Rule-Based Insights
    insights = generate_weather_insights(current_data, daily)

    # Save to search history asynchronously
    save_history_entry(
        city=geo["name"],
        country=geo["country"],
        temp=current_data["temperature"],
        condition=current_data["condition"]
    )

    return jsonify({
        "city": geo["name"],
        "country": geo["country"],
        "region": geo.get("admin1", ""),
        "coordinates": {
            "latitude": geo["latitude"],
            "longitude": geo["longitude"]
        },
        "timezone": geo.get("timezone"),
        "current": current_data,
        "insights": insights,
        "instance_info": detect_aws_metadata(),
        "queried_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }), 200


@app.route("/api/forecast", methods=["GET"])
def get_forecast():
    """
    Returns 24-hour hourly forecast and 7-day daily forecast
    including dataset arrays for Chart.js analytics graphs.
    """
    city_name = request.args.get("city", Config.DEFAULT_CITY).strip()
    if not city_name:
        return jsonify({"error": "City parameter is required"}), 400

    geo = geocode_city(city_name)
    if not geo:
        return jsonify({"error": f"City '{city_name}' could not be located."}), 404

    raw = fetch_open_meteo_weather(geo["latitude"], geo["longitude"], geo.get("timezone", "auto"))
    if not raw:
        return jsonify({"error": "Failed to fetch forecast telemetry from Open-Meteo."}), 502

    hourly = raw.get("hourly", {})
    daily = raw.get("daily", {})

    # Extract 24-hour forecast from current hour onwards
    hourly_times = hourly.get("time", [])
    now_iso = datetime.datetime.now().strftime("%Y-%m-%dT%H:00")
    
    start_idx = 0
    for idx, t in enumerate(hourly_times):
        if t >= now_iso:
            start_idx = idx
            break
            
    end_idx = min(start_idx + 24, len(hourly_times))

    hourly_list = []
    for i in range(start_idx, end_idx):
        t_raw = hourly_times[i]
        # format hour as 02:00 PM
        hour_display = t_raw.split("T")[-1] if "T" in t_raw else t_raw
        try:
            parsed = datetime.datetime.strptime(t_raw, "%Y-%m-%dT%H:%M")
            hour_display = parsed.strftime("%I %p")
        except Exception:
            pass

        code = hourly.get("weather_code", [0])[i] if i < len(hourly.get("weather_code", [])) else 0
        wmo = get_weather_info(code)

        hourly_list.append({
            "time_iso": t_raw,
            "time_display": hour_display,
            "temperature": hourly.get("temperature_2m", [0])[i] if i < len(hourly.get("temperature_2m", [])) else 0,
            "humidity": hourly.get("relative_humidity_2m", [0])[i] if i < len(hourly.get("relative_humidity_2m", [])) else 0,
            "rain_probability": hourly.get("precipitation_probability", [0])[i] if i < len(hourly.get("precipitation_probability", [])) else 0,
            "wind_speed": hourly.get("wind_speed_10m", [0])[i] if i < len(hourly.get("wind_speed_10m", [])) else 0,
            "weather_code": code,
            "condition": wmo["condition"],
            "icon": wmo["icon"]
        })

    # Extract 7-Day Forecast
    daily_times = daily.get("time", [])
    daily_list = []
    for i in range(min(7, len(daily_times))):
        d_raw = daily_times[i]
        try:
            d_obj = datetime.datetime.strptime(d_raw, "%Y-%m-%d")
            day_name = "Today" if i == 0 else d_obj.strftime("%a, %b %d")
            short_day = "Today" if i == 0 else d_obj.strftime("%a")
        except Exception:
            day_name = d_raw
            short_day = d_raw

        code = daily.get("weather_code", [0])[i] if i < len(daily.get("weather_code", [])) else 0
        wmo = get_weather_info(code)

        daily_list.append({
            "date": d_raw,
            "day_name": day_name,
            "short_day": short_day,
            "temp_max": daily.get("temperature_2m_max", [0])[i] if i < len(daily.get("temperature_2m_max", [])) else 0,
            "temp_min": daily.get("temperature_2m_min", [0])[i] if i < len(daily.get("temperature_2m_min", [])) else 0,
            "rain_probability": daily.get("precipitation_probability_max", [0])[i] if i < len(daily.get("precipitation_probability_max", [])) else 0,
            "uv_index": daily.get("uv_index_max", [0])[i] if i < len(daily.get("uv_index_max", [])) else 0,
            "wind_speed_max": daily.get("wind_speed_10m_max", [0])[i] if i < len(daily.get("wind_speed_10m_max", [])) else 0,
            "sunrise": daily.get("sunrise", [""])[i] if i < len(daily.get("sunrise", [])) else "",
            "sunset": daily.get("sunset", [""])[i] if i < len(daily.get("sunset", [])) else "",
            "weather_code": code,
            "condition": wmo["condition"],
            "icon": wmo["icon"]
        })

    # Prepare 4 Analytics Datasets (Next 24 Hours)
    analytics = {
        "labels": [h["time_display"] for h in hourly_list],
        "temperature": [h["temperature"] for h in hourly_list],
        "humidity": [h["humidity"] for h in hourly_list],
        "wind_speed": [h["wind_speed"] for h in hourly_list],
        "precipitation_probability": [h["rain_probability"] for h in hourly_list]
    }

    return jsonify({
        "city": geo["name"],
        "country": geo["country"],
        "hourly": hourly_list,
        "daily": daily_list,
        "analytics": analytics
    }), 200


@app.route("/api/history", methods=["GET", "POST"])
def search_history():
    """Retrieve or record search history."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        city = data.get("city")
        if not city:
            return jsonify({"error": "City is required"}), 400
        save_history_entry(
            city=city,
            country=data.get("country", ""),
            temp=data.get("temperature", 0.0),
            condition=data.get("condition", "Clear")
        )
        return jsonify({"status": "recorded"}), 201

    limit = int(request.args.get("limit", 15))
    history = get_history_entries(limit=limit)
    return jsonify({
        "history": history,
        "storage": "DynamoDB" if Config.ENABLE_DYNAMODB else "Local JSON Storage"
    }), 200


@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    """Clear local search history."""
    try:
        with open(Config.LOCAL_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return jsonify({"status": "cleared"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# APPLICATION ENTRYPOINT
# ==========================================

if __name__ == "__main__":
    logger.info(f"Starting {Config.APP_NAME} v{Config.APP_VERSION} on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
