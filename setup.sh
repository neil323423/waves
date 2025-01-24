#!/bin/bash

info() {
  echo -e "\033[1;36m[INFO]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
}

highlight() {
  echo -e "\033[1;34m$1\033[0m"
}

separator() {
  echo -e "\033[1;37m---------------------------------------------\033[0m"
}

clear

highlight "██╗    ██╗ █████╗ ██╗   ██╗███████╗███████╗"
highlight "██║    ██║██╔══██╗██║   ██║██╔════╝██╔════╝"
highlight "██║ █╗ ██║███████║██║   ██║█████╗  ███████╗"
highlight "██║███╗██║██╔══██║╚██╗ ██╔╝██╔══╝  ╚════██║"
highlight "╚███╔███╔╝██║  ██║ ╚████╔╝ ███████╗███████║██╗"
highlight " ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚══════╝╚═╝"                                         

separator
info "Starting the setup process..."
separator

info "Updating package lists..."
sudo apt update -y > /dev/null 2>&1
separator

info "Installing Node.js and npm..."
sudo apt install -y nodejs npm > /dev/null 2>&1
separator

info "Installing necessary dependencies and packages for Waves..."
npm install > /dev/null 2>&1
sudo apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
separator

info "Please enter your domain or subdomain (e.g., example.com or subdomain.example.com):"
read -p "Domain/Subdomain: " DOMAIN

if [ -z "$DOMAIN" ]; then
  error "No domain or subdomain entered. Exiting."
  separator
  exit 1
fi

if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  error "Invalid domain or subdomain. Please enter a valid domain."
  separator
  exit 1
fi

info "Requesting SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN
if [ $? -ne 0 ]; then
  error "Failed to obtain SSL certificate for $DOMAIN. Check DNS settings or try again."
  exit 1
fi
separator

success "SSL configuration completeed for $DOMAIN!"
separator

info "Configuring Nginx..."
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

info "Setting up automatic updates for Git changes..."
nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse main)
    REMOTE=\$(git rev-parse origin/main)

    if [ \$LOCAL != \$REMOTE ]; then
        echo \"Changes detected, pulling the latest updates...\"
        git pull origin main
        sudo systemctl reload nginx
    fi
    sleep 10
done
" &> /updates.log &
separator

info "Installing PM2 globally and configuring it to start on boot..."
sudo npm install pm2 -g > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
separator

info "Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
separator

success "🎉 Congratulations! Your setup is complete, and your domain is now live with Waves! 🎉"
separator