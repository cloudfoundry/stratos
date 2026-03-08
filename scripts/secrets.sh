#!/usr/bin/env bash
set -euo pipefail

# Secrets management wrapper for Stratos E2E tests
#
# Subcommands:
#   fetch     — Fetch secrets from Bitwarden to stdout
#   decrypt   — Decrypt SOPS file to stdout (offline fallback)
#   encrypt   — Fetch from Bitwarden and encrypt with SOPS+age
#   run-e2e   — Fetch secrets and run E2E tests (nothing on disk)
#
# Prerequisites: bw, sops, age
# See docs/secrets-management.md for full setup guide.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOPS_FILE="$PROJECT_ROOT/secrets.yaml.enc"
BW_ITEM_NAME="stratos-e2e-secrets"

die() { echo "ERROR: $*" >&2; exit 1; }

ensure_bw_unlocked() {
  command -v bw >/dev/null 2>&1 || die "bw CLI not found. Install: brew install bitwarden-cli"

  if ! bw unlock --check >/dev/null 2>&1; then
    echo "Bitwarden vault is locked. Unlocking..." >&2
    export BW_SESSION
    BW_SESSION=$(bw unlock --raw) || die "Failed to unlock Bitwarden vault"
  fi

  if [ -z "${BW_SESSION:-}" ]; then
    export BW_SESSION
    BW_SESSION=$(bw unlock --raw) || die "Failed to get Bitwarden session"
  fi
}

cmd_fetch() {
  ensure_bw_unlocked
  bw get notes "$BW_ITEM_NAME" || die "Failed to fetch '$BW_ITEM_NAME' from Bitwarden"
}

cmd_decrypt() {
  command -v sops >/dev/null 2>&1 || die "sops not found. Install: brew install sops"
  [ -f "$SOPS_FILE" ] || die "Encrypted secrets file not found: $SOPS_FILE"
  sops --decrypt "$SOPS_FILE"
}

cmd_encrypt() {
  command -v sops >/dev/null 2>&1 || die "sops not found. Install: brew install sops"

  local age_keys="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
  [ -f "$age_keys" ] || die "age key file not found: $age_keys\nGenerate with: age-keygen -o $age_keys"

  local pubkey
  pubkey=$(grep "public key:" "$age_keys" | head -1 | cut -d: -f2 | tr -d ' ')
  [ -n "$pubkey" ] || die "Could not extract public key from $age_keys"

  cmd_fetch | sops --encrypt --age "$pubkey" /dev/stdin > "$SOPS_FILE"
  echo "Encrypted secrets written to $SOPS_FILE" >&2
}

cmd_run_e2e() {
  echo "Fetching secrets from Bitwarden..." >&2
  STRATOS_SECRETS=$(cmd_fetch)
  export STRATOS_SECRETS

  echo "Running E2E tests..." >&2
  cd "$PROJECT_ROOT"
  exec npm run e2e -- "$@"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [args...]

Commands:
  fetch      Fetch secrets from Bitwarden (stdout)
  decrypt    Decrypt SOPS file to stdout (offline)
  encrypt    Fetch from Bitwarden, encrypt with SOPS+age
  run-e2e    Fetch secrets and run E2E tests

Examples:
  ./scripts/secrets.sh run-e2e
  ./scripts/secrets.sh fetch | less
  STRATOS_SECRETS=\$(./scripts/secrets.sh decrypt) npm run e2e
EOF
  exit 1
}

case "${1:-}" in
  fetch)    shift; cmd_fetch "$@" ;;
  decrypt)  shift; cmd_decrypt "$@" ;;
  encrypt)  shift; cmd_encrypt "$@" ;;
  run-e2e)  shift; cmd_run_e2e "$@" ;;
  *)        usage ;;
esac
