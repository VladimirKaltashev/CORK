#!/usr/bin/env bash
# ============================================================
# CORK — Start script for macOS / Linux
# Usage:
#   ./start.sh              # normal start
#   ./start.sh --reset      # apply migrations + seed before starting
#   ./start.sh --no-browser # don't open browser tab
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RESET=false
NO_BROWSER=false

for arg in "$@"; do
  case $arg in
    --reset) RESET=true ;;
    --no-browser) NO_BROWSER=true ;;
    -h|--help)
      echo "Usage: $0 [--reset] [--no-browser]"
      echo "  --reset       Run 'supabase db reset' before starting Vite"
      echo "  --no-browser  Do not open browser automatically"
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

SUPABASE_CLI="supabase"
DEV_URL="http://localhost:5173"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

section() {
  echo -e "\n${CYAN}==> $1${NC}"
}

error_exit() {
  echo -e "${RED}$1${NC}" >&2
  exit 1
}

# 1. Check / Start Docker
section "Docker"
if docker info >/dev/null 2>&1; then
  echo "Already running."
else
  echo "Docker not running. Attempting to start..."
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS: try to open Docker Desktop, if not installed — install via Homebrew
    if open -a Docker 2>/dev/null; then
      : # opened successfully
    else
      echo "Docker Desktop not found. Installing via Homebrew..."
      if command -v brew >/dev/null 2>&1; then
        brew install --cask docker || error_exit "Failed to install Docker Desktop via Homebrew. Install manually from https://docker.com"
        echo "Docker Desktop installed. Launching..."
        open -a Docker || error_exit "Failed to launch Docker Desktop. Open it manually from Applications."
      else
        error_exit "Homebrew not found. Install Docker Desktop manually from https://docker.com"
      fi
    fi
  elif command -v systemctl >/dev/null 2>&1; then
    # Linux with systemd
    if ! command -v docker >/dev/null 2>&1; then
      echo "Docker not installed. Install it first:"
      echo "  Ubuntu/Debian: sudo apt update && sudo apt install -y docker.io"
      echo "  Or: https://docs.docker.com/engine/install/ubuntu/"
      error_exit "Docker not installed."
    fi
    sudo systemctl start docker || error_exit "Failed to start Docker via systemctl. Start Docker manually."
  else
    error_exit "Docker is not running. Please start Docker Desktop (macOS) or Docker daemon (Linux) manually."
  fi

  echo -n "Waiting for Docker daemon"
  for i in {1..60}; do
    if docker info >/dev/null 2>&1; then
      echo " ready."
      break
    fi
    echo -n "."
    sleep 2
  done
  if ! docker info >/dev/null 2>&1; then
    error_exit "\nDocker did not become ready within 2 minutes."
  fi
fi

# 2. Supabase CLI check
section "Supabase CLI"
if ! command -v "$SUPABASE_CLI" >/dev/null 2>&1; then
  echo "Supabase CLI not found. Attempting to install..."
  if [[ "$(uname)" == "Darwin" ]] && command -v brew >/dev/null 2>&1; then
    brew install supabase || error_exit "Failed to install Supabase CLI via Homebrew."
  elif command -v curl >/dev/null 2>&1; then
    curl -fsSL https://supabase.com/install.sh | sh || error_exit "Failed to install Supabase CLI via installer."
    # Add to PATH for current session
    export PATH="$HOME/.supabase/bin:$PATH"
  else
    error_exit "Supabase CLI not found. Install it: https://supabase.com/docs/guides/cli"
  fi
fi
echo "Found: $($SUPABASE_CLI --version)"

# 3. Start Supabase
section "Supabase"
if $SUPABASE_CLI status >/dev/null 2>&1; then
  echo "Already running."
else
  echo "Starting Supabase stack..."
  $SUPABASE_CLI start || error_exit "Supabase failed to start. Check 'supabase status' for details."
fi

# 4. Optional db reset
if $RESET; then
  section "Applying migrations + seed (db reset)"
  $SUPABASE_CLI db reset || error_exit "db reset failed."
fi

# 5. Ensure .env.local exists with Supabase credentials
if [[ ! -f .env.local ]]; then
  section "Creating .env.local from Supabase status"
  # Extract API URL and anon key from supabase status
  STATUS_OUT=$($SUPABASE_CLI status --output json 2>/dev/null || $SUPABASE_CLI status)
  API_URL=$(echo "$STATUS_OUT" | grep -o '"API URL": "[^"]*"' | cut -d'"' -f4 | head -1)
  ANON_KEY=$(echo "$STATUS_OUT" | grep -o '"anon key": "[^"]*"' | cut -d'"' -f4 | head -1)

  if [[ -z "$API_URL" || -z "$ANON_KEY" ]]; then
    echo -e "${YELLOW}Could not auto-detect Supabase credentials.${NC}"
    echo "Run 'supabase status' and manually create .env.local with:"
    echo "  VITE_SUPABASE_URL=<API URL>"
    echo "  VITE_SUPABASE_ANON_KEY=<anon key>"
  else
    cat > .env.local <<EOF
VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
EOF
    echo "Created .env.local"
  fi
fi

# 6. Open browser
if [[ "$NO_BROWSER" != true ]]; then
  section "Opening browser"
  if [[ "$(uname)" == "Darwin" ]]; then
    open "$DEV_URL" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$DEV_URL" 2>/dev/null || true
  else
    echo "Open $DEV_URL in your browser."
  fi
fi

# 7. Start Vite dev server
section "Vite dev-server"
echo "Press Ctrl+C to stop the dev-server. Supabase keeps running."
echo ""
npm run dev