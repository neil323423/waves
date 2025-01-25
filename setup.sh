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

info "Creating Caddyfile..."
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
success "Caddy started."
separator

info "Setting up PM2..."
sudo npm install -g pm2 > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
separator

info "Installing dependencies..."
npm install > /dev/null 2>&1
separator

info "Setting up Git auto-update..."
cat <<EOF | sudo tee /usr/local/bin/update-app.sh > /dev/null
#!/bin/bash
git reset --hard
git pull
npm install --silent
pm2 restart all
EOF

sudo chmod +x /usr/local/bin/update-app.sh
echo "*/1 * * * * root /usr/local/bin/update-app.sh" | sudo tee -a /etc/crontab > /dev/null
success "Auto-update set to run every 1 minute."
separator

info "Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
pm2 save > /dev/null 2>&1
success "Server started."
separator

success "Setup completed."
separator
