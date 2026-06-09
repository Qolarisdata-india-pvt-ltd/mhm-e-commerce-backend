# UAT Deployment (Linux + PM2)

The backend is 7 independent Node.js services. They are installed and started
together via the scripts in `deploy/` and the `ecosystem.config.cjs` PM2 file.

## Topology

> **Shared server.** UAT (`uat-api.cgmitaan.in`) already runs other apps:
> port 446 (main app, `/`), 3001 (`/citizen-portal/`), 5001 (`/citizen-uat/`).
> Because 5001 is taken, **user-service runs on 6001** here. Before starting,
> confirm 5002–5007 are also free: `ss -ltnp | grep -E ':50(0[2-7])'`.

| Service          | Port | DB | Redis | Other            |
|------------------|------|----|-------|------------------|
| user-service     | 6001 | ✓  | ✓     | Uploads (5001 busy)|
| product-service  | 5002 | ✓  | ✓     | Uploads          |
| cart-service     | 5003 | ✓  | ✓     |                  |
| order-service    | 5004 | ✓  | ✓     | Razorpay         |
| admin-service    | 5005 | ✓  | ✓     |                  |
| vendor-service   | 5006 | ✓  | ✓     |                  |
| api-gateway      | 5007 |    | ✓     | public entry pt. |

Only the **api-gateway (5007)** should be exposed (behind nginx). The other six
listen on localhost only.

## Prerequisites on the UAT host

- Node.js (LTS) + npm
- PM2 (`npm i -g pm2`)
- MySQL reachable from the host, with one database per service (see `db-schema/`)
- Redis
- Upload storage for user-service & product-service — either:
  - **Local folder** (default for UAT/dev): set `STORAGE_DRIVER=local`. No extra
    service needed; files are written under `UPLOAD_DIR` and served at `/uploads`.
    See [Upload storage](#upload-storage) below.
  - **MinIO** (production): set `STORAGE_DRIVER=minio`. See [deploy/MINIO_INSTALLATION.md](deploy/MINIO_INSTALLATION.md)
- Razorpay keys — needed by order-service

## One-time setup

1. **Create the databases.** Each service has SQL in `db-schema/<service>/schema.sql`
   and Sequelize migrations in `<service>/migrations/`. Create an empty DB per
   service (e.g. `mhm_user`, `mhm_product`, …); migrations build the tables.

2. **Create `.env` files.** Every service has a `.env.example`. Copy each one and
   fill in real values:
   ```bash
   for s in user-service product-service cart-service order-service \
            admin-service vendor-service api-gateway; do
     cp "$s/.env.example" "$s/.env"
   done
   ```
   Then edit each `.env` (DB creds, JWT_SECRET, Redis, upload storage, Razorpay).
   Use the **same `JWT_SECRET` and `INTERNAL_API_KEY`** across all services.

## Upload storage

`user-service` (profile pictures) and `product-service` (product images) pick
their storage backend at startup via `STORAGE_DRIVER`:

- `STORAGE_DRIVER=local` — files are written to `UPLOAD_DIR` and the public URL
  is `${PUBLIC_BASE_URL}/uploads/<bucket>/<file>`. **Use this for UAT and dev** —
  no MinIO process required. The two services use distinct buckets
  (`user-profiles`, `products`), so they can safely share one `UPLOAD_DIR`.
- `STORAGE_DRIVER=minio` — uploads go to MinIO (see
  [deploy/MINIO_INSTALLATION.md](deploy/MINIO_INSTALLATION.md)); URLs use
  `MINIO_BUCKET_URL`. Use this in production.
- If `STORAGE_DRIVER` is **unset**, it derives from `NODE_ENV`: `minio` when
  `NODE_ENV=production`, otherwise `local`. Because UAT runs with
  `NODE_ENV=production` (for secure cookies), UAT must set `STORAGE_DRIVER=local`
  explicitly.

### Serving local uploads in UAT (nginx, shared folder)

Only the api-gateway (5007) is public, so the individual services' `/uploads`
routes are **not** reachable by browsers. Instead, have **nginx serve a shared
upload folder** directly (faster, and the services stay localhost-only):

1. Create the shared folder, owned by the user PM2 runs as (so the services can
   write and create bucket subfolders):
   ```bash
   sudo mkdir -p /var/www/mhm-uploads
   sudo chown -R $USER:$USER /var/www/mhm-uploads
   ```
2. In **both** `user-service/.env` and `product-service/.env` set:
   ```
   STORAGE_DRIVER=local
   UPLOAD_DIR=/var/www/mhm-uploads
   PUBLIC_BASE_URL=https://uat-api.cgmitaan.in/mhm
   ```
3. Add an nginx `location` that serves that folder under `/mhm/uploads/`:
   ```nginx
   location /mhm/uploads/ { alias /var/www/mhm-uploads/; }
   ```
   Then `sudo nginx -t && sudo systemctl reload nginx`.

A stored image URL is then e.g.
`https://uat-api.cgmitaan.in/mhm/uploads/products/<file>` and is served by nginx
straight from disk. (The services' built-in `express.static("/uploads")` route
stays as a local-dev convenience — on a dev laptop you can instead use
`UPLOAD_DIR=./uploads` and `PUBLIC_BASE_URL=http://127.0.0.1:<port>`.)

## Install + migrate + start (the "all at once" part)

```bash
# 1. Install dependencies for all services
bash deploy/install-all.sh

# 2. Run all DB migrations (after .env files exist)
bash deploy/migrate-all.sh

# 3. (optional, fresh DB only) seed reference data
bash deploy/seed-all.sh

# 4. Start all 7 services under PM2
pm2 start ecosystem.config.cjs

# 5. Make them survive reboots
pm2 save
pm2 startup        # run the command it prints
```

## Day-to-day

```bash
pm2 status                 # health of all services
pm2 logs                   # tail all logs
pm2 logs order-service     # one service
pm2 reload ecosystem.config.cjs   # zero-downtime reload after a deploy
pm2 restart all
```

## Frontend (served at /mhm/e-commerce)

The frontend (`../mhm-e-commerce-frontend`) is a Vite/React SPA served under the
sub-path **`/mhm/e-commerce/`** on the shared nginx, with its API proxied at
**`/mhm/api/`** → gateway (5007). The repo is already configured for this:
`vite.config.js` sets `base: "/mhm/e-commerce/"`, the router uses that basename,
and the API base URL defaults to the relative `/mhm/api` (see `src/utils/appPath.js`).

Build and deploy:
```bash
cd ../mhm-e-commerce-frontend
cp .env.example .env          # set VITE_RAZORPAY_KEY_ID; keep VITE_API_BASE_URL=/mhm/api
npm install
npm run build                 # outputs dist/
# copy dist/ to the path referenced by nginx:
sudo mkdir -p /var/www/mhm-ecommerce
sudo cp -r dist /var/www/mhm-ecommerce/
```

nginx (see the deployed `nginx.conf`) adds:
```nginx
location /mhm/api/ { proxy_pass http://127.0.0.1:5007/api/; ... }   # API
location /mhm/e-commerce/ { alias /var/www/mhm-ecommerce/dist/; try_files $uri $uri/ /mhm/e-commerce/index.html; }
```
After editing nginx: `sudo nginx -t && sudo systemctl reload nginx`.
App URL: `https://uat-api.cgmitaan.in/mhm/e-commerce/`.

## Known gaps to confirm before go-live

- **No `address-service` exists**, but the gateway routes `/api/addresses` to
  `ADDRESS_SERVICE_URL`. Confirm where addresses are handled and set that var
  accordingly (default points it at user-service).
- **order-service & vendor-service have no default port** — they rely on `PORT`
  from PM2 (set in `ecosystem.config.cjs`). Don't start them with bare `node`.
- order-service reads both `DB_PASS` and `DB_PASSWORD`; set both to the same value.
