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
export CADDY_MAX_ON_DEMAND_CERTS=0

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
  info "Node.js not found. Installing..."
  apt-get update && apt-get install -y nodejs
  [ $? -eq 0 ] && success "Node.js installed." || { error "Failed to install Node.js."; exit 1; }
else
  success "Node.js is already installed."
fi
separator

info "Checking if Caddy is installed locally..."
if ! command -v caddy >/dev/null 2>&1; then
  info "Caddy not found. Installing locally..."
  mkdir -p "$HOME/bin"
  cd "$HOME" || { error "Cannot change directory to \$HOME"; exit 1; }
  curl -sfL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o "$HOME/bin/caddy"
  chmod +x "$HOME/bin/caddy"
  success "Caddy installed locally."
else
  success "Caddy is already installed."
fi

if [ "$(id -u)" -ne 0 ]; then
  info "Setting capability for binding to port 443..."
  command -v setcap >/dev/null 2>&1 && setcap 'cap_net_bind_service=+ep' "$HOME/bin/caddy"
  [ $? -eq 0 ] && success "Capability set." || error "Failed to set capability."
fi
separator

info "Starting inline ask endpoint..."
nohup python3 -m http.server 8080 > /dev/null 2>&1 &
success "Inline ask endpoint running on 127.0.0.1:8080."
separator

info "Creating local Caddyfile..."
mkdir -p "$HOME/.caddy"
cat <<'EOF' > "$HOME/.caddy/Caddyfile"
{
    email sefiicc@gmail.com
    on_demand_tls {
        ask http://127.0.0.1:8080/ask
    }
}

:80 {
    redir https://{host}{uri} permanent
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
separator

info "Testing Caddy configuration..."
"$HOME/bin/caddy" fmt --overwrite "$HOME/.caddy/Caddyfile" > /dev/null 2>&1
[ $? -eq 0 ] && success "Caddyfile formatted and valid." || { error "Caddyfile test failed."; exit 1; }

info "Starting Caddy..."
nohup "$HOME/bin/caddy" run --config "$HOME/.caddy/Caddyfile" > "$HOME/caddy.log" 2>&1 &
sleep 2
pgrep -f "caddy run" > /dev/null 2>&1 && success "Caddy started successfully." || { error "Failed to start Caddy."; exit 1; }
separator

info "Checking if PM2 is installed..."
if ! command -v pm2 >/dev/null 2>&1; then
  info "PM2 not found. Installing..."
  npm install -g pm2 > /dev/null 2>&1
  [ $? -eq 0 ] && success "PM2 installed." || { error "Failed to install PM2."; exit 1; }
else
  success "PM2 is already installed."
fi
separator

info "Installing Node.js dependencies..."
npm install > /dev/null 2>&1
[ $? -eq 0 ] && success "Dependencies installed." || { error "npm install failed."; exit 1; }
separator

info "Starting the server with PM2..."
pm2 start index.mjs > /dev/null 2>&1 && pm2 save > /dev/null 2>&1
[ $? -eq 0 ] && success "Server started with PM2." || { error "Failed to start server with PM2."; exit 1; }
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
