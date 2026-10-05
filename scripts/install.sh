#!/bin/bash
# Hook AfterInstall de CodeDeploy: instala Node.js (si falta) y deja la app como servicio systemd.
set -e
APP_DIR=/home/ubuntu/app

if ! command -v node >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nodejs npm
fi

cd "$APP_DIR"
npm install --omit=dev --no-audit --no-fund || true   # la app no tiene dependencias externas

# Servicio systemd: la app escucha en el puerto 80 (CAP_NET_BIND_SERVICE evita usar root)
sudo tee /etc/systemd/system/datavision.service >/dev/null <<UNIT
[Unit]
Description=DataVision Analytics
After=network.target

[Service]
User=ubuntu
WorkingDirectory=$APP_DIR
Environment=PORT=80
ExecStart=$(command -v node) $APP_DIR/server.js
Restart=always
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable datavision
sudo systemctl restart datavision
