#!/usr/bin/env bash
# Portfolio deployment bootstrap. Run ONCE on a fresh Ubuntu 22.04/24.04 server as root.
#
#   curl -fsSL https://raw.githubusercontent.com/Davveravve/davidrajala.cc/main/scripts/server-bootstrap.sh | bash
#
# After it finishes, the site is live at https://davidrajala.cc and `git push origin main`
# will trigger an automatic deploy within 2 minutes.

set -euo pipefail

# --------------------------------------------------------------------- config
DOMAIN="davidrajala.cc"
REPO_URL="https://github.com/Davveravve/davidrajala.cc.git"
BRANCH="main"
APP_USER="app"
APP_DIR="/home/${APP_USER}/apps/portfolio"
DB_NAME="portfolio_prod"
DB_USER="portfolio"

NODE_MAJOR=22

log()  { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
die()  { printf "\033[1;31m✗ %s\033[0m\n" "$*"; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root (sudo bash $0)"

# ------------------------------------------------------------------- packages
log "Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt upgrade -yq
apt install -yq curl git build-essential ufw ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# Node 22 from NodeSource (idempotent)
if ! command -v node &>/dev/null || [[ "$(node -v 2>/dev/null | sed 's/v//;s/\..*//')" -lt $NODE_MAJOR ]]; then
  log "Installing Node ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt install -yq nodejs
fi

# Postgres
if ! command -v psql &>/dev/null; then
  log "Installing PostgreSQL"
  apt install -yq postgresql
fi

# Caddy
if ! command -v caddy &>/dev/null; then
  log "Installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt update -qq
  apt install -yq caddy
fi

# ------------------------------------------------------------------- app user
if ! id -u "$APP_USER" &>/dev/null; then
  log "Creating app user"
  adduser --disabled-password --gecos "" "$APP_USER"
  usermod -aG sudo "$APP_USER"
  if [[ -d /root/.ssh ]]; then
    rsync --archive --chown="$APP_USER:$APP_USER" /root/.ssh "/home/${APP_USER}/" 2>/dev/null || true
  fi
fi

# ----------------------------------------------------------------- swap (1 GB)
if ! swapon --show | grep -q '^'; then
  log "Adding 1 GB swapfile (Next.js builds can be memory-hungry on small boxes)"
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# ---------------------------------------------------------------------- pgsql
log "Ensuring PostgreSQL role and database exist"
DB_PASSWORD_FILE="/root/.portfolio-db-password"
if [[ ! -f "$DB_PASSWORD_FILE" ]]; then
  openssl rand -base64 32 | tr -d '\n=+/' > "$DB_PASSWORD_FILE"
  chmod 600 "$DB_PASSWORD_FILE"
fi
DB_PASSWORD="$(cat "$DB_PASSWORD_FILE")"

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" >/dev/null

# ------------------------------------------------------------------- clone app
log "Cloning / updating repo"
sudo -u "$APP_USER" mkdir -p "/home/${APP_USER}/apps"
if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all --prune
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/${BRANCH}"
fi

# Prisma needs Postgres in production. Switch the schema datasource if still SQLite.
if grep -q 'provider = "sqlite"' "$APP_DIR/prisma/schema.prisma"; then
  log "Switching Prisma datasource to postgresql"
  sed -i 's|provider = "sqlite"|provider = "postgresql"|' "$APP_DIR/prisma/schema.prisma"
fi

# ----------------------------------------------------------------------- .env
ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating production .env"
  AUTH_SECRET="$(openssl rand -base64 32)"
  # Generate random admin password and print at the end so it's not lost.
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=')"
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
AUTH_SECRET="${AUTH_SECRET}"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="admin@${DOMAIN}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
NODE_ENV="production"
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  GENERATED_ADMIN_PASSWORD="$ADMIN_PASSWORD"
fi

# -------------------------------------------------------------------- install
log "Installing npm deps + building (this takes a couple minutes)"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npx prisma generate"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npx prisma db push --accept-data-loss"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm run db:seed"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm run build"

# ----------------------------------------------------------- main app systemd
log "Installing systemd unit for the app"
cat > /etc/systemd/system/portfolio.service <<EOF
[Unit]
Description=Portfolio (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/node ${APP_DIR}/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=5
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now portfolio.service

# -------------------------------------------------------- auto-deploy systemd
log "Installing auto-deploy timer (polls origin/${BRANCH} every 2 min)"
cat > /etc/systemd/system/portfolio-deploy.service <<EOF
[Unit]
Description=Portfolio auto-deploy (poll git, rebuild on new commits)
After=network.target

[Service]
Type=oneshot
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/bin/bash ${APP_DIR}/scripts/deploy.sh ${BRANCH}
EOF

cat > /etc/systemd/system/portfolio-deploy.timer <<EOF
[Unit]
Description=Run portfolio auto-deploy every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
RandomizedDelaySec=15s
Unit=portfolio-deploy.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now portfolio-deploy.timer

# Allow `app` user to restart only the portfolio service without password
cat > /etc/sudoers.d/portfolio-deploy <<EOF
${APP_USER} ALL=(root) NOPASSWD: /bin/systemctl restart portfolio.service, /bin/systemctl status portfolio.service
EOF
chmod 440 /etc/sudoers.d/portfolio-deploy

# ------------------------------------------------------------------- Caddy
log "Configuring Caddy reverse proxy + Let's Encrypt"
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    encode gzip zstd
    reverse_proxy localhost:3000

    @uploads {
        path /uploads/*
    }
    header @uploads Cache-Control "public, max-age=31536000, immutable"

    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Frame-Options SAMEORIGIN
    }
}

www.${DOMAIN} {
    redir https://${DOMAIN}{uri} permanent
}
EOF

systemctl reload caddy

# -------------------------------------------------------------------- ufw
log "Configuring firewall"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

# --------------------------------------------------------------------- done
log "Done. Status:"
systemctl --no-pager status portfolio.service | head -5 || true
echo ""
printf "\033[1;32m✓ Portfolio is live at https://%s\033[0m\n" "$DOMAIN"
printf "\033[1;32m✓ Auto-deploy: every 2 minutes from origin/%s\033[0m\n" "$BRANCH"
echo ""
if [[ -n "${GENERATED_ADMIN_PASSWORD:-}" ]]; then
  printf "\033[1;33m========== SAVE THESE CREDENTIALS ==========\033[0m\n"
  printf "Admin URL:      https://%s/admin\n" "$DOMAIN"
  printf "Admin email:    admin@%s (display only — login is password-only)\n" "$DOMAIN"
  printf "Admin password: %s\n" "$GENERATED_ADMIN_PASSWORD"
  printf "DB password:    saved in /root/.portfolio-db-password (root-only)\n"
  printf "\033[1;33m============================================\033[0m\n"
  printf "Change ADMIN_PASSWORD in %s and run 'sudo -u %s npm run --prefix %s db:seed' to apply.\n" \
    "$ENV_FILE" "$APP_USER" "$APP_DIR"
else
  printf "Admin URL: https://%s/admin\n" "$DOMAIN"
  printf "Existing .env preserved — credentials untouched.\n"
fi
