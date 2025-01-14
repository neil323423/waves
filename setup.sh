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

clear

separator
info "Starting the setup process..."
separator

info "Step 1: Updating package lists..."
sudo apt update -y > /dev/null 2>&1
separator

info "Step 2: Installing Node.js..."
sudo apt install -y nodejs > /dev/null 2>&1
separator

info "Step 3: Installing nescessary dependencies for waves...
npm install > /dev/null 2>&1
sudo apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
separator

info "Step 4: Please enter your subdomain (e.g., subdomain.example.com):"
read -p "Subdomain: " SUBDOMAIN

if [ -z "$SUBDOMAIN" ]; then
  error "No subdomain entered. Exiting."
  separator
  exit 1
fi

info "Step 5: Requesting SSL certificate for $SUBDOMAIN..."
sudo certbot --nginx -d $SUBDOMAIN
separator

success "SSL configuration complete for $SUBDOMAIN!"
separator

info "Step 6: Running config.sh..."
sudo bash /sh/config.sh > /dev/null 2>&1
separator

info "Step 7: Running updates.sh..."
sudo nohup bash /sh/updates.sh &> /updates.log &
separator

info "Step 8: Installing PM2 globally and configuring it to start on boot..."
sudo npm install pm2 -g > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
separator

info "Step 9: Starting the application with PM2..."
pm2 start index.mjs > /dev/null 2>&1
separator

success "🎉 Congratulations! Your setup is complete, and your domain is now live with Waves! 🎉 You can now safely close this terminal."
separator