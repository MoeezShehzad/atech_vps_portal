#!/usr/bin/env bash
set -e

APP_DIR="/home/ubuntu/atech_vps_portal"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
cd "$APP_DIR"

# 1. Determine Machine IP:
# Either passed as argument: ./update_ip.sh 172.19.124.110
# Or auto-detected from active network interface:
INPUT_IP="$1"
if [ -n "$INPUT_IP" ]; then
    CURRENT_IP="$INPUT_IP"
else
    CURRENT_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7}' | tr -d '\n')
    if [ -z "$CURRENT_IP" ]; then
        CURRENT_IP=$(hostname -I | awk '{print $1}' | tr -d '\n')
    fi
fi

# 2. Determine Windows Host Gateway IP (default gateway on eth0):
HOST_GATEWAY=$(ip route | grep default | awk '{print $3}' | head -n 1 | tr -d '\n')
if [ -z "$HOST_GATEWAY" ]; then
    HOST_GATEWAY="172.19.112.1"
fi

echo "=========================================================="
echo " ATECH CLOUD VPS PORTAL - IP & CONFIGURATION RE-SYNC"
echo "=========================================================="
echo " Detected / Configured Machine IP : $CURRENT_IP"
echo " Detected Windows Host Gateway IP : $HOST_GATEWAY"
echo "=========================================================="

# 3. Generate .env file for the Ubuntu Portal
cat <<ENVEOF > "$APP_DIR/.env"
# Server Configuration
PORT=5000
HOST=0.0.0.0

# Database Configuration (Points to Windows Host SQL Server on Port 1433)
DATABASE_URL="sqlserver://${HOST_GATEWAY}:1433;database=atechconsult;user=atech_portal_user;password=admin@123;encrypt=true;trustServerCertificate=true"

# Hyper-V Host Agent URL (Windows Host on Port 5050)
HYPERV_HOST_URL=http://${HOST_GATEWAY}:5050

# JWT & Session Secrets
JWT_SECRET="super_secret_atech_vps_key_2026"
JWT_VERIFY_SECRET="your_super_secret_verify_key"
SESSION_SECRET="atech_vps_super_secret_session_key_2026_99x!"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="369485207582-d99elbgam5spalb22apu63vje1avu5gq.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Corporate Mail Suite Configuration (mail.atechconsult.com)
SMTP_HOST=mail.atechconsult.com
SMTP_PORT=465
SMTP_SECURE=true

# Support Desk
SMTP_SUPPORT_USER=customer-support@atechconsult.com
SMTP_SUPPORT_PASS="uTJ5+5CbUG"

# System & Transactional (Verification, Password Reset, Server Ready)
SMTP_NOREPLY_USER=no-reply@atechconsult.com
SMTP_NOREPLY_PASS="Q)9zVhm9BQ"

# Invoicing & Receipts
SMTP_BILLING_USER=billing@atechconsult.com
SMTP_BILLING_PASS="{tSvuZA9Wj"

# Infrastructure & Security Alerts
SMTP_ALERTS_USER=alerts@atechconsult.com
SMTP_ALERTS_PASS="yykFkq[55g"

# Networking / URLs
BACKEND_URL=http://${CURRENT_IP}:5000
FRONTEND_URL=http://${CURRENT_IP}:5174
CLIENT_URL=http://${CURRENT_IP}:5174
ENVEOF

# 4. Generate/Update public/.env
cat <<PUBENVEOF > "$APP_DIR/public/.env"
VITE_API_URL=http://${CURRENT_IP}:5000/api
VITE_WS_URL=ws://${CURRENT_IP}:5000
PUBENVEOF

# 5. Rebuild Prisma client
npx prisma generate

# 6. Restart PM2 services
echo "Restarting application processes with PM2..."
pm2 delete atech-backend 2>/dev/null || true
pm2 delete atech-frontend 2>/dev/null || true

# Start backend
cd "$APP_DIR"
pm2 start server.js --name "atech-backend" --time

# Start frontend (serve built dist or dev mode)
cd "$APP_DIR/public"
pm2 start npm --name "atech-frontend" -- run dev -- --host 0.0.0.0 --port 5174

# Save PM2 state for startup
pm2 save

echo ""
echo "=========================================================="
echo " SUCCESS! ATECH VPS PORTAL IS ONLINE & READY:"
echo " -> Portal Website : http://${CURRENT_IP}:5174"
echo " -> Backend API    : http://${CURRENT_IP}:5000"
echo " -> Hyper-V Host   : http://${HOST_GATEWAY}:5050"
echo "=========================================================="
