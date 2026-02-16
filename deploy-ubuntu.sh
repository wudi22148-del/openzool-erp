#!/bin/bash

# OpenZool ERP Deployment Script for Ubuntu/Linux
# Run this script on Ubuntu server

set -e

echo "========================================"
echo "  OpenZool ERP Deployment"
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
echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt-get update -qq
echo -e "${GREEN}OK${NC}"

# 2. Install Node.js 20
echo ""
echo -e "${YELLOW}[2/8] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}OK - Node.js $(node --version)${NC}"

# 3. Install Git
echo ""
echo -e "${YELLOW}[3/8] Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi
echo -e "${GREEN}OK - Git $(git --version)${NC}"

# 4. Install pnpm
echo ""
echo -e "${YELLOW}[4/8] Installing pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
echo -e "${GREEN}OK - pnpm $(pnpm --version)${NC}"

# 5. Clone project
echo ""
echo -e "${YELLOW}[5/8] Cloning project...${NC}"
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

# 6. Install dependencies
echo ""
echo -e "${YELLOW}[6/8] Installing dependencies...${NC}"
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm install
echo -e "${GREEN}OK${NC}"

# 7. Build frontend
echo ""
echo -e "${YELLOW}[7/8] Building frontend...${NC}"
pnpm build
echo -e "${GREEN}OK${NC}"

# 8. Install and start PM2
echo ""
echo -e "${YELLOW}[8/8] Starting services...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Stop old service
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
ufw allow 80/tcp 2>/dev/null || true
echo -e "${GREEN}OK${NC}"

# Show status
echo ""
echo "========================================"
echo -e "${GREEN}  Deployment Completed!${NC}"
echo "========================================"
echo ""
echo "Service Status:"
pm2 status
echo ""
echo "Access URLs:"
echo "  Backend: http://68.183.230.252:3004"
echo "  Frontend: http://68.183.230.252 (after Nginx setup)"
echo ""
echo "Default Login:"
echo "  Username: vben"
echo "  Password: 123456"
echo ""
