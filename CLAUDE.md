# Portfolio — operations notes

Personal portfolio at https://davidrajala.cc. Public site + admin panel.

## Stack at a glance

- **Next.js 15** App Router, TypeScript, Tailwind v4
- **Prisma**: SQLite locally, Postgres in prod (deploy.sh swaps the provider on every pull)
- **NextAuth v5** credentials with bcrypt + optional TOTP 2FA
- **Caddy** reverse-proxy + auto-HTTPS in front of Node on port 3000
- All content (projects, gallery, about, telegram bot config) is in the DB and edited via the admin panel

## Day-to-day flow

### To change anything in the codebase

```bash
# locally
npm run dev               # http://localhost:3000
# make edits, test
git add -A && git commit -m "what changed and why"
git push
```

That's it. The server's `portfolio-deploy.timer` fires every 2 min, sees the new commit, and runs `scripts/deploy.sh` which:
- pulls
- swaps Prisma `provider = "sqlite"` → `"postgresql"` (the repo ships sqlite for local dev)
- runs `npm ci` only if `package-lock.json` changed
- runs `prisma db push` only if `prisma/schema.prisma` changed
- builds Next.js
- restarts `portfolio.service`

The site stays up on the previous build until the new one finishes; failed builds roll back automatically.

### To change content (projects, about, gallery, etc)

Use the admin panel in the browser, never edit the server DB directly:

| Action | Where |
| --- | --- |
| Login | https://davidrajala.cc/admin |
| Set up 2FA (one-time) | `/admin/setup-2fa` |
| Add / reorder / star projects | `/admin/projekt` |
| Manage categories | `/admin/kategorier` |
| Edit profile, hero bg, availability | `/admin/om-mig` |
| Read chat messages | `/admin/meddelanden` |
| Telegram bot setup | `/admin/installningar` |

Login is password-only until 2FA is configured, then code-only.

### To change the database schema

Edit `prisma/schema.prisma`, push, done. The deploy script detects the schema change and runs `prisma db push --accept-data-loss` automatically.

For destructive migrations (renaming columns, dropping tables) consider running locally first, then pushing — `db push` does not preserve data when columns change type.

## Server reference

| | |
| --- | --- |
| Host | `46.224.128.108` (root@) |
| Domain | `davidrajala.cc` (DNS at registrar, A-record `@` and `www`) |
| App dir | `/home/app/apps/portfolio` |
| App user | `app` |
| App service | `systemctl status portfolio.service` |
| Auto-deploy | `systemctl status portfolio-deploy.timer` |
| App env | `/home/app/apps/portfolio/.env` (root-readable) |
| DB password | `/root/.portfolio-db-password` |
| Postgres DB | `portfolio_prod` |
| Caddyfile | `/etc/caddy/Caddyfile` |
| Logs (app) | `journalctl -u portfolio.service -f` |
| Logs (deploys) | `journalctl -u portfolio-deploy.service -f` |

## Common tasks

**Watch a deploy live**
```bash
ssh root@46.224.128.108 "journalctl -u portfolio-deploy.service -f"
```

**Force an immediate deploy (skip the 2-min poll)**
```bash
ssh root@46.224.128.108 "systemctl start portfolio-deploy.service"
```

**Reset admin password if forgotten**
```bash
ssh root@46.224.128.108
nano /home/app/apps/portfolio/.env       # edit ADMIN_PASSWORD
sudo -u app npm run --prefix /home/app/apps/portfolio db:seed
```
This also clears the 2FA secret, so the login flow goes back to password.

**Re-export local data and re-import to prod (one-shot, rare)**
```bash
# locally
npx tsx scripts/export-local-data.ts

# transfer
scp data-export.json root@46.224.128.108:/home/app/apps/portfolio/
ssh root@46.224.128.108 "chown app:app /home/app/apps/portfolio/data-export.json && \
  sudo -u app bash -lc 'cd /home/app/apps/portfolio && npx tsx scripts/import-data.ts' && \
  systemctl restart portfolio.service"
```

**Run the bootstrap on a fresh server** (e.g. after wipe)
```bash
curl -fsSL https://raw.githubusercontent.com/Davveravve/davidrajala.cc/main/scripts/server-bootstrap.sh | bash
```
The script is idempotent — safe to re-run.

## Gotchas

- The repo's `prisma/schema.prisma` says `provider = "sqlite"`. **Do not** change it to postgres — `scripts/deploy.sh` patches it on every server pull. If you change the provider in the repo, local dev breaks.
- Files in `public/uploads/` are gitignored. They live only on the server (and locally during dev). If you ever wipe the server, run `export-local-data.ts` + the SCP migration to restore.
- The `.env` file is gitignored. Never commit secrets. The bootstrap auto-generates fresh `.env` values on first run.
- Server uses `git clean -fd` (no `-x`) so gitignored files (uploads, .env, dev.db) survive every deploy.
- Next.js statically prerenders project detail pages from `generateStaticParams`. After importing new projects with new slugs, the build picks them up — restart isn't enough, a fresh build is needed (which the auto-deploy already does).

## Code conventions

- Commit messages: subject in lowercase imperative ("add X", "fix Y"). Body explains *why* if non-obvious.
- New text strings: English (the UI is fully English).
- New components live in `src/components/`. Sections in `src/components/sections/`. Admin-only in `src/components/admin/`.
- Server actions live in `src/app/_actions/`. Always guarded by `ensureAdmin()` (read) or `ensureAdminWithReauth(code)` (destructive).
- Tailwind: design tokens in `src/app/globals.css` `@theme` block. Use `var(--color-accent)` etc., not arbitrary hex.
