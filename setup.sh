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
export PATH="$HOME/bin:$PATH"
highlight "██╗    ██╗ █████╗ ██╗   ██╗███████╗███████╗"
highlight "██║    ██║██╔══██╗██║   ██║██╔════╝██╔════╝"
highlight "██║ █╗ ██║███████║██║   ██║█████╗  ███████╗"
highlight "██║███╗██║██╔══██║╚██╗ ██╔╝██╔══╝  ╚════██║"
highlight "╚███╔███╔╝██║  ██║ ╚████╔╝ ███████╗███████║██╗"
highlight " ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚══════╝╚═╝"
separator
info "Starting the setup process..."
separator
info "Checking if Node.js is installed..."
if ! command -v node >/dev/null 2>&1; then
  info "Node.js not found. Installing via nvm..."
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  else
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  nvm install --lts
  success "Node.js installed via nvm."
else
  success "Node.js is already installed."
fi
separator
info "Checking if Caddy is installed locally..."
if ! command -v caddy >/dev/null 2>&1; then
  info "Caddy not found. Installing locally..."
  mkdir -p "$HOME/bin"
  cd "$HOME" || { error "Cannot change directory to \$HOME"; exit 1; }
  curl -sfL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o caddy.tar.gz
  if [ $? -ne 0 ]; then
    error "Failed to download Caddy."
    exit 1
  fi
  tar -xzf caddy.tar.gz caddy 2>/dev/null
  if [ ! -f "caddy" ]; then
    error "Caddy binary not found in the archive."
    exit 1
  fi
  mv caddy "$HOME/bin/caddy"
  chmod +x "$HOME/bin/caddy"
  rm caddy.tar.gz
  success "Caddy installed locally in \$HOME/bin."
else
  success "Caddy is already installed."
fi
separator
info "Creating local Caddyfile..."
mkdir -p "$HOME/.caddy"
cat <<'EOF' > "$HOME/.caddy/Caddyfile"
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
info "Testing Caddy configuration..."
"$HOME/bin/caddy" fmt "$HOME/.caddy/Caddyfile" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Caddyfile is valid."
else
  error "Caddyfile test failed. Exiting."
  exit 1
fi
info "Starting Caddy..."
nohup "$HOME/bin/caddy" run --config "$HOME/.caddy/Caddyfile" > /dev/null 2>&1 &
sleep 2
if pgrep -f "caddy run" > /dev/null 2>&1; then
  success "Caddy started."
else
  error "Failed to start Caddy."
  exit 1
fi
separator
info "Checking if PM2 is installed..."
if ! command -v pm2 >/dev/null 2>&1; then
  info "PM2 not found. Installing via npm..."
  npm install -g pm2 > /dev/null 2>&1
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
info "Installing Node.js dependencies..."
npm install > /dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Dependencies installed."
else
  error "npm install failed. Exiting."
  exit 1
fi
separator
info "Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1
pm2 save > /dev/null 2>&1
if [ $? -eq 0 ]; then
  success "Server started and saved with PM2."
else
  error "Failed to start the server with PM2."
  exit 1
fi
separator
info "Setting up Git auto-update..."
nohup bash -c "
while true; do
    git fetch origin
    LOCAL=\$(git rev-parse main)
    REMOTE=\$(git rev-parse origin/main)
    if [ \"\$LOCAL\" != \"\$REMOTE\" ]; then
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
