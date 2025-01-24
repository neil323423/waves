#!/bin/bash

info() {
  echo -e "\033[1;34m$1\033[0m"
}

success() {
  echo -e "\033[1;32m$1\033[0m"
}

error() {
  echo -e "\033[1;31m$1\033[0m"
}

separator() {
  echo -e "\033[1;37m---------------------------------------------\033[0m"
}

branch="main"

clear
separator
info "Starting the setup process..."
separator

info "Step 1: Updating package lists..."
sudo apt update -y > /dev/null 2>&1
separator

info "Step 2: Installing Node.js and npm..."
sudo apt install -y nodejs npm > /dev/null 2>&1
separator

info "Step 3: Installing necessary dependencies and packages for Waves..."
npm install > /dev/null 2>&1
sudo apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
separator

info "Step 4: Please enter your domain or subdomain (e.g., example.com or subdomain.example.com):"
read -p "Domain/Subdomain: " DOMAIN

if [ -z "$DOMAIN" ]; then
  error "No domain or subdomain entered. Exiting."
  separator
  exit 1
fi

info "Step 5: Requesting SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN
separator

success "SSL configuration complete for $DOMAIN!"
separator

info "Step 6: Configuring Nginx..."
NginxConfigFile="/etc/nginx/sites-available/default"
BackupConfigFile="/etc/nginx/sites-available/default.bak"
DhparamFile="/etc/ssl/certs/dhparam.pem"

sudo cp $NginxConfigFile $BackupConfigFile

if [ ! -f "$DhparamFile" ]; then
    info "Diffie-Hellman parameters file not found, generating it..."
    sudo openssl dhparam -out $DhparamFile 2048 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        success "Diffie-Hellman parameters generated successfully."
    else
        error "Failed to generate Diffie-Hellman parameters."
        exit 1
    fi
else
    info "Diffie-Hellman parameters file already exists."
fi

cat <<EOF | sudo tee $NginxConfigFile > /dev/null
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        access_log /var/log/nginx/access.log combined;
    }
}
EOF

sudo nginx -t > /dev/null 2>&1
if [ $? -eq 0 ]; then
    success "Nginx configuration is valid."
else
    error "Nginx configuration test failed. Restoring backup..."
    sudo cp $BackupConfigFile $NginxConfigFile
    exit 1
fi

sudo systemctl reload nginx
success "Nginx reloaded successfully."
separator

info "Step 7: Setting up automatic updates for Git changes..."
nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse $branch)
    REMOTE=\$(git rev-parse origin/$branch)

    if [ \$LOCAL != \$REMOTE ]; then
        echo \"Changes detected, pulling the latest updates...\"
        git pull origin $branch
        sudo systemctl reload nginx
    fi
    sleep 10
done
" &> /updates.log &
separator

info "Step 8: Installing PM2 globally and configuring it to start on boot..."
sudo npm install pm2 -g > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
separator

info "Step 9: Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
separator

success "🎉 Congratulations! Your setup is complete, and your domain is now live with Waves! 🎉"
separator
