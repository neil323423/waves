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
  printf "\n\033[1;37m---------------------------------------------\033[0m\n\n"
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

if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
fi

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && source "$NVM_DIR/nvm.sh"
else
  source "$NVM_DIR/nvm.sh"
fi

nvm install node --reinstall-packages-from=node

success "Node.js installed/updated via nvm."

separator

CADDY_BIN="$HOME/.local/bin/caddy"

if [ ! -x "$CADDY_BIN" ]; then
  mkdir -p "$HOME/.local/bin"
  curl -L https://github.com/caddyserver/caddy/releases/latest/download/caddy_linux_amd64.tar.gz -o /tmp/caddy.tar.gz
  tar -xzf /tmp/caddy.tar.gz -C /tmp
  mv /tmp/caddy "$CADDY_BIN"
  chmod +x "$CADDY_BIN"
  rm /tmp/caddy.tar.gz
fi

curl -L https://github.com/caddyserver/caddy/releases/latest/download/caddy_linux_amd64.tar.gz -o /tmp/caddy.tar.gz
tar -xzf /tmp/caddy.tar.gz -C /tmp
mv /tmp/caddy "$CADDY_BIN"
chmod +x "$CADDY_BIN"
rm /tmp/caddy.tar.gz

success "Caddy installed/updated locally."

separator

CADDYFILE_DIR="$HOME/.caddy"
mkdir -p "$CADDYFILE_DIR"

cat <<EOF > "$CADDYFILE_DIR/Caddyfile"
{
    email sefiicc@gmail.com
}

:8080 {
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

success "Caddyfile created locally."

separator

if "$CADDY_BIN" fmt "$CADDYFILE_DIR/Caddyfile" > /dev/null 2>&1; then
  success "Caddyfile is valid."
else
  error "Caddyfile test failed. Exiting."
  exit 1
fi

separator

pkill -f "$CADDY_BIN" 2>/dev/null

nohup "$CADDY_BIN" run --config "$CADDYFILE_DIR/Caddyfile" > "$HOME/.caddy/caddy.log" 2>&1 &
sleep 2

if pgrep -f "$CADDY_BIN" > /dev/null; then
  success "Caddy started."
else
  error "Failed to start Caddy."
  exit 1
fi

separator

if ! command -v pm2 > /dev/null 2>&1; then
  npm install -g pm2
else
  npm update -g pm2
fi

success "PM2 installed/updated."

separator

npm install && npm update

success "Dependencies installed/updated."

separator

pm2 start index.mjs --name "server" || pm2 restart "server"
pm2 save

success "Server started and saved with PM2."

separator

nohup bash -c 'while true; do 
  git fetch origin
  LOCAL=$(git rev-parse main)
  REMOTE=$(git rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then 
    git pull origin main && pm2 restart "server" && pm2 save
  fi
  sleep 1
done' > /dev/null 2>&1 &

success "Git auto-update setup completed."

separator

success "Setup completed."

separator
