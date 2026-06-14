#!/usr/bin/env bash
# ============================================================
# CORK — Start script for macOS / Linux
# Usage:
#   ./start.sh              # normal start
#   ./start.sh --reset      # apply migrations + seed before starting
#   ./start.sh --no-browser # don't open browser tab
#   ./start.sh --check-only # only check dependencies, don't start
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RESET=false
NO_BROWSER=false
CHECK_ONLY=false

for arg in "$@"; do
  case $arg in
    --reset) RESET=true ;;
    --no-browser) NO_BROWSER=true ;;
    --check-only) CHECK_ONLY=true ;;
    -h|--help)
      echo "Usage: $0 [--reset] [--no-browser] [--check-only]"
      echo "  --reset       Run 'supabase db reset' before starting Vite"
      echo "  --no-browser  Do not open browser automatically"
      echo "  --check-only  Only check dependencies, print missing ones and exit"
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

SUPABASE_CLI="supabase"
DEV_URL="http://localhost:5173"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

section() { echo -e "\n${CYAN}==> $1${NC}"; }
info() { echo -e "${GREEN}$1${NC}"; }
warn() { echo -e "${YELLOW}$1${NC}"; }
err() { echo -e "${RED}$1${NC}" >&2; }

# ── Detect OS and required deps ──────────────────────────────────────────────
detect_platform() {
  case "$(uname -s)" in
    Darwin) PLATFORM="macos" ;;
    Linux)  PLATFORM="linux" ;;
    *)      err "Unsupported OS: $(uname -s)"; exit 1 ;;
  esac
}

check_deps() {
  MISSING=()
  INSTALL_CMDS=()

  # Docker
  if ! command -v docker >/dev/null 2>&1; then
    MISSING+=("Docker (docker CLI)")
    case $PLATFORM in
      macos) INSTALL_CMDS+=("brew install --cask docker   # Docker Desktop") ;;
      linux) INSTALL_CMDS+=("# Ubuntu/Debian: sudo apt update && sudo apt install -y docker.io") ;;
    esac
  elif ! docker info >/dev/null 2>&1; then
    MISSING+=("Docker daemon (not running)")
    case $PLATFORM in
      macos) INSTALL_CMDS+=("open -a Docker   # Start Docker Desktop") ;;
      linux) INSTALL_CMDS+=("sudo systemctl start docker") ;;
    esac
  fi

  # Supabase CLI
  if ! command -v "$SUPABASE_CLI" >/dev/null 2>&1; then
    MISSING+=("Supabase CLI (supabase)")
    case $PLATFORM in
      macos) INSTALL_CMDS+=("brew install supabase") ;;
      linux) INSTALL_CMDS+=("curl -fsSL https://supabase.com/install.sh | sh") ;;
    esac
  fi

  # Node / npm
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    MISSING+=("Node.js + npm")
    case $PLATFORM in
      macos) INSTALL_CMDS+=("brew install node") ;;
      linux) INSTALL_CMDS+=("# Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm") ;;
    esac
  fi

  # npm dependencies (node_modules)
  if [[ ! -d node_modules ]]; then
    MISSING+=("npm dependencies (node_modules)")
    INSTALL_CMDS+=("npm install")
  fi

  if [[ ${#MISSING[@]} -gt 0 ]]; then
    err "Missing dependencies:"
    for i in "${!MISSING[@]}"; do
      echo -e "  ${RED}✗${NC} ${MISSING[$i]}"
    done
    echo ""
    warn "Install them with:"
    for cmd in "${INSTALL_CMDS[@]}"; do
      echo -e "  ${CYAN}$cmd${NC}"
    done
    echo ""
    info "After installing, run ./start.sh again."
    return 1
  fi
  return 0
}

# ── Main ─────────────────────────────────────────────────────────────────────
detect_platform
section "Platform: $PLATFORM"

section "Checking dependencies"
if ! check_deps; then
  [[ "$CHECK_ONLY" == true ]] && exit 1 || exit 1
fi
info "All dependencies satisfied."

if [[ "$CHECK_ONLY" == true ]]; then
  info "Check passed. Ready to start."
  exit 0
fi

# 1. Ensure Docker daemon is running
section "Docker"
if docker info >/dev/null 2>&1; then
  info "Already running."
else
  warn "Docker daemon not running. Starting..."
  case $PLATFORM in
    macos) open -a Docker ;;
    linux) sudo systemctl start docker || err "Failed to start Docker. Run 'sudo systemctl start docker' manually." ;;
  esac
  echo -n "Waiting for Docker daemon"
  for i in {1..60}; do
    if docker info >/dev/null 2>&1; then echo " ready."; break; fi
    echo -n "."; sleep 2
  done
  docker info >/dev/null 2>&1 || err "Docker did not become ready within 2 minutes."
fi

# 2. Start Supabase
section "Supabase"
if $SUPABASE_CLI status >/dev/null 2>&1; then
  info "Already running."
else
  warn "Starting Supabase stack..."
  if ! $SUPABASE_CLI start; then
    warn "Supabase start failed. Attempting to stop and retry..."
    $SUPABASE_CLI stop --no-backup 2>/dev/null || true
    # Wait for port 54322 to be free
    warn "Waiting for port 54322 to be released..."
    for i in {1..30}; do
      if ! lsof -i :54322 >/dev/null 2>&1; then
        break
      fi
      echo -n "."
      sleep 1
    done
    $SUPABASE_CLI start || err "Supabase failed to start after retry. Run 'supabase status' for details."
  fi
fi

# 3. Optional db reset
if $RESET; then
  section "Applying migrations + seed (db reset)"
  $SUPABASE_CLI db reset || err "db reset failed."
fi

# 4. Ensure .env.local
if [[ ! -f .env.local ]]; then
  section "Creating .env.local from Supabase status"
  STATUS_OUT=$($SUPABASE_CLI status --output json 2>/dev/null || $SUPABASE_CLI status)
  # Parse JSON output (keys: API_URL, ANON_KEY)
  if command -v jq >/dev/null 2>&1; then
    API_URL=$(echo "$STATUS_OUT" | jq -r '.API_URL // empty')
    ANON_KEY=$(echo "$STATUS_OUT" | jq -r '.ANON_KEY // empty')
  else
    API_URL=$(echo "$STATUS_OUT" | grep -o '"API_URL": "[^"]*"' | cut -d'"' -f4 | head -1)
    ANON_KEY=$(echo "$STATUS_OUT" | grep -o '"ANON_KEY": "[^"]*"' | cut -d'"' -f4 | head -1)
  fi
  if [[ -z "$API_URL" || -z "$ANON_KEY" ]]; then
    warn "Could not auto-detect Supabase credentials."
    echo "Run 'supabase status' and manually create .env.local with:"
    echo "  VITE_SUPABASE_URL=<API URL>"
    echo "  VITE_SUPABASE_ANON_KEY=<anon key>"
  else
    cat > .env.local <<EOF
VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
EOF
    info "Created .env.local"
  fi
fi

# 5. Open browser
if [[ "$NO_BROWSER" != true ]]; then
  section "Opening browser"
  case $PLATFORM in
    macos) open "$DEV_URL" 2>/dev/null || true ;;
    linux) xdg-open "$DEV_URL" 2>/dev/null || true ;;
  esac
fi

# 6. Start Vite
section "Vite dev-server"
info "Press Ctrl+C to stop. Supabase keeps running."
echo ""
npm run dev