#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.env"
  set +a
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup-db]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup-db]${NC} $*"; }
err()  { echo -e "${RED}[setup-db]${NC} $*" >&2; }

if [ -z "${DATABASE_URL_DIRECT:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  err "Set DATABASE_URL or DATABASE_URL_DIRECT in backend/.env (or export them)."
  exit 1
fi

# Prisma resuelve Neon pooler → host directo en código (lib/databaseUrl.ts)

cd "$BACKEND_DIR"

log "1/4  Generating Prisma Client..."
npx prisma generate --no-hints
echo ""

log "2/4  Applying migrations..."
npx prisma migrate deploy --no-hints
echo ""

log "3/4  Running seed (roles + permissions)..."
npx prisma db seed --no-hints
echo ""

log "4/4  Creating test user..."
npx tsx scripts/createTestUser.ts 2>&1 | grep -v "^prisma:query" || true
echo ""

log "Done! Database is ready."
log "  Test user:  superadmin@corelia.local / Admin123!"
