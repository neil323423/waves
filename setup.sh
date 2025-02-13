#!/bin/bash

info() {
  printf "\033[1;36m[INFO]\033[0m %s\n" "$1"
}

success() {
  printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$1"
}

error() {
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"
}

highlight() {
  printf "\033[1;34m%s\033[0m\n" "$1"
}

separator() {
  printf "\033[1;37m---------------------------------------------\033[0m\n"
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

########################
# Check / Install Node.js via nvm
########################
info "Checking if Node.js is installed..."
if ! command -v node >/dev/null 2>&1; then
  info "Node.js not found. Installing via nvm..."
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  else
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  nvm install node
  success "Node.js installed successfully using nvm."
else
  success "Node.js is already installed."
fi
separator

########################
# Check / Install Caddy locally
########################
info "Checking if Caddy is installed..."
if ! command -v caddy >/dev/null 2>&1; then
  info "Caddy not found. Installing locally..."
  mkdir -p "$HOME/.local/bin"
  if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
  fi

  CADDY_VERSION="2.7.4"
  DOWNLOAD_URL="https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_amd64.tar.gz"
  
  curl -sL -o "$HOME/.local/bin/caddy.tar.gz" "$DOWNLOAD_URL"
  if [ $? -ne 0 ]; then
    error "Failed to download Caddy."
    exit 1
  fi

  TMP_DIR=$(mktemp -d)
  tar -xzf "$HOME/.local/bin/caddy.tar.gz" -C "$TMP_DIR"
  CADDY_BIN=$(find "$TMP_DIR" -type f -name caddy | head -n 1)
  if [ -n "$CADDY_BIN" ]; then
    mv "$CADDY_BIN" "$HOME/.local/bin/caddy"
    chmod +x "$HOME/.local/bin/caddy"
    rm -rf "$TMP_DIR"
    rm "$HOME/.local/bin/caddy.tar.gz"
    success "Caddy installed locally in $HOME/.local/bin."
  else
    error "Failed to locate caddy binary in the downloaded archive."
    exit 1
  fi
else
  success "Caddy is already installed."
fi
separator

########################
# Create Caddy configuration file
########################
info "Creating Caddyfile..."
mkdir -p "$HOME/.config/caddy"
cat <<EOF > "$HOME/.config/caddy/Caddyfile"
{
    email sefiicc@gmail.com
}

:8443 {
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
separator

########################
# Test and start Caddy
########################
info "Testing Caddy configuration..."
caddy fmt "$HOME/.config/caddy/Caddyfile" >/dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Caddyfile is valid."
else
  error "Caddyfile test failed. Exiting."
  exit 1
fi

info "Starting Caddy in the background..."
nohup caddy run --config "$HOME/.config/caddy/Caddyfile" --adapter caddyfile >/dev/null 2>&1 &
# Optionally, you might want to store the process ID or check that it started.
success "Caddy started."
separator

########################
# Check / Install PM2
########################
info "Checking if PM2 is installed..."
if ! command -v pm2 >/dev/null 2>&1; then
  info "PM2 not found. Installing using npm..."
  npm install -g pm2 >/dev/null 2>&1
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

########################
# Install Node.js project dependencies
########################
info "Installing project dependencies..."
npm install >/dev/null 2>&1
success "Dependencies installed."
separator

########################
# Start the server with PM2
########################
info "Starting the server with PM2..."
pm2 start index.mjs >/dev/null 2>&1
pm2 save >/dev/null 2>&1
success "Server started and saved with PM2."
separator

########################
# Setup Git auto-update loop
########################
info "Setting up Git auto-update..."
nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse main 2>/dev/null)
    REMOTE=\$(git rev-parse origin/main 2>/dev/null)

    if [ \"\$LOCAL\" != \"\$REMOTE\" ]; then
        git pull origin main >/dev/null 2>&1
        pm2 restart index.mjs >/dev/null 2>&1
        pm2 save >/dev/null 2>&1
    fi
    sleep 1
done
" >/dev/null 2>&1 &
success "Git auto-update setup completed."
separator

success "Setup completed."
separator
