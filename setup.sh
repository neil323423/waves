#!/bin/bash

info() { printf "\033[1;36m[INFO]\033[0m %s\n" "$1"; }
success() { printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$1"; }
error() { printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"; }
highlight() { printf "\033[1;34m%s\033[0m\n" "$1"; }
separator() { printf "\033[1;37m---------------------------------------------\033[0m\n"; }

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

info "Checking if Node.js and npm are installed..."
if ! command -v node &> /dev/null; then
  info "Node.js not found. Installing..."
  sudo apt update -y > /dev/null 2>&1
  sudo apt install -y nodejs npm > /dev/null 2>&1
  success "Node.js and npm installed successfully."
else
  success "Node.js and npm are already installed."
fi
separator

info "Checking if Caddy is installed..."
if ! command -v caddy &> /dev/null; then
  info "Caddy not found. Installing..."
  sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https > /dev/null 2>&1
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg > /dev/null 2>&1
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.debian.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
  sudo apt update -y > /dev/null 2>&1
  sudo apt install -y caddy > /dev/null 2>&1
  success "Caddy installed successfully."
else
  success "Caddy is already installed."
fi
separator

info "Creating Caddy configuration..."
mkdir -p ~/caddy
cat <<EOF > ~/caddy/caddyconf
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
        X-Frame-Options "ALLOWALL" 
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer"
    }
}
EOF
chmod 644 ~/caddy/caddyconf
separator

info "Testing Caddy configuration..."
caddy fmt ~/caddy/caddyconf > /dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Caddy configuration is valid."
else
  error "Caddy configuration test failed. Exiting."
  exit 1
fi

info "Starting Caddy..."
caddy run --config ~/caddy/caddyconf --adapter caddyfile > /dev/null 2>&1 &
success "Caddy started."
separator

info "Checking if PM2 is installed..."
if ! command -v pm2 &> /dev/null; then
  info "PM2 not found. Installing..."
  sudo npm install -g pm2 > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    success "PM2 installed successfully."
  else
    error "Failed to install PM2."
    exit 1
  fi
else
  success "PM2 is already installed."
fi
separator

info "Installing dependencies..."
npm install > /dev/null 2>&1
success "Dependencies installed."
separator

info "Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
pm2 save > /dev/null 2>&1
success "Server started and saved with PM2."
separator

info "Setting up Git auto-update..."
nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse main)
    REMOTE=\$(git rev-parse origin/main)

    if [ \$LOCAL != \$REMOTE ]; then
        git pull origin main > /dev/null 2>&1
        pm2 restart index.mjs > /dev/null 2>&1
        pm2 save > /dev/null 2>&1
    fi
    sleep 1
done
" > /dev/null 2>&1 &
success "Git auto-update setup completed."
separator

success "Setup completed."
separator