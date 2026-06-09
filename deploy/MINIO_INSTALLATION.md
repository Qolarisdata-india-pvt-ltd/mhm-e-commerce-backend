# MinIO Installation (UAT — Linux)

MinIO is the S3-compatible object store used by **user-service** and
**product-service** for image/file uploads. It must be running before those
services start.

## How the app uses MinIO

- Connection comes from each service's `.env`:
  `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`,
  `MINIO_BUCKET_URL`.
- `useSSL` is **false** in code, so MinIO is reached over plain HTTP on the
  internal network (terminate TLS at nginx if you expose it publicly).
- Buckets are **auto-created on first boot** with public-read policy:
  - `products`       — product-service
  - `user-profiles`  — user-service
- `MINIO_BUCKET_URL` is the base URL clients use to fetch objects
  (e.g. `http://<host>:9000` for UAT, or your nginx/CDN URL in prod).

Ports:
- **9000** — S3 API (apps connect here → this is `MINIO_PORT`)
- **9001** — web console (admin UI)

---

## Option A — Native binary + systemd (recommended for a plain Linux VM)

### 1. Create a user and data directory
```bash
sudo useradd -r -s /sbin/nologin minio-user
sudo mkdir -p /usr/local/bin /etc/minio /mnt/minio-data
sudo chown -R minio-user:minio-user /mnt/minio-data
```

### 2. Install the server binary
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /tmp/minio
sudo install -m 755 /tmp/minio /usr/local/bin/minio
```

### 3. Install the client (`mc`) — used for bucket admin
```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /tmp/mc
sudo install -m 755 /tmp/mc /usr/local/bin/mc
```

### 4. Environment file `/etc/minio/minio.conf`
```bash
# Root credentials — these become the access/secret keys the services use
MINIO_ROOT_USER=mhm-minio-admin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_SECRET

# Data location and console address
MINIO_VOLUMES=/mnt/minio-data
MINIO_OPTS="--address :9000 --console-address :9001"
```
```bash
sudo chown minio-user:minio-user /etc/minio/minio.conf
sudo chmod 640 /etc/minio/minio.conf
```

### 5. systemd unit `/etc/systemd/system/minio.service`
```ini
[Unit]
Description=MinIO object storage
After=network-online.target
Wants=network-online.target

[Service]
User=minio-user
Group=minio-user
EnvironmentFile=/etc/minio/minio.conf
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

### 6. Start and enable
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
sudo systemctl status minio
```
Console is now at `http://<host>:9001` (log in with the root user/password above).

---

## Option B — Docker

```bash
docker run -d --name minio --restart unless-stopped \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=mhm-minio-admin \
  -e MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_SECRET \
  -v /mnt/minio-data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

---

## Post-install: credentials and buckets

### Point the services at MinIO
In `user-service/.env` and `product-service/.env`:
```bash
MINIO_ENDPOINT=127.0.0.1            # MinIO host (same VM = 127.0.0.1)
MINIO_PORT=9000
MINIO_ACCESS_KEY=mhm-minio-admin    # = MINIO_ROOT_USER (or a scoped key, below)
MINIO_SECRET_KEY=CHANGE_ME_STRONG_SECRET
MINIO_BUCKET_URL=http://127.0.0.1:9000
```

### (Optional) create a scoped service account instead of using root keys
```bash
mc alias set local http://127.0.0.1:9000 mhm-minio-admin CHANGE_ME_STRONG_SECRET
mc admin user svcacct add local mhm-minio-admin
# Put the printed Access Key / Secret Key into the .env files above.
```

### Buckets
The services create `products` and `user-profiles` automatically on startup.
To pre-create them manually (e.g. to verify connectivity):
```bash
mc mb local/products
mc mb local/user-profiles
mc anonymous set download local/products        # public read (matches app policy)
mc anonymous set download local/user-profiles
```

---

## Verify
```bash
# API reachable
curl -I http://127.0.0.1:9000/minio/health/ready   # expect HTTP/1.1 200 OK

# Buckets exist
mc ls local
```
Then start user-service / product-service and confirm the logs show
`Bucket 'products' created successfully` (or no MinIO errors) and that uploads
return URLs under `MINIO_BUCKET_URL`.

## Notes for production hardening
- Put nginx in front of MinIO with TLS and set `MINIO_BUCKET_URL` to the HTTPS URL.
- Replace root-key usage with a scoped service account (above).
- Don't expose port 9001 (console) publicly; restrict to admin networks.
