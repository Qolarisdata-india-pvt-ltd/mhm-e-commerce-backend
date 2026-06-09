# Pluggable Upload Storage (local folder ↔ MinIO)

**Date:** 2026-06-04
**Status:** Approved (pending spec review)

## Problem

Uploads (user profile pictures, product images) are hardwired to MinIO in two
services. UAT and dev should not require a running MinIO; they should write
uploads to a local folder instead. Production keeps MinIO. The choice must be
configurable and must not break existing security behavior tied to `NODE_ENV`.

## Constraints discovered

- MinIO is used in **2 services, 4 code spots**:
  - `product-service/config/minio.js` — MinIO client.
  - `product-service/utils/uploadToMinio.js` — `uploadImageToMinio(file)`:
    sharp → webp optimize, `putObject` to bucket `products`, returns
    `${MINIO_BUCKET_URL}/products/<obj>`. Called twice in
    `product-service/controllers/vendor.controller.js` (create + update).
  - `user-service/config/minioClient.js` — MinIO client + `initBucket(bucket)`.
  - `user-service/controllers/auth.controller.js` — `initBucket("user-profiles")`
    at module load, and `updateProfile` does `putObject` then sets
    `profilePic = ${MINIO_BUCKET_URL}/user-profiles/<file>`.
- `NODE_ENV` is hardcoded to `"production"` in `ecosystem.config.cjs` (the UAT
  PM2 file) and is load-bearing for security: secure cookies (`user-service`,
  `vendor-service` `cookie.util.js` / `server.js`) and error-message hiding all
  check `NODE_ENV === "production"`. Therefore the storage selector must **not**
  force UAT off `production`.
- Services are deployed independently (own `package.json`, own `.env`), so the
  storage helper is duplicated per service rather than shared, matching the
  existing per-service `config/` pattern.

## Selection logic

A `resolveDriver()` helper:

1. If `STORAGE_DRIVER` env var is set (`local` | `minio`) → use it.
2. Else → `minio` when `NODE_ENV === "production"`, otherwise `local`.

UAT sets `STORAGE_DRIVER=local` explicitly in `.env` (keeping
`NODE_ENV=production` so secure cookies / error hiding stay intact). Dev
(`NODE_ENV=development`, no `STORAGE_DRIVER`) resolves to `local` automatically.
Production leaves `STORAGE_DRIVER` unset → `minio`.

## Storage module (one per service: `config/storage.js`)

Uniform interface, driver chosen by `resolveDriver()`:

```
ensureBucket(bucket): Promise<void>
saveObject(bucket, objectName, buffer, contentType): Promise<publicUrl: string>
isLocal(): boolean        // used by server.js to decide whether to mount static
```

**local driver**
- `ensureBucket(bucket)` → `fs.mkdir(path.join(UPLOAD_DIR, bucket), { recursive: true })`.
  Creates `UPLOAD_DIR` and the bucket subfolder if missing.
- `saveObject` → `ensureBucket(bucket)` (defensive), write buffer to
  `<UPLOAD_DIR>/<bucket>/<objectName>`, return
  `${PUBLIC_BASE_URL}/uploads/${bucket}/${objectName}` (no trailing slash on base).

**minio driver**
- Wraps the existing `minio` Client. `ensureBucket` = current `bucketExists` /
  `makeBucket` + public read policy. `saveObject` = `putObject` with
  `Content-Type`, returns `${MINIO_BUCKET_URL}/${bucket}/${objectName}`.
- Reuses existing `MINIO_*` env vars. Client is only constructed when the driver
  is `minio` (so dev/UAT need no MinIO creds).

## Call-site changes

- `product-service/utils/uploadToMinio.js`: keep sharp→webp optimization; replace
  the MinIO client calls with `storage.ensureBucket("products")` +
  `storage.saveObject("products", objectName, optimizedBuffer, "image/webp")`.
  **Function name `uploadImageToMinio` kept** so the two `vendor.controller.js`
  call sites are unchanged.
- `user-service/controllers/auth.controller.js`: replace
  `import minioClient, { initBucket }` with the storage module; module-load
  `initBucket(BUCKET_NAME)` → `storage.ensureBucket(BUCKET_NAME)`; in
  `updateProfile`, replace the `putObject` block with
  `storage.saveObject(BUCKET_NAME, fileName, file.buffer, file.mimetype)` and set
  `user.profilePic` to the returned URL.

## Serving files back (local driver only)

Only the api-gateway (5007) is public; the individual services listen on
localhost. So per-service `express.static` URLs (`http://127.0.0.1:<port>/...`)
are NOT browser-reachable in UAT — they only work on a dev laptop where the
browser shares the host.

**Chosen approach: nginx serves a shared upload folder.**
- Both services set `UPLOAD_DIR` to one shared absolute path (`/var/www/mhm-uploads`
  in UAT). Distinct buckets (`user-profiles`, `products`) prevent collisions.
- nginx `location /mhm/uploads/ { alias /var/www/mhm-uploads/; }` serves files
  straight from disk; services stay localhost-only.
- `PUBLIC_BASE_URL=https://uat-api.cgmitaan.in/mhm` → stored URL
  `${PUBLIC_BASE_URL}/uploads/<bucket>/<file>`.
- `if (storage.isLocal()) app.use("/uploads", express.static(storage.uploadDir))`
  remains in both `server.js` as a **local-dev convenience** (dev uses
  `UPLOAD_DIR=./uploads`, `PUBLIC_BASE_URL=http://127.0.0.1:<port>`); in UAT nginx
  serves the files, not node.
- The shared folder must be pre-created and owned by the PM2 user so the local
  driver's `mkdir -p` of bucket subfolders succeeds.

## Env changes

Add to `user-service/.env.example` and `product-service/.env.example`:

```
# Upload storage: local | minio. Unset → derives from NODE_ENV (production=minio).
STORAGE_DRIVER=local
# Local driver: base folder for uploads (created if missing).
UPLOAD_DIR=./uploads
# Local driver: base URL clients use to fetch uploaded files.
PUBLIC_BASE_URL=http://127.0.0.1:6001     # product-service uses :5002
```

`MINIO_*` vars stay (now only required when the resolved driver is `minio`).
Add `uploads/` to `.gitignore`.

## Docs

`DEPLOY.md`: note `STORAGE_DRIVER` / `UPLOAD_DIR` / `PUBLIC_BASE_URL`; MinIO is now
optional (only needed when `STORAGE_DRIVER=minio` / production). Note the optional
per-service nginx `location /uploads` for HTTPS file URLs in UAT.

## Out of scope

- Migrating existing MinIO objects to local disk.
- api-gateway-routed (node-proxied) file serving — rejected in favor of nginx
  serving a shared folder (no extra node hop, services stay private).
- Changing storage for any service that does not currently upload files.

## Testing / verification

- Unit: `resolveDriver()` returns `local`/`minio` for the matrix of
  `STORAGE_DRIVER` × `NODE_ENV` values.
- Local driver: `saveObject` creates a missing `UPLOAD_DIR`/bucket, writes the
  file, returns the expected URL; file is fetchable via the static route.
- Manual: with `STORAGE_DRIVER=local`, update a profile pic and create a product
  with images; confirm files land under `./uploads/<bucket>/` and the returned
  URLs load. With `STORAGE_DRIVER=minio`, behavior is unchanged.
```
