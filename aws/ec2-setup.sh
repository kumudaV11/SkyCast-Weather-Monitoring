#!/usr/bin/env bash
# ==============================================================================
# SKYCAST — Production AWS EC2 Provisioning Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS (ap-south-1 Mumbai)
# Purpose: Complete automated provisioning from S3 source to live service.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# STEP 0: Configuration & Comprehensive Logging
# ------------------------------------------------------------------------------
LOG_FILE="/var/log/skycast-setup.log"
mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

trap 'echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [ERROR] Provisioning failed at line $LINENO with exit code $?" >&2' ERR

echo "======================================================================"
echo " [$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting SKYCAST EC2 Provisioning"
echo "======================================================================"

# Set S3_SOURCE to your S3 URI (s3://bucket/file.zip) or S3 Presigned URL
# Example: S3_SOURCE="s3://my-skycast-bucket/SKYCAST_AWS_WEATHER_DASHBOARD.zip"
# Example: S3_SOURCE="https://my-skycast-bucket.s3.ap-south-1.amazonaws.com/..."
S3_SOURCE="https://skycast-weather-1.s3.ap-southeast-2.amazonaws.com/Skycase_Anti.zip?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEH0aDmFwLXNvdXRoZWFzdC0yIkcwRQIhAJ4J9FC2NYI1yJZnqV0eKMV1UB8BGmceqMYh8cq0ZVaxAiA6i0%2BNfgYySN5RAuB4bY5lnjbD3iL2mi8trPcKLRS2Ryq2CAhGEAAaDDEzMzg1NzE2NTk2NSIM4gZyWKqG%2FCEvXBFxKpMIjAiTEo87alNkKxDbdxmsUgRTJAdKKTEc0WbK3BaYTOgg54syW3%2FdZ%2BruVAmMu5T3WB%2FLDZAgmUXAWUOevdX%2B212nUQ0GWhfvtH5S3UdZNRRz51BHGcw7Vf5zPfrzptAl7ARRn8awTSB1c0v2TJ1YiYAZh7gJj9ubvKb011z5vHMPB7k8rxqln8YTbpoR4r5WudPiu2OGyeJ0gYdLQF38ZK9gqF%2FuFYs5Fux%2BxhgAEXglp8KsUDCmc8yyd%2Bh6IblfRNSibVETs9sRvgCLVozP%2Bco4BtjJ%2F%2BN5lyPYYM79V%2BW9Cz25ktHN6LdaIRheKPi41tziYTiIJkAsZROM2oowsR6589G8w1DYNGt8%2FV112GvAfycbz1vS4xfVe1AW0Z%2Bq7QQAjj6og2dDBqqcFOp44BayB%2BbFb7I%2BNTI0Y2%2Fz%2B0cPqVUHHykV873TbUeT3bmrJxEXfu6SecyVQY1rY8Qn2EgGKCBXsnJWiHi%2FG3MkiLmRNeNScQD7WPB%2B6%2BQ07r9IAez73BcBgcsuigPe47lp5ewPqi3IuAm7iYo9Fq7FO44Px29fv91xwdWt5DCwiXaup%2FBSMYOl%2FDZqh3ofarZvrPM%2F703Cka%2FMglJ0yQm3Y2RG9%2B7u4jlQoeyiQVO6zGRZGc0LIUo3Wsqra7BUWnXjnYxiufM1xD92dlHcZotC99UpuUHpYvl0Ds%2Bquxmby0l4Hi9bJJLBgtWPYMNp9WeGRunYOr5SM%2B5auRGGedVrx1vXXGszeFJQbdm4%2Fz%2FlH%2FfupSWxMPMrM%2F%2FatHib5R89fYzq%2FErX98pLcL51nE%2BZju2knWz2XAbrIj6a7isLRpZEhjnTfXGl06%2Bleoj1XWLYBdpCkM85IWbUEYusHM5A%2Bc7SzYAjqRMfA6LFA7SpWUf5Fix1xDCdD2hR%2F6FZrOhurkMUMY1jKeq46Ts%2F%2BWX0o0nDLocnBERo5ol5ieMP8E04U57bBGY7T04832qBAjzYyAF%2B4p17lwMDQ1HzPtC0L1N7hTS5aEJrx5xDGOVXSczP6NHpJ4zFsMZQ4e8EZRhjSJkIpwJT%2FKqcs616Yn3OWHaE34WKzGeXxpn65zr6BpBqhB8vTkIYBS25tlmOcBkS4NZsg5RsdlGLO779zc6DYNNBCZapZnKdF20q%2Bk8QNUofznAn6rzrXp0mGGLkcr89LuPHw6DMpD%2FFeygd%2Bl%2BlVqJYC9SAM6vxQicX3qids1n4bgjXQZdcj9%2BL%2Fjv%2FZZkV5LjNl6Z2Lzcjzh1F3b8x2ktGHKEEk7wNZotmFz4BWc1WjxEUg0UGQw4D0dFK4M1RzxufvZcpl%2FDSVPQngc0rl35WIAhZeAIObjGt4ejUDsCcgqcrxaR%2Fo1Js9IW8eYZZmIhU%2Bp81IWH29dy9fVYnm9ezVWUwn82V1wY6zgKH3L21NfsWOYJwyzkiYY9zqLsrZyjHHYYzU97w0o6RYjWy8CEDbKN7zl0bfP7Q0BFcK4rKSxDTSnUYOV4wWpkhCJOUV%2BuFn2pjgcYMxZH%2F8Z%2FnuyAoOiqQSze09yNicKg9xr3sTOui82nRsY6zH4rYh85OwXmS94KgQxOaLZR%2FhX6x8V1vWNw6LqSwMdWurFPlC3uoUBVOLkEINtGoPLqz%2FnnIy7h%2F0aBuHx8IzhODFSGr5cU9wsV6VhEXrsOSHnwddARqrdbCFzs%2Fab9El4gZKCw%2Fc2DilRcrefBIFGSSwcny36HyrH0wXYKovRaUjIJBHrFNtfkA5nO%2FEFGnliUl9kHNJB3rUUmo6lX%2BPkrdyyWwU%2FXYYeQ9KZRfh1t0gWo6qy2kdvQfzvyA%2BzudN7WAByYbL0%2FG7wRjTOYTu6TQ2ABky%2F0UwlV2YUxsUN6D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAR6KUCIKGZ55Q27I2%2F20261031%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Date=20261031T044737Z&X-Amz-Expires=7200&X-Amz-SignedHeaders=host&X-Amz-Signature=b20e82f5433d57f2632e7a92061dbb5075b9d0a25daf81c39b96c8b77ed89a34"

if [[ -z "$S3_SOURCE" ]]; then
    echo "[ERROR] S3_SOURCE variable is not set. Please supply S3_SOURCE in User Data." >&2
    echo "Usage: S3_SOURCE=\"s3://your-bucket-name/skycast.zip\" or presigned URL" >&2
    exit 1
fi

echo "[INFO] Deployment package source: $S3_SOURCE"

# ------------------------------------------------------------------------------
# STEP 1: OS Updates & Dependency Installation
# ------------------------------------------------------------------------------
echo "[INFO] Updating package repositories and installing core dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3-pip python3-venv python3-dev nginx curl jq unzip awscli

# ------------------------------------------------------------------------------
# STEP 2: Dedicated System User & Directory Setup
# ------------------------------------------------------------------------------
echo "[INFO] Setting up system user and deployment directory..."
if ! id -u skycast > /dev/null 2>&1; then
    useradd -m -s /bin/bash skycast
fi

APP_DIR="/var/www/skycast"
mkdir -p "$APP_DIR"
chown -R skycast:skycast "$APP_DIR"

# ------------------------------------------------------------------------------
# STEP 3: Download & Verify Project Package from S3
# ------------------------------------------------------------------------------
ZIP_DEST="/tmp/skycast.zip"
rm -f "$ZIP_DEST"

echo "[INFO] Downloading application archive from S3..."
if [[ "$S3_SOURCE" =~ ^s3:// ]]; then
    aws s3 cp "$S3_SOURCE" "$ZIP_DEST"
else
    # Download via curl with HTTP failure detection and retry support
    curl -fsSL --retry 3 --retry-delay 2 "$S3_SOURCE" -o "$ZIP_DEST"
fi

# Verify the downloaded archive exists and is non-empty
if [[ ! -s "$ZIP_DEST" ]]; then
    echo "[ERROR] Downloaded archive $ZIP_DEST is missing or zero bytes." >&2
    exit 1
fi

# Verify zip archive integrity
if ! unzip -tq "$ZIP_DEST" > /dev/null 2>&1; then
    echo "[ERROR] $ZIP_DEST is corrupted or not a valid ZIP file." >&2
    exit 1
fi

echo "[INFO] Archive integrity verified successfully."

# ------------------------------------------------------------------------------
# STEP 4: Extract & Structure Project Files
# ------------------------------------------------------------------------------
echo "[INFO] Extracting archive into $APP_DIR..."
unzip -o -q "$ZIP_DEST" -d "$APP_DIR"
rm -f "$ZIP_DEST"

# If the archive wrapped files inside an inner folder, flatten them into $APP_DIR
if [[ ! -f "$APP_DIR/app.py" ]]; then
    INNER_DIR=$(find "$APP_DIR" -mindepth 1 -maxdepth 1 -type d -exec test -e "{}/app.py" ';' -print -quit)
    if [[ -n "$INNER_DIR" ]]; then
        echo "[INFO] Detected nested project folder at $INNER_DIR. Flattening into $APP_DIR..."
        cp -r "$INNER_DIR/." "$APP_DIR/"
        rm -rf "$INNER_DIR"
    fi
fi

# Strict check: app.py and config.py must exist directly in $APP_DIR
if [[ ! -f "$APP_DIR/app.py" ]] || [[ ! -f "$APP_DIR/config.py" ]]; then
    echo "[ERROR] Required application entrypoints (app.py, config.py) not found in $APP_DIR." >&2
    ls -la "$APP_DIR" >&2
    exit 1
fi

chown -R skycast:skycast "$APP_DIR"
echo "[INFO] Application directory contents verified."

# ------------------------------------------------------------------------------
# STEP 5: Python Virtual Environment & Dependencies
# ------------------------------------------------------------------------------
echo "[INFO] Creating isolated Python virtual environment..."
sudo -u skycast python3 -m venv "$APP_DIR/.venv"
sudo -u skycast "$APP_DIR/.venv/bin/pip" install --upgrade pip --quiet

if [[ -f "$APP_DIR/requirements.txt" ]]; then
    echo "[INFO] Installing requirements from $APP_DIR/requirements.txt..."
    sudo -u skycast "$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt" gunicorn --quiet
else
    echo "[WARNING] requirements.txt not found. Installing default production stack..."
    sudo -u skycast "$APP_DIR/.venv/bin/pip" install Flask requests python-dotenv boto3 gunicorn --quiet
fi

# Verify WSGI entrypoint callable
sudo -u skycast "$APP_DIR/.venv/bin/python" -c "from app import app; assert callable(app), 'app object not callable'"
echo "[INFO] WSGI entrypoint app:app verified."

# ------------------------------------------------------------------------------
# STEP 6: Configure & Start Systemd Service (Gunicorn)
# ------------------------------------------------------------------------------
echo "[INFO] Configuring systemd service unit..."
cat << 'EOF' > /etc/systemd/system/skycast.service
[Unit]
Description=SKYCAST Weather Intelligence Flask Service
After=network.target

[Service]
User=skycast
Group=www-data
WorkingDirectory=/var/www/skycast
Environment="PATH=/var/www/skycast/.venv/bin"
Environment="PORT=5000"
Environment="FLASK_DEBUG=0"
ExecStart=/var/www/skycast/.venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:5000 \
    --timeout 30 \
    --access-logfile /var/log/skycast/access.log \
    --error-logfile /var/log/skycast/error.log \
    app:app

Restart=always
RestartSec=5
KillMode=mixed
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/log/skycast
chown -R skycast:www-data /var/log/skycast

systemctl daemon-reload
systemctl enable skycast
systemctl restart skycast

# Verify Gunicorn service is active
sleep 2
if ! systemctl is-active --quiet skycast; then
    echo "[ERROR] skycast.service failed to activate. Systemd status and journal logs:" >&2
    systemctl status skycast --no-pager >&2
    journalctl -u skycast -n 40 --no-pager >&2
    exit 1
fi
echo "[INFO] skycast.service is active and running."

# ------------------------------------------------------------------------------
# STEP 7: Configure & Start Nginx Reverse Proxy
# ------------------------------------------------------------------------------
echo "[INFO] Configuring Nginx reverse proxy..."
cat << 'EOF' > /etc/nginx/sites-available/skycast
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 10M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Static Assets Direct Serving
    location /static/ {
        alias /var/www/skycast/static/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # ALB Target Group Health Check
    location /api/health {
        proxy_pass http://127.0.0.1:5000/api/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # Main Application Reverse Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/skycast /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verify Nginx configuration syntax
nginx -t

systemctl restart nginx

# Verify Nginx service is active
if ! systemctl is-active --quiet nginx; then
    echo "[ERROR] Nginx failed to activate. Journal logs:" >&2
    journalctl -u nginx -n 40 --no-pager >&2
    exit 1
fi
echo "[INFO] Nginx reverse proxy is active."

# ------------------------------------------------------------------------------
# STEP 8: End-to-End Local Health Verification
# ------------------------------------------------------------------------------
echo "[INFO] Verifying local health endpoint through Gunicorn (:5000)..."
curl -fsS http://127.0.0.1:5000/api/health > /dev/null

echo "[INFO] Verifying public port 80 health endpoint through Nginx..."
HEALTH_RES=$(curl -fsS http://127.0.0.1/api/health)
echo "[INFO] Health check response: $HEALTH_RES"

echo "======================================================================"
echo " [$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SKYCAST PROVISIONING COMPLETED SUCCESSFULLY"
echo "======================================================================"
