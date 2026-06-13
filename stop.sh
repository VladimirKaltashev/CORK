#!/usr/bin/env bash
# ============================================================
# CORK — Stop script for macOS / Linux
# Stops the local Supabase stack (DB volume preserved).
# Usage:
#   ./stop.sh           # stop with backup (default)
#   ./stop.sh --no-backup  # stop without DB dump
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NO_BACKUP=false

for arg in "$@"; do
  case $arg in
    --no-backup) NO_BACKUP=true ;;
    -h|--help)
      echo "Usage: $0 [--no-backup]"
      echo "  --no-backup  Pass --no-backup to 'supabase stop' (no DB dump before shutdown)"
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

SUPABASE_CLI="supabase"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

section() {
  echo -e "\n${CYAN}==> $1${NC}"
}

# Check Docker is running (Supabase needs it)
if ! docker info >/dev/null 2>&1; then
  echo -e "${YELLOW}Docker is not running — nothing to stop.${NC}"
  exit 0
fi

# Check Supabase CLI
if ! command -v "$SUPABASE_CLI" >/dev/null 2>&1; then
  echo -e "${RED}Supabase CLI not found in PATH.${NC}"
  exit 1
fi

section "Supabase"
echo "Stopping Supabase containers..."

if $NO_BACKUP; then
  $SUPABASE_CLI stop --no-backup
else
  $SUPABASE_CLI stop
fi

if [[ $? -ne 0 ]]; then
  echo -e "${RED}Supabase stop failed.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Done. DB volume preserved — run ./start.sh to resume.${NC}"