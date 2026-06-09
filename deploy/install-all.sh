#!/usr/bin/env bash
# Install npm dependencies for every backend service in one go.
# Usage: bash deploy/install-all.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

SERVICES=(
  user-service
  product-service
  cart-service
  order-service
  admin-service
  vendor-service
  api-gateway
)

for s in "${SERVICES[@]}"; do
  echo "==> Installing dependencies: $s"
  # Full install (incl. devDependencies) so sequelize-cli is available for migrations.
  ( cd "$ROOT/$s" && { npm ci || npm install; } )
done

echo "All service dependencies installed."
