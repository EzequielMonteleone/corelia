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

log()  { echo -e "${GREEN}[reset-db]${NC} $*"; }
warn() { echo -e "${YELLOW}[reset-db]${NC} $*"; }
err()  { echo -e "${RED}[reset-db]${NC} $*" >&2; }

if [ -z "${DATABASE_URL_DIRECT:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  err "Set DATABASE_URL or DATABASE_URL_DIRECT in backend/.env (or export them)."
  exit 1
fi

# Prisma resuelve Neon pooler → host directo automáticamente

FORCE=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y) FORCE=true; shift ;;
    --help|-h)
      echo "Usage: DATABASE_URL='...' $0 [--yes]"
      echo ""
      echo "Drops all data in the database, reapplies migrations, runs seed, and creates the test user."
      echo "DESTRUCTIVE — all rows are deleted."
      echo ""
      echo "  --yes   Skip confirmation prompt"
      exit 0
      ;;
    *) err "Unknown flag: $1"; exit 1 ;;
  esac
done

if ! $FORCE; then
  echo -e "${RED}WARNING: This will DELETE ALL DATA in the target database.${NC}"
  echo "DATABASE_URL host: $(echo "$DATABASE_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')"
  read -rp "Type 'yes' to continue: " confirm
  if [ "$confirm" != "yes" ]; then
    err "Aborted."
    exit 1
  fi
fi

cd "$BACKEND_DIR"

log "Generating Prisma Client..."
npx prisma generate --no-hints

log "Resetting database (drop + migrate + seed)..."
npx prisma migrate reset --force

log "Creating test user..."
npx tsx scripts/createTestUser.ts 2>&1 | grep -v "^prisma:query" || true

echo ""
log "Database recreated. Roles and permissions come from seed."
log "  Test user:  superadmin@corelia.local / Admin123!"
