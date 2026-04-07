#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err()  { echo -e "${RED}[deploy]${NC} $*" >&2; }
info() { echo -e "${CYAN}[deploy]${NC} $*"; }

# --- Flags ---
TARGET="all"
WITH_MIGRATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --back)          TARGET="back";        shift ;;
    --front)         TARGET="front";       shift ;;
    --all)           TARGET="all";         shift ;;
    --with-migrate)  WITH_MIGRATE=true;    shift ;;
    --help|-h)
      echo "Usage: $0 [--back|--front|--all] [--with-migrate]"
      echo ""
      echo "Deploy Corelia services to Render and Vercel."
      echo ""
      echo "Targets:"
      echo "  --all           Deploy backend + frontend (default)"
      echo "  --back          Deploy backend only (Render)"
      echo "  --front         Deploy frontend only (Vercel)"
      echo ""
      echo "Options:"
      echo "  --with-migrate  Run DB setup (migrations + seed) before backend deploy"
      echo ""
      echo "Prerequisites:"
      echo "  - vercel CLI: npm i -g vercel"
      echo "  - Render: uses git push auto-deploy (no CLI needed)"
      echo "  - DATABASE_URL env var (for --with-migrate)"
      exit 0
      ;;
    *) err "Unknown flag: $1"; exit 1 ;;
  esac
done

# --- Prerequisite checks ---
check_cli() {
  local cmd="$1" install_hint="$2"
  if ! command -v "$cmd" &> /dev/null; then
    warn "$cmd CLI not found. Install it: $install_hint"
    return 1
  fi
  return 0
}

# --- Backend deploy ---
deploy_backend() {
  log "Deploying backend to Render..."

  if $WITH_MIGRATE; then
    log "Running DB setup first..."
    if [ -z "${DATABASE_URL:-}" ]; then
      err "DATABASE_URL is required for --with-migrate"
      exit 1
    fi
    "$SCRIPT_DIR/setup-db.sh"
    echo ""
  fi

  log "Checking env vars for backend..."
  "$SCRIPT_DIR/check-env.sh" --backend --production || {
    err "Backend env check failed. Fix the issues above before deploying."
    exit 1
  }
  echo ""

  if git -C "$ROOT_DIR" diff --quiet HEAD -- backend/; then
    info "No uncommitted changes in backend/."
  else
    warn "You have uncommitted changes in backend/. Commit and push to trigger Render auto-deploy."
  fi

  info "Render deploys automatically when you push to the main branch."
  info "To trigger a manual deploy, go to: https://dashboard.render.com"
  info "  Service → Manual Deploy → Deploy latest commit"
  echo ""

  if check_cli "render" "pip install render-cli" 2>/dev/null; then
    read -rp "Trigger Render deploy now via CLI? [y/N] " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      render deploys create --wait
      log "Backend deploy complete!"
    fi
  fi
}

# --- Frontend deploy ---
deploy_frontend() {
  log "Deploying frontend to Vercel..."

  log "Checking env vars for frontend..."
  "$SCRIPT_DIR/check-env.sh" --frontend --production || {
    err "Frontend env check failed. Fix the issues above before deploying."
    exit 1
  }
  echo ""

  if ! check_cli "vercel" "npm i -g vercel"; then
    err "vercel CLI is required for frontend deploy."
    exit 1
  fi

  cd "$ROOT_DIR/frontend"

  log "Running vercel --prod..."
  VERCEL_URL=$(vercel --prod --yes 2>&1 | tail -1)
  echo ""

  log "Frontend deployed!"
  info "URL: $VERCEL_URL"
  echo ""

  warn "Remember to update CORS_ORIGIN in Render if the URL changed:"
  info "  CORS_ORIGIN=$VERCEL_URL"
}

# --- Summary ---
print_summary() {
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
  echo -e "${GREEN}  Deploy complete!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
  echo ""

  if [ "$TARGET" = "all" ] || [ "$TARGET" = "back" ]; then
    info "Backend (Render):  check https://dashboard.render.com for status"
  fi
  if [ "$TARGET" = "all" ] || [ "$TARGET" = "front" ]; then
    info "Frontend (Vercel): check vercel dashboard or URL above"
  fi
  echo ""
  info "Post-deploy checklist:"
  echo "  1. Verify backend is running (check Render logs)"
  echo "  2. Verify frontend loads (visit Vercel URL)"
  echo "  3. Test login with superadmin@corelia.local / Admin123!"
  echo "  4. Check CORS_ORIGIN in Render matches Vercel URL"
}

# --- Run ---
echo ""
log "Target: $TARGET"
echo ""

if [ "$TARGET" = "all" ] || [ "$TARGET" = "back" ]; then
  deploy_backend
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "front" ]; then
  deploy_frontend
fi

print_summary
