# Portfolio — David Rajala

Sci-fi-inspired portfolio with admin panel built with Next.js 15.

**Live:** https://davidrajala.cc (after deploy)
**Repo state:** ready for Hetzner deployment

---

## Features

### Public site
- `/` Hero (with optional video/image background) + featured spotlight + recent projects + about + contact CTA
- `/projekt` Filterable list of all projects
- `/projekt/[slug]` Detail page with cover, body, masonry gallery (images + video), lightbox on click
- `/om-mig` Profile with bio, stats, skills, contact rows
- Floating chat widget — multi-contact submission (email, phone, Instagram, Snapchat, LinkedIn, X, Discord, custom), localStorage memory with GDPR consent

### Admin panel (`/admin`)
- Dashboard with counts
- Projects: drag-reorder, single-featured spotlight, multi-image+video gallery upload, edit/delete
- Categories CRUD
- About profile (avatar + bio + stats + availability toggle + hero background image/video)
- Messages: chat-style view with Inbox/Read/Saved tabs, copy-to-clipboard on contact details
- Settings: Telegram bot integration with one-click test
- Optional 2FA via authenticator app (set up at `/admin/setup-2fa`)

---

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Framer Motion for animations
- Prisma + SQLite (dev) → Postgres (prod)
- NextAuth v5 (Auth.js) credentials with bcrypt + rate-limit
- otplib + qrcode for 2FA
- dnd-kit for drag-reorder
- Local file uploads (max 10 MB images, 100 MB video) — easy to swap for S3-compatible storage

---

## Local development

```bash
npm install
npm run db:reset    # builds schema + seeds default data
npm run dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin (default password `123456`, change in `.env`)

### Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Hot-reload dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:seed` | Seed default data (also clears 2FA so password login works) |
| `npm run db:reset` | Wipe DB and re-seed |

---

## Deploy to Hetzner

Step-by-step for the live server.

**Target server:** `46.224.128.108` (IPv6 `2a01:4f8:c012:5b20::/64`)
**Domain:** `davidrajala.cc`

### 0. Rotate the root password

The root password leaked through chat. **Before doing anything else**, log into Hetzner Cloud Console (browser) and run `passwd` to set a new one. Add your SSH key while you're there:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys   # paste your public key
chmod 600 ~/.ssh/authorized_keys
```

Then disable password auth in `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

```bash
systemctl reload ssh
```

### 1. Point the domain

In your domain registrar's DNS settings for `davidrajala.cc`:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `46.224.128.108` |
| A | `www` | `46.224.128.108` |
| AAAA | `@` | `2a01:4f8:c012:5b20::1` |
| AAAA | `www` | `2a01:4f8:c012:5b20::1` |

DNS propagation usually takes 5–30 min. Check with `dig davidrajala.cc +short`.

### 2. Create non-root app user

SSH in as root, then:

```bash
adduser app
usermod -aG sudo app
rsync --archive --chown=app:app ~/.ssh /home/app
apt update && apt upgrade -y
apt install -y curl git build-essential
```

Log out and reconnect as `app` for the rest.

### 3. Install Node, Postgres, Caddy

```bash
# Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Postgres
sudo apt install -y postgresql

# Caddy (reverse proxy with auto-HTTPS via Let's Encrypt)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

### 4. Configure Postgres

```bash
sudo -u postgres psql <<'SQL'
CREATE USER portfolio WITH PASSWORD 'GENERATE-A-LONG-RANDOM-PASSWORD-HERE';
CREATE DATABASE portfolio_prod OWNER portfolio;
SQL
```

### 5. Get the code on the server

If you publish the repo on GitHub:

```bash
mkdir -p /home/app/apps && cd /home/app/apps
git clone <your-repo-url> portfolio
cd portfolio
```

Or push directly via `rsync` from your laptop:

```bash
# from your local machine (Git Bash on Windows)
rsync -avz --exclude=node_modules --exclude=.next --exclude=prisma/dev.db \
  /c/Users/david/Desktop/portfolio/ app@46.224.128.108:/home/app/apps/portfolio/
```

### 6. Switch Prisma to Postgres

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Commit this change (or do it directly on the server).

### 7. Production env vars

On the server:

```bash
cd /home/app/apps/portfolio
cat > .env <<EOF
DATABASE_URL="postgresql://portfolio:THE-DB-PASSWORD@localhost:5432/portfolio_prod"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="ditt@mail.se"
ADMIN_PASSWORD="A-LONG-AND-STRONG-PASSWORD"
NODE_ENV="production"
EOF
chmod 600 .env
```

### 8. Build and seed

```bash
npm ci
npm run build
npm run db:push
npm run db:seed
```

The seed command idempotently creates the admin user and default categories.

### 9. systemd service

Create `/etc/systemd/system/portfolio.service`:

```ini
[Unit]
Description=Portfolio (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
User=app
WorkingDirectory=/home/app/apps/portfolio
EnvironmentFile=/home/app/apps/portfolio/.env
ExecStart=/usr/bin/node /home/app/apps/portfolio/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Activate:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio
sudo systemctl status portfolio
```

### 10. Caddy reverse proxy

Edit `/etc/caddy/Caddyfile`:

```caddy
davidrajala.cc, www.davidrajala.cc {
    encode gzip zstd
    reverse_proxy localhost:3000

    # long-cache uploads (immutable filenames)
    @uploads {
        path /uploads/*
    }
    header @uploads Cache-Control "public, max-age=31536000, immutable"

    # security headers
    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Frame-Options SAMEORIGIN
    }
}

# canonicalize www → root
www.davidrajala.cc {
    redir https://davidrajala.cc{uri} permanent
}
```

Reload:

```bash
sudo systemctl reload caddy
```

Caddy auto-fetches a Let's Encrypt cert. Visit `https://davidrajala.cc`.

### 11. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 12. Backups (recommended)

Daily `pg_dump` + uploads sync, e.g. via cron:

```bash
sudo crontab -e
# add:
0 3 * * * pg_dump portfolio_prod | gzip > /home/app/backups/db-$(date +\%F).sql.gz
0 4 * * * rsync -a /home/app/apps/portfolio/public/uploads/ /home/app/backups/uploads/
```

Sync `/home/app/backups/` to a Hetzner Storage Box or S3 for offsite copies.

### 13. Deployment updates

When you make changes locally:

```bash
# locally
git push  # if using git, or rsync as in step 5

# on server
cd /home/app/apps/portfolio
git pull   # or wait for rsync
npm ci
npm run build
npm run db:push  # only if schema changed
sudo systemctl restart portfolio
```

---

## Migrating local uploads to the server

If you've already uploaded images/videos to your local `public/uploads/`, sync them once:

```bash
rsync -avz /c/Users/david/Desktop/portfolio/public/uploads/ \
  app@46.224.128.108:/home/app/apps/portfolio/public/uploads/
```

After this, project records in the seeded DB still reference the same URLs (`/uploads/...`).

---

## Security notes

- **Passwords are bcrypt-hashed** (12 rounds)
- **Login rate-limited:** 8 attempts / 15 min per IP
- **Contact form rate-limited:** 5 / minute per IP
- **2FA optional:** set up at `/admin/setup-2fa` after login
- **Destructive actions (delete project/category/message, save profile)** require fresh password OR 2FA code
- **File uploads validated:** MIME + size + random filenames + path-traversal protection
- **Open redirect protection** on login flow
- **Admin routes protected** by middleware

For maximum security in production:
1. Enable 2FA from admin → setup-2fa
2. Use a long admin password in `.env`
3. Rotate `AUTH_SECRET` if ever leaked
4. Keep server firewall + SSH key-only auth
