#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0
warnings=0

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; errors=$((errors + 1)); }
skip() { echo -e "  ${YELLOW}–${NC} $*"; warnings=$((warnings + 1)); }

check_required() {
  local name="$1" value="${2:-}"
  if [ -z "$value" ]; then
    fail "$name is not set (required)"
    return 1
  fi
  return 0
}

check_starts_with() {
  local name="$1" value="$2" prefix="$3"
  if [[ ! "$value" == "$prefix"* ]]; then
    fail "$name should start with '$prefix' (got: ${value:0:20}...)"
    return 1
  fi
  return 0
}

check_min_length() {
  local name="$1" value="$2" min="$3"
  if [ "${#value}" -lt "$min" ]; then
    fail "$name is too short (min $min chars, got ${#value})"
    return 1
  fi
  return 0
}

load_env_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    return
  fi
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

# --- Flags ---
TARGET="all"
PRODUCTION=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)  TARGET="backend";  shift ;;
    --frontend) TARGET="frontend"; shift ;;
    --production) PRODUCTION=true;  shift ;;
    --help|-h)
      echo "Usage: $0 [--backend|--frontend] [--production]"
      echo ""
      echo "Validates environment variables for Corelia services."
      echo ""
      echo "Flags:"
      echo "  --backend     Check only backend vars"
      echo "  --frontend    Check only frontend vars"
      echo "  --production  Enforce production rules (https, strong secrets)"
      echo ""
      echo "Without flags, checks both services using .env files."
      exit 0
      ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# --- Backend ---
check_backend() {
  echo -e "\n${GREEN}Backend${NC} (Render)"

  if $PRODUCTION; then
    load_env_file "$ROOT_DIR/backend/.env.production"
  fi
  load_env_file "$ROOT_DIR/backend/.env"

  if check_required "DATABASE_URL" "${DATABASE_URL:-}"; then
    check_starts_with "DATABASE_URL" "$DATABASE_URL" "postgresql://"
    if echo "$DATABASE_URL" | grep -q "\-pooler"; then
      ok "DATABASE_URL uses Neon pooler (Prisma deriva el host directo automáticamente)"
    else
      ok "DATABASE_URL looks good"
    fi
  fi

  if check_required "JWT_SECRET" "${JWT_SECRET:-}"; then
    if $PRODUCTION; then
      check_min_length "JWT_SECRET" "$JWT_SECRET" 32 || true
    fi
    ok "JWT_SECRET is set"
  fi

  if $PRODUCTION; then
    if check_required "CORS_ORIGIN" "${CORS_ORIGIN:-}"; then
      check_starts_with "CORS_ORIGIN" "$CORS_ORIGIN" "https://" && ok "CORS_ORIGIN looks good"
    fi
  else
    if [ -n "${CORS_ORIGIN:-}" ]; then
      ok "CORS_ORIGIN = $CORS_ORIGIN"
    else
      skip "CORS_ORIGIN not set (all origins allowed in dev)"
    fi
  fi

  if [ -n "${JWT_EXPIRES_IN:-}" ]; then
    ok "JWT_EXPIRES_IN = $JWT_EXPIRES_IN"
  else
    skip "JWT_EXPIRES_IN not set (using default)"
  fi

  if [ -n "${PORT:-}" ]; then
    ok "PORT = $PORT"
  else
    skip "PORT not set (Render injects it automatically)"
  fi
}

# --- Frontend ---
check_frontend() {
  echo -e "\n${GREEN}Frontend${NC} (Vercel)"

  if $PRODUCTION; then
    load_env_file "$ROOT_DIR/frontend/.env.production"
  fi
  load_env_file "$ROOT_DIR/frontend/.env"
  load_env_file "$ROOT_DIR/frontend/.env.local"

  if check_required "NEXT_PUBLIC_API_URL" "${NEXT_PUBLIC_API_URL:-}"; then
    if $PRODUCTION; then
      check_starts_with "NEXT_PUBLIC_API_URL" "$NEXT_PUBLIC_API_URL" "https://" && \
        ok "NEXT_PUBLIC_API_URL looks good"
    else
      ok "NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"
    fi
  fi
}

# --- Run ---
echo "Checking environment variables..."

if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  check_backend
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  check_frontend
fi

echo ""
if [ "$errors" -gt 0 ]; then
  echo -e "${RED}$errors error(s)${NC}, $warnings warning(s)"
  exit 1
else
  echo -e "${GREEN}All checks passed${NC} ($warnings warning(s))"
  exit 0
fi
