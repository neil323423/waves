#!/bin/bash

info() { 
  printf "\033[1;36m[INFO]\033[0m %s\n" "$1"; 
}

success() { 
  printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$1"; 
}

error() { 
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"; 
}

highlight() { 
  printf "\033[1;34m%s\033[0m\n" "$1"; 
}

separator() { 
  printf "\033[1;37m---------------------------------------------\033[0m\n"; 
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

info "Checking if Node.js and npm are installed..."

if ! command -v node >/dev/null 2>&1; then
  info "Node.js not found. Installing..."
  apt update -y && apt install -y nodejs npm
  success "Node.js and npm installed successfully."
else
  success "Node.js and npm are already installed."
fi

separator

info "Checking if Caddy is installed..."

if ! command -v caddy >/dev/null 2>&1; then
  info "Caddy not found. Installing..."
  apt install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/caddy-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" > /etc/apt/sources.list.d/caddy.list
  apt update -y && apt install -y caddy
  success "Caddy installed successfully."
else
  success "Caddy is already installed."
fi

separator

info "Creating a Caddyfile at /etc/caddy/Caddyfile..."

cat <<EOF > /etc/caddy/Caddyfile
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

chmod 644 /etc/caddy/Caddyfile

separator

info "Testing Caddy configuration..."

if caddy adapt --config /etc/caddy/Caddyfile --adapter caddyfile > /dev/null 2>&1; then
  success "Caddyfile is valid."
else
  error "Caddyfile test failed. Exiting."
  exit 1
fi

info "Starting Caddy..."

caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

success "Caddy reloaded with new configuration."

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &

success "Caddy started using /etc/caddy/Caddyfile."

separator

info "Checking if PM2 is installed..."

if ! command -v pm2 &> /dev/null; then
  info "PM2 not found. Installing..."
  npm install -g pm2
  success "PM2 installed successfully."
else
  success "PM2 is already installed."
fi

separator

info "Installing dependencies..."

npm install

success "Dependencies installed."

separator

info "Starting the server with PM2..."

pm2 start index.mjs
pm2 save

success "Server started and saved with PM2."

separator

info "Setting up Git auto-update..."

nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse main)
    REMOTE=\$(git rev-parse origin/main)
    if [ \$LOCAL != \$REMOTE ]; then
        git pull origin main
        pm2 restart index.mjs
        pm2 save
    fi
    sleep 1
done
" > /dev/null 2>&1 &

success "Git auto-update setup completed."

separator

success "Setup completed."

separator