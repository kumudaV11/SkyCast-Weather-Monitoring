# SKYCAST — Automated Testing & Verification Documentation

## 1. Overview & Testing Strategy

To guarantee academic and production robustness, **SKYCAST** was subjected to an exhaustive quality assurance (QA) pipeline covering:
1. **Backend Unit Testing**: Validating endpoint status codes, JSON payload integrity, and header values.
2. **Integration Testing**: Verifying live communication with Open-Meteo Geocoding and Forecast endpoints.
3. **IMDSv2 Resilience Testing**: Ensuring that running outside an AWS environment triggers immediate local mode fallback without latency or crashes.
4. **Error Handling & Negative Testing**: Confirming appropriate HTTP 400 and HTTP 404 responses for malformed or missing parameters.
5. **Cross-Browser & Visual Layout Testing**: Validating responsive typography, Chart.js canvas painting, and CSS glassmorphism rendering.

---

## 2. Test Execution Matrix

| Test ID | Test Category | Target Component | Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Unit | `GET /api/health` | Query health probe for ALB target group | HTTP 200, status "healthy", uptime > 0 | **PASS** |
| **TC-02** | Unit | `GET /api/instance` | Check IMDSv2 / Local Dev detection | HTTP 200, valid environment dict | **PASS** |
| **TC-03** | Integration | `GET /api/weather` | Fetch weather for "Bengaluru" | HTTP 200, coordinates, current temp, 8 metrics | **PASS** |
| **TC-04** | Negative | `GET /api/weather` | Query with missing city (`?city=`) | HTTP 400, `{ "error": "City parameter is required" }` | **PASS** |
| **TC-05** | Negative | `GET /api/weather` | Query with non-existent city | HTTP 404, descriptive not-found error message | **PASS** |
| **TC-06** | Integration | `GET /api/forecast` | Fetch 24h & 7d datasets for "Bengaluru" | HTTP 200, hourly list (24), daily list (7) | **PASS** |
| **TC-07** | State | `POST /api/history` | Record new city search entry | HTTP 201, status "recorded" | **PASS** |
| **TC-08** | State | `GET /api/history` | Retrieve saved search queries | HTTP 200, array of recent queries | **PASS** |
| **TC-09** | Helper | `get_weather_info()`| Test WMO code mapping for Clear & Storm | Returns correct condition string and Lucide icon | **PASS** |
| **TC-10** | Frontend | Responsive UI | Test mobile viewport (375px) vs desktop (1440px)| Sidebar collapses, grid shifts to 1-col, charts scale | **PASS** |

---

## 3. How to Run the Automated Test Suite

From the project root directory, run:

```bash
# Using Python's built-in test runner
python -m unittest discover tests/ -v
```

Or using `pytest`:
```bash
pytest tests/ -v
```

---

## 4. Test Verification Sample Output

```
test_default_page_render (tests.test_app.SkycastTestCase.test_default_page_render) ... ok
test_forecast_endpoint (tests.test_app.SkycastTestCase.test_forecast_endpoint) ... ok
test_health_endpoint (tests.test_app.SkycastTestCase.test_health_endpoint) ... ok
test_instance_metadata_endpoint (tests.test_app.SkycastTestCase.test_instance_metadata_endpoint) ... ok
test_search_history_endpoints (tests.test_app.SkycastTestCase.test_search_history_endpoints) ... ok
test_weather_endpoint_invalid_city (tests.test_app.SkycastTestCase.test_weather_endpoint_invalid_city) ... ok
test_weather_endpoint_missing_city (tests.test_app.SkycastTestCase.test_weather_endpoint_missing_city) ... ok
test_weather_endpoint_valid_city (tests.test_app.SkycastTestCase.test_weather_endpoint_valid_city) ... ok
test_wmo_weather_code_mapping (tests.test_app.SkycastTestCase.test_wmo_weather_code_mapping) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.842s

OK
```
