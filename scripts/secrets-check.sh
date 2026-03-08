#!/usr/bin/env bash
set -euo pipefail

# Validate that all secrets management prerequisites are installed and configured.
# Exit 0 if everything passes, non-zero otherwise.

PASS=0
FAIL=0

# Resolve age key file: SOPS_AGE_KEY_FILE > platform default
resolve_age_key_file() {
  if [ -n "${SOPS_AGE_KEY_FILE:-}" ]; then
    echo "$SOPS_AGE_KEY_FILE"
    return
  fi
  local xdg="${XDG_CONFIG_HOME:-}"
  if [ -n "$xdg" ] && [ -f "$xdg/sops/age/keys.txt" ]; then
    echo "$xdg/sops/age/keys.txt"
  elif [ -f "$HOME/Library/Application Support/sops/age/keys.txt" ]; then
    echo "$HOME/Library/Application Support/sops/age/keys.txt"
  elif [ -f "$HOME/.config/sops/age/keys.txt" ]; then
    echo "$HOME/.config/sops/age/keys.txt"
  else
    return 1
  fi
}

AGE_KEY_FILE=$(resolve_age_key_file 2>/dev/null) || AGE_KEY_FILE="(not found)"

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "  PASS  $label"
    ((PASS++)) || true
  else
    echo "  FAIL  $label"
    ((FAIL++)) || true
  fi
}

echo "Secrets management prerequisite check"
echo "======================================"
echo ""

# Tool availability
check "bw CLI installed"    command -v bw
check "sops installed"      command -v sops
check "age installed"       command -v age

# age keypair
check "age keypair exists ($AGE_KEY_FILE)" test -f "$AGE_KEY_FILE"

# Bitwarden status
if command -v bw >/dev/null 2>&1; then
  check "bw logged in"     bw login --check
  check "bw vault unlocked" bw unlock --check
else
  echo "  SKIP  bw logged in (bw not installed)"
  echo "  SKIP  bw vault unlocked (bw not installed)"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Fix instructions:"
  command -v bw   >/dev/null 2>&1 || echo "  brew install bitwarden-cli"
  command -v sops >/dev/null 2>&1 || echo "  brew install sops"
  command -v age  >/dev/null 2>&1 || echo "  brew install age"
  [ -f "$AGE_KEY_FILE" ] 2>/dev/null || echo "  age-keygen (then place keys.txt where sops expects it)"
  if command -v bw >/dev/null 2>&1; then
    bw login --check >/dev/null 2>&1   || echo "  bw login"
    bw unlock --check >/dev/null 2>&1  || echo "  bw unlock  (then export BW_SESSION — required for every shell)"
  fi
  exit 1
fi
