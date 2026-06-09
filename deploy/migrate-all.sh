#!/usr/bin/env bash
# Run Sequelize migrations for every service that has them.
# Each service reads its own .env for DB credentials (must exist first).
# Usage: bash deploy/migrate-all.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# api-gateway has no database, so it is intentionally excluded.
SERVICES=(
  user-service
  product-service
  cart-service
  order-service
  admin-service
  vendor-service
)

for s in "${SERVICES[@]}"; do
  if [ -d "$ROOT/$s/migrations" ]; then
    echo "==> Migrating: $s"
    ( cd "$ROOT/$s" && npx sequelize-cli db:migrate )
  fi
done

echo "All migrations applied."
