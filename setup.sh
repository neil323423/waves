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
if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
  info "Node.js or npm not found. Installing..."
  sudo apt-get update -y > /dev/null 2>&1
  sudo apt-get install -y nodejs npm > /dev/null 2>&1
  if ! command -v node &>/dev/null && command -v nodejs &>/dev/null; then
    sudo ln -s "$(command -v nodejs)" /usr/bin/node
  fi
  success "Node.js and npm installed successfully."
else
  success "Node.js and npm are already installed."
fi
separator
if ! command -v caddy &>/dev/null; then
  info "Caddy not found. Installing..."
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https > /dev/null 2>&1
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg > /dev/null 2>&1
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.debian.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
  sudo apt-get update -y > /dev/null 2>&1
  sudo apt-get install -y caddy > /dev/null 2>&1
  success "Caddy installed successfully."
else
  success "Caddy is already installed."
fi
separator
info "Creating caddyconf at /usr/local/etc/caddy/caddyconf..."
sudo mkdir -p /usr/local/etc/caddy
sudo chown "$(id -u):$(id -g)" /usr/local/etc/caddy
cat <<EOF | sudo tee /usr/local/etc/caddy/caddyconf > /dev/null
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
sudo chmod 644 /usr/local/etc/caddy/caddyconf
separator
USE_SYSTEMD=0
if [ "$(cat /proc/1/comm 2>/dev/null)" = "systemd" ]; then USE_SYSTEMD=1; fi
if [ "$USE_SYSTEMD" -eq 1 ] && command -v systemctl &>/dev/null; then
  info "Configuring Caddy to use systemd..."
  sudo mkdir -p /etc/systemd/system/caddy.service.d
  cat <<EOF | sudo tee /etc/systemd/system/caddy.service.d/override.conf > /dev/null
[Service]
ExecStart=
ExecStart=/usr/bin/caddy run --environ --config /usr/local/etc/caddy/caddyconf
EOF
  sudo systemctl daemon-reload
  info "Testing Caddy configuration..."
  sudo caddy fmt /usr/local/etc/caddy/caddyconf > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    success "caddyconf is valid."
  else
    error "caddyconf test failed. Exiting."
    exit 1
  fi
  info "Restarting Caddy..."
  sudo systemctl restart caddy > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    success "Caddy restarted using systemd."
  else
    error "Failed to restart Caddy via systemd."
    exit 1
  fi
else
  info "Testing Caddy configuration..."
  /usr/bin/caddy fmt /usr/local/etc/caddy/caddyconf > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    success "caddyconf is valid."
  else
    error "caddyconf test failed. Exiting."
    exit 1
  fi
  info "Starting Caddy directly..."
  nohup /usr/bin/caddy run --environ --config /usr/local/etc/caddy/caddyconf > /var/log/caddy.log 2>&1 &
  sleep 2
  success "Caddy started directly."
fi
separator
if ! command -v pm2 &>/dev/null; then
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
nohup bash -c "while true; do git fetch origin; LOCAL=\$(git rev-parse main); REMOTE=\$(git rev-parse origin/main); if [ \"\$LOCAL\" != \"\$REMOTE\" ]; then git pull origin main > /dev/null 2>&1; pm2 restart index.mjs > /dev/null 2>&1; pm2 save > /dev/null 2>&1; fi; sleep 1; done" > /dev/null 2>&1 &
success "Git auto-update setup completed."
separator
success "Setup completed."
separator