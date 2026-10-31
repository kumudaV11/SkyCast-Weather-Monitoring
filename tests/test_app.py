"""
SKYCAST Automated Test Suite
Validates backend endpoints, error handling, IMDSv2 fallback, and history storage.
"""

import unittest
import json
from app import app
from config import Config, detect_aws_metadata, get_weather_info

class SkycastTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app.config["TESTING"] = True

    def test_health_endpoint(self):
        """Test GET /api/health endpoint returns status healthy and HTTP 200."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["app"], Config.APP_NAME)
        self.assertIn("uptime_seconds", data)
        self.assertIn("aws_metadata", data)

    def test_instance_metadata_endpoint(self):
        """Test GET /api/instance returns valid metadata dictionary."""
        response = self.client.get("/api/instance")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("is_aws", data)
        self.assertIn("environment", data)
        self.assertIn("instance_id", data)
        self.assertIn("availability_zone", data)

    def test_default_page_render(self):
        """Test GET / renders HTML with default city and dashboard elements."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        html_content = response.data.decode("utf-8")
        self.assertIn("SKYCAST", html_content)
        self.assertIn("Weather Intelligence", html_content)

    def test_weather_endpoint_valid_city(self):
        """Test GET /api/weather?city=Bengaluru returns live weather data."""
        response = self.client.get("/api/weather?city=Bengaluru")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("city", data)
        self.assertIn("current", data)
        self.assertIn("temperature", data["current"])
        self.assertIn("humidity", data["current"])
        self.assertIn("wind_speed", data["current"])
        self.assertIn("insights", data)
        self.assertIsInstance(data["insights"], list)

    def test_weather_endpoint_missing_city(self):
        """Test GET /api/weather with empty city returns 400 error."""
        response = self.client.get("/api/weather?city=")
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_weather_endpoint_invalid_city(self):
        """Test GET /api/weather with invalid non-existent city returns 404."""
        response = self.client.get("/api/weather?city=thiscitydoesnotexistanywhere12345")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_forecast_endpoint(self):
        """Test GET /api/forecast?city=Bengaluru returns 24h hourly and 7d daily."""
        response = self.client.get("/api/forecast?city=Bengaluru")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("hourly", data)
        self.assertIn("daily", data)
        self.assertIn("analytics", data)
        self.assertGreater(len(data["hourly"]), 0)
        self.assertGreater(len(data["daily"]), 0)
        self.assertIn("temperature", data["analytics"])

    def test_search_history_endpoints(self):
        """Test POST /api/history and GET /api/history."""
        # 1. Post a new search entry
        test_payload = {
            "city": "Tokyo",
            "country": "Japan",
            "temperature": 18.5,
            "condition": "Clear Sky"
        }
        post_res = self.client.post(
            "/api/history",
            data=json.dumps(test_payload),
            content_type="application/json"
        )
        self.assertEqual(post_res.status_code, 201)

        # 2. Get history and check presence
        get_res = self.client.get("/api/history")
        self.assertEqual(get_res.status_code, 200)
        data = json.loads(get_res.data)
        self.assertIn("history", data)
        self.assertGreater(len(data["history"]), 0)

    def test_wmo_weather_code_mapping(self):
        """Test WMO mapping helper returns appropriate conditions."""
        clear = get_weather_info(0)
        self.assertEqual(clear["condition"], "Clear Sky")
        self.assertEqual(clear["icon"], "sun")

        thunder = get_weather_info(95)
        self.assertEqual(thunder["condition"], "Thunderstorm")
        self.assertEqual(thunder["icon"], "cloud-lightning")

if __name__ == "__main__":
    unittest.main()
