#!/bin/bash

info() {
  echo -e "\033[1;36m[INFO]\033[0m \033[1;37m$1\033[0m"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m \033[1;37m$1\033[0m"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m \033[1;37m$1\033[0m"
  exit 1
}

highlight() {
  echo -e "\033[1;34m$1\033[0m"
}

separator() {
  echo -e "\033[1;37m═══════════════════════════════════════════════════════════════════\033[0m"
}

check_dependency() {
  command -v $1 >/dev/null 2>&1 || { echo -e "\033[1;31m$1 is required but not installed. Please install it to continue.\033[0m"; exit 1; }
}

update_system() {
  info "Updating system package list for the latest packages..."
  sudo apt update -y -q && success "System package list updated successfully!" || error "Failed to update the package list."
}

install_dependencies() {
  info "Installing required dependencies..."
  check_dependency curl
  check_dependency git
  check_dependency node
  check_dependency npm
  sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https -q > /dev/null
  success "Essential dependencies installed."
}

install_caddy() {
  info "Installing Caddy server..."
  (
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.debian.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  ) &

  sudo apt update -y -q > /dev/null
  sudo apt install -y caddy -q > /dev/null
  wait
  success "Caddy installed successfully!"
}

create_caddyfile() {
  info "Setting up Caddy configuration for secure HTTPS reverse proxy..."
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
  success "Caddyfile configuration complete!"
}

start_caddy() {
  info "Testing Caddy configuration and starting Caddy..."
  sudo caddy fmt /etc/caddy/Caddyfile > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    success "Caddy configuration is valid."
  else
    error "Caddy configuration test failed. Please check the configuration."
  fi
  sudo systemctl enable caddy -q > /dev/null
  sudo systemctl restart caddy -q > /dev/null
  success "Caddy is running with HTTPS and WebSocket support for incoming requests!"
}

install_pm2() {
  info "Installing PM2 globally for managing the app server..."
  sudo npm install -g pm2 -q > /dev/null
  pm2 startup -u $(whoami) --no-pager > /dev/null
  success "PM2 installed and configured to start on boot."
}

install_app_dependencies() {
  info "Installing app dependencies..."
  cd $APP_DIR
  npm install --silent > /dev/null
  success "App dependencies installed."
}

setup_git_auto_update() {
  info "Setting up Git auto-update script..."
  cat <<EOF | sudo tee /usr/local/bin/update-app.sh > /dev/null
#!/bin/bash
cd $APP_DIR
git reset --hard
git pull --quiet
npm install --silent
pm2 restart all
EOF
  sudo chmod +x /usr/local/bin/update-app.sh
  echo "*/5 * * * * root /usr/local/bin/update-app.sh" | sudo tee -a /etc/crontab > /dev/null
  success "Auto-update script set to run every 5 minutes."
}

start_app_server() {
  info "Starting the app server with PM2..."
  pm2 start index.mjs --no-daemon > /dev/null
  pm2 save > /dev/null
  success "App server is now managed by PM2 and will start on reboot."
}

finish_setup() {
  success "🚀 Setup complete! Your app is live and fully configured with HTTPS support, WebSocket, and automatic updates! 🚀"
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

update_system
install_dependencies
install_caddy
create_caddyfile
start_caddy
install_pm2
install_app_dependencies
setup_git_auto_update
start_app_server

finish_setup
