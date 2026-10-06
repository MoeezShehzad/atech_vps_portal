#!/bin/bash
set -e

# 1. Update Nginx if needed
sudo nginx -t
sudo systemctl reload nginx

# 2. Build frontend
cd ~/atech_vps_portal/public
npm run build

# 3. Start or reload PM2 backend
cd ~/atech_vps_portal
pm2 reload atech-portal --update-env || pm2 start server.js --name atech-portal
pm2 save

echo "==============================="
echo "  ATECH PORTAL ONLINE & READY  "
echo "==============================="
