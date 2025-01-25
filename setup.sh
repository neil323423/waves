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

info "Installing Caddy..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https > /dev/null 2>&1
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.debian.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update -y > /dev/null 2>&1
sudo apt install -y caddy > /dev/null 2>&1
separator

info "Creating Caddyfile to listen on port 443 for any incoming request..."
sudo mkdir -p /etc/caddy

cat <<EOF | sudo tee /etc/caddy/Caddyfile > /dev/null
{
    email sefiicc@gmail.com
}

:443 {
    tls {
        on_demand  
    }

    reverse_proxy http://localhost:3000  
    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer"
    }
}
EOF

info "Testing Caddy configuration..."
sudo caddy fmt /etc/caddy/Caddyfile > /dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Caddyfile is valid."
else
  error "Caddyfile test failed. Exiting."
  exit 1
fi

info "Starting Caddy..."
sudo systemctl enable caddy > /dev/null 2>&1
sudo systemctl restart caddy > /dev/null 2>&1
success "Caddy is running with HTTPS and WebSocket support for any incoming requests!"
separator

info "Installing PM2 globally and configuring it to start on boot..."
sudo npm install -g pm2 > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
separator

info "Installing dependencies for your app..."
cd $APP_DIR
npm install > /dev/null 2>&1
separator

info "Setting up Git auto-update script..."
cat <<EOF | sudo tee /usr/local/bin/update-app.sh > /dev/null
#!/bin/bash
cd $APP_DIR
git reset --hard
git pull
npm install --silent
pm2 restart all
EOF

sudo chmod +x /usr/local/bin/update-app.sh
echo "*/5 * * * * root /usr/local/bin/update-app.sh" | sudo tee -a /etc/crontab > /dev/null
success "Auto-update script set to run every 5 minutes."
separator

info "Starting the app server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
pm2 save > /dev/null 2>&1
success "App server is now managed by PM2 and will start automatically on reboot."
separator

success "🎉 Setup complete! Your app is live and listening for any incoming HTTPS requests! 🎉"
separator
