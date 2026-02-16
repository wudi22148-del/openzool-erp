#!/bin/bash
# Download and deploy frontend from GitHub

echo "=========================================="
echo "  Deploying Frontend from GitHub"
echo "=========================================="
echo ""

# Step 1: Download dist.zip from GitHub
echo "[1/5] Downloading dist.zip from GitHub..."
cd /tmp
rm -f dist.zip
wget https://github.com/wudi22148-del/openzool-erp/raw/main/apps/web-antd/dist.zip

if [ ! -f dist.zip ]; then
    echo "ERROR: Failed to download dist.zip"
    exit 1
fi

echo "OK - Downloaded successfully"
echo ""

# Step 2: Create deployment directory
echo "[2/5] Preparing deployment directory..."
mkdir -p /var/www/openzool-erp
cd /var/www/openzool-erp

echo "OK - Directory ready"
echo ""

# Step 3: Extract files
echo "[3/5] Extracting files..."
unzip -o /tmp/dist.zip
rm /tmp/dist.zip

echo "OK - Files extracted"
echo ""

# Step 4: Set permissions
echo "[4/5] Setting permissions..."
chown -R www-data:www-data /var/www/openzool-erp

echo "OK - Permissions set"
echo ""

# Step 5: Configure Nginx
echo "[5/5] Configuring Nginx..."

cat > /etc/nginx/sites-available/openzool-erp << 'EOF'
server {
    listen 80;
    server_name zoolco.com www.zoolco.com 68.183.230.252;

    root /var/www/openzool-erp;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5320/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/openzool-erp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "OK - Nginx configured and reloaded"
else
    echo "ERROR - Nginx configuration failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Deployment Completed!"
echo "=========================================="
echo ""
echo "Access your application:"
echo "  Frontend: http://zoolco.com"
echo "  Backend API: http://zoolco.com/api"
echo ""
echo "Default Login:"
echo "  Username: vben"
echo "  Password: 123456"
echo ""
