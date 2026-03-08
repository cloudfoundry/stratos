#!/usr/bin/env bash
set -euo pipefail

# Secrets management wrapper for Stratos E2E tests
#
# Subcommands:
#   fetch       — Fetch secrets from Bitwarden to stdout
#   decrypt     — Decrypt SOPS file to stdout (offline fallback)
#   encrypt     — Fetch from Bitwarden and encrypt with SOPS+age
#   run-e2e     — Fetch secrets and run E2E tests (nothing on disk)
#   create-note — Create the Bitwarden Secure Note from a YAML file
#   delete-note — Delete the Bitwarden Secure Note (handles duplicates)
#
# Prerequisites: bw, sops, age
# See docs/secrets-management.md for full setup guide.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOPS_FILE="$PROJECT_ROOT/secrets.yaml.enc"
BW_ITEM_NAME="stratos-e2e-secrets"

# Common sops flags: explicit YAML types, skip .sops.yaml (we pass --age directly)
SOPS_COMMON=(--input-type yaml --output-type yaml --config /dev/null)

die() { echo "ERROR: $*" >&2; exit 1; }

# Resolve age key file: SOPS_AGE_KEY_FILE > platform default
resolve_age_key_file() {
  if [ -n "${SOPS_AGE_KEY_FILE:-}" ]; then
    echo "$SOPS_AGE_KEY_FILE"
    return
  fi
  # macOS: ~/Library/Application Support/sops/age/keys.txt
  # Linux: ~/.config/sops/age/keys.txt (XDG_CONFIG_HOME)
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

  local age_keys
  age_keys=$(resolve_age_key_file) || die "age key file not found. Set SOPS_AGE_KEY_FILE or run: age-keygen -o \"\$(sops age-key-file-path)\""

  SOPS_AGE_KEY_FILE="$age_keys" sops --decrypt "${SOPS_COMMON[@]}" "$SOPS_FILE"
}

cmd_encrypt() {
  command -v sops >/dev/null 2>&1 || die "sops not found. Install: brew install sops"

  local age_keys
  age_keys=$(resolve_age_key_file) || die "age key file not found. Set SOPS_AGE_KEY_FILE or generate a keypair with: age-keygen"

  local pubkey
  pubkey=$(grep "public key:" "$age_keys" | head -1 | cut -d: -f2 | tr -d ' ')
  [ -n "$pubkey" ] || die "Could not extract public key from $age_keys"

  local tmpfile
  tmpfile=$(mktemp)
  trap 'rm -f "$tmpfile"' EXIT
  cmd_fetch > "$tmpfile"
  SOPS_AGE_RECIPIENTS="$pubkey" sops --encrypt "${SOPS_COMMON[@]}" "$tmpfile" > "$SOPS_FILE"
  rm -f "$tmpfile"
  trap - EXIT
  echo "Encrypted secrets written to $SOPS_FILE" >&2
}

cmd_create_note() {
  local source="${1:-$PROJECT_ROOT/e2e/secrets.yaml.template}"
  [ -f "$source" ] || die "Source file not found: $source"

  ensure_bw_unlocked

  # Guard against duplicates
  local matches
  matches=$(bw list items --search "$BW_ITEM_NAME" 2>/dev/null | jq '[.[] | select(.name == "'"$BW_ITEM_NAME"'")] | length')
  if [ "$matches" -gt 1 ]; then
    die "Multiple items named '$BW_ITEM_NAME' found in Bitwarden. Clean up duplicates with 'delete-note' first."
  elif [ "$matches" -eq 1 ]; then
    die "'$BW_ITEM_NAME' already exists in Bitwarden. Use 'bw edit' to update it, or 'delete-note' to remove it first."
  fi

  local notes
  notes=$(cat "$source")

  # Use jq --arg to safely embed the file content as a JSON string value.
  # Use printf '%s' (not echo) to pipe the result — echo re-interprets
  # escape sequences like \n in the JSON, corrupting the payload.
  local item
  item=$(jq -n --arg notes "$notes" '{
    passwordHistory: [], revisionDate: null, creationDate: null,
    deletedDate: null, archivedDate: null, organizationId: null,
    collectionIds: null, folderId: null, type: 2,
    name: "'"$BW_ITEM_NAME"'", notes: $notes, favorite: false,
    fields: [], login: null, secureNote: { type: 0 },
    card: null, identity: null, sshKey: null, reprompt: 0
  }')

  printf '%s' "$item" | bw encode | bw create item > /dev/null \
    || die "Failed to create Bitwarden Secure Note"

  echo "Created Bitwarden Secure Note '$BW_ITEM_NAME' from $source" >&2
  echo "Edit the note with your actual credentials via the web UI or 'bw edit'" >&2
}

cmd_delete_note() {
  ensure_bw_unlocked

  local ids
  ids=$(bw list items --search "$BW_ITEM_NAME" 2>/dev/null | jq -r '[.[] | select(.name == "'"$BW_ITEM_NAME"'")] | .[].id')

  if [ -z "$ids" ]; then
    die "No item named '$BW_ITEM_NAME' found in Bitwarden."
  fi

  local count
  count=$(echo "$ids" | wc -l | tr -d ' ')

  if [ "$count" -gt 1 ]; then
    echo "Found $count items named '$BW_ITEM_NAME' — deleting all duplicates:" >&2
  fi

  local id
  for id in $ids; do
    bw delete item "$id" || die "Failed to delete item $id"
    echo "Deleted $id" >&2
  done

  echo "Removed $count item(s) named '$BW_ITEM_NAME'" >&2
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
  fetch        Fetch secrets from Bitwarden (stdout)
  decrypt      Decrypt SOPS file to stdout (offline)
  encrypt      Fetch from Bitwarden, encrypt with SOPS+age
  run-e2e      Fetch secrets and run E2E tests
  create-note  Create Bitwarden Secure Note from file
  delete-note  Delete Bitwarden Secure Note (handles duplicates)

Examples:
  ./scripts/secrets.sh run-e2e
  ./scripts/secrets.sh fetch | less
  ./scripts/secrets.sh create-note secrets.yaml
  ./scripts/secrets.sh delete-note
  STRATOS_SECRETS=\$(./scripts/secrets.sh decrypt) npm run e2e
EOF
  exit 1
}

case "${1:-}" in
  fetch)       shift; cmd_fetch "$@" ;;
  decrypt)     shift; cmd_decrypt "$@" ;;
  encrypt)     shift; cmd_encrypt "$@" ;;
  run-e2e)     shift; cmd_run_e2e "$@" ;;
  create-note) shift; cmd_create_note "$@" ;;
  delete-note) shift; cmd_delete_note "$@" ;;
  *)           usage ;;
esac
