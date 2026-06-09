#!/usr/bin/env bash
# Run seed scripts for services that ship one (optional — run once on a fresh DB).
# Some seeders need SEED_PASSWORD / SEED_VENDOR_ID set in the service .env.
# Usage: bash deploy/seed-all.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# Services with a seed.js (see "seed" script in their package.json).
# Order matters: product-service attaches products to a vendor (SEED_VENDOR_ID),
# so vendor-service (and admin-service) must be seeded BEFORE product-service.
SERVICES=(
  user-service
  vendor-service
  admin-service
  product-service
  order-service
)

for s in "${SERVICES[@]}"; do
  if [ -f "$ROOT/$s/seed.js" ]; then
    echo "==> Seeding: $s"
    ( cd "$ROOT/$s" && npm run seed )
  fi
done

echo "Seeding complete."
