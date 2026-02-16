#!/bin/bash

# OpenZool ERP Backend-Only Deployment Script
# For servers with limited memory

set -e

echo "========================================"
echo "  OpenZool ERP Backend Deployment"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# 1. Update system
echo -e "${YELLOW}[1/7] Updating system...${NC}"
apt-get update -qq
echo -e "${GREEN}OK${NC}"

# 2. Install Node.js 20
echo ""
echo -e "${YELLOW}[2/7] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}OK - Node.js $(node --version)${NC}"

# 3. Install Git
echo ""
echo -e "${YELLOW}[3/7] Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi
echo -e "${GREEN}OK - Git $(git --version)${NC}"

# 4. Install pnpm
echo ""
echo -e "${YELLOW}[4/7] Installing pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
echo -e "${GREEN}OK - pnpm $(pnpm --version)${NC}"

# 5. Clone/Update project
echo ""
echo -e "${YELLOW}[5/7] Cloning/Updating project...${NC}"
cd /root
if [ -d "openzool-erp" ]; then
    echo "Project exists, updating..."
    cd openzool-erp
    git pull
else
    git clone https://github.com/wudi22148-del/openzool-erp.git
    cd openzool-erp
fi
echo -e "${GREEN}OK${NC}"

# 6. Install backend dependencies only
echo ""
echo -e "${YELLOW}[6/7] Installing backend dependencies...${NC}"
cd /root/openzool-erp/apps/backend-mock
export NODE_OPTIONS="--max-old-space-size=512"
pnpm install
echo -e "${GREEN}OK${NC}"

# 7. Clean up old services and start new one
echo ""
echo -e "${YELLOW}[7/7] Starting backend service...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Stop and delete old services
pm2 stop zool-erp 2>/dev/null || true
pm2 delete zool-erp 2>/dev/null || true
pm2 stop openzool-erp-backend 2>/dev/null || true
pm2 delete openzool-erp-backend 2>/dev/null || true

# Start backend
cd /root/openzool-erp/apps/backend-mock
pm2 start "pnpm start" --name openzool-erp-backend
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}OK${NC}"

# Configure firewall
echo ""
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 3004/tcp 2>/dev/null || true
echo -e "${GREEN}OK${NC}"

# Show status
echo ""
echo "========================================"
echo -e "${GREEN}  Backend Deployment Completed!${NC}"
echo "========================================"
echo ""
echo "Service Status:"
pm2 status
echo ""
echo "Backend API: http://68.183.230.252:3004"
echo ""
echo "Default Login:"
echo "  Username: vben"
echo "  Password: 123456"
echo ""
echo -e "${YELLOW}Note: Frontend build skipped due to memory constraints.${NC}"
echo -e "${YELLOW}You can build frontend locally and upload dist files.${NC}"
echo ""
