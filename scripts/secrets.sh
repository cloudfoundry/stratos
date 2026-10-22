#!/usr/bin/env bash
#
# secrets.sh — Zero-plaintext secrets management
#
# Encrypt, decrypt, and inject secrets for E2E tests and local development.
# Supports per-environment files and both OpenSSL and SOPS+age backends.
#
# Usage:
#   secrets.sh encrypt [--env NAME] [--backend sops|openssl] [--keychain SERVICE]
#   secrets.sh decrypt [--env NAME] [--backend sops|openssl] [--keychain SERVICE]
#   secrets.sh run-e2e [--env NAME] [--backend sops|openssl] [--keychain SERVICE]
#                      [-- ARGS...]
#   secrets.sh check [--backend sops|openssl] [--keychain SERVICE]
#
# Environment files:
#   Default:    secrets.yaml / secrets.yaml.enc
#   With --env: secrets.<env>.yaml / secrets.<env>.yaml.enc
#
# Backends:
#   openssl  — AES-256-CBC with PBKDF2 (default, no extra tools needed)
#   sops     — SOPS + age (requires sops and age installed)
#
# Keychain passphrase (openssl backend, macOS):
#   By default openssl prompts for the passphrase. With --keychain SERVICE
#   (or STRATOS_SECRETS_KEYCHAIN=SERVICE) it is read instead from the
#   generic password item with that service and account "passphrase",
#   and handed to openssl on a file descriptor, never in argv or the
#   environment. The convention is service "stratos-e2e-secrets"; every
#   --env file uses that item unless a per-env service is named.
#   Add the item once (security prompts for the value):
#     security add-generic-password -s stratos-e2e-secrets -a passphrase -w
#   A missing item, or no `security` command (Linux), is an error; it
#   never falls back to the prompt. Files are the same either way.
#
# Environment variables:
#   E2E_ENV       — Default --env value
#   STRATOS_SECRETS_BACKEND — Default --backend value (openssl|sops)
#   STRATOS_SECRETS_KEYCHAIN — Default --keychain value (Keychain service)
#   SOPS_AGE_KEY_FILE     — Path to age key file (for sops backend)
#
# Portability:
#   This script has no repo-specific paths. It operates on secrets.yaml
#   (or secrets.<env>.yaml) in the directory where it is invoked, or
#   relative to the repo root if found via git.

set -euo pipefail

# ── Resolve repo root ─────────────────────────────────────────
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# ── Defaults ──────────────────────────────────────────────────
ENV_NAME="${E2E_ENV:-}"
BACKEND="${STRATOS_SECRETS_BACKEND:-openssl}"
KEYCHAIN_SERVICE="${STRATOS_SECRETS_KEYCHAIN:-}"
KEYCHAIN_ACCOUNT="passphrase"
COMMAND=""
E2E_ARGS=()

# ── Usage ─────────────────────────────────────────────────────
usage() {
  cat <<'USAGE'
Usage: secrets.sh <command> [options]

Commands:
  encrypt     Encrypt secrets.yaml → secrets.yaml.enc
  decrypt     Decrypt secrets.yaml.enc → secrets.yaml
  run-e2e     Decrypt to memory, run E2E tests, clean up
  check       Validate prerequisites for chosen backend

Options:
  --env NAME       Environment name (e.g., local, staging, prod)
                   Uses secrets.<env>.yaml / secrets.<env>.yaml.enc
  --backend TYPE   Encryption backend: openssl (default) or sops
  --keychain SVC   openssl backend: read the passphrase from the macOS
                   Keychain item with service SVC, account "passphrase",
                   instead of prompting (e.g. stratos-e2e-secrets)
  --help           Show this help

Examples:
  secrets.sh encrypt                         # Encrypt default secrets
  secrets.sh decrypt --env local             # Decrypt local env secrets
  secrets.sh run-e2e --env staging -- --headed  # Run tests against staging
  secrets.sh check --backend sops            # Check sops prerequisites
  secrets.sh run-e2e --keychain stratos-e2e-secrets  # No passphrase prompt
USAGE
  exit "${1:-0}"
}

# ── Parse arguments ───────────────────────────────────────────
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      encrypt|decrypt|run-e2e|check)
        COMMAND="$1"; shift ;;
      --env)
        ENV_NAME="${2:?--env requires a value}"; shift 2 ;;
      --backend)
        BACKEND="${2:?--backend requires a value}"; shift 2 ;;
      --keychain)
        KEYCHAIN_SERVICE="${2:?--keychain requires a value}"; shift 2 ;;
      --help|-h)
        usage 0 ;;
      --)
        shift; E2E_ARGS=("$@"); break ;;
      *)
        echo "Error: unknown argument '$1'" >&2
        usage 1 ;;
    esac
  done

  if [[ -z "${COMMAND}" ]]; then
    usage 0
  fi
}

# ── File paths ────────────────────────────────────────────────
plaintext_path() {
  if [[ -n "${ENV_NAME}" ]]; then
    echo "${ROOT_DIR}/secrets.${ENV_NAME}.yaml"
  else
    echo "${ROOT_DIR}/secrets.yaml"
  fi
}

encrypted_path() {
  if [[ -n "${ENV_NAME}" ]]; then
    echo "${ROOT_DIR}/secrets.${ENV_NAME}.yaml.enc"
  else
    echo "${ROOT_DIR}/secrets.yaml.enc"
  fi
}

# ── Keychain passphrase ───────────────────────────────────────
# Fails unless the Keychain item exists. The lookup leaves out -w, so it
# only confirms the item; the passphrase is read later, straight into
# openssl's file descriptor.
keychain_require() {
  if ! command -v security &>/dev/null; then
    echo "Error: a Keychain service is set, but 'security' command not found (macOS only)" >&2
    exit 1
  fi
  if ! security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" &>/dev/null; then
    echo "Error: no Keychain item for service '${KEYCHAIN_SERVICE}', account '${KEYCHAIN_ACCOUNT}'" >&2
    echo "  Add it with: security add-generic-password -s ${KEYCHAIN_SERVICE} -a ${KEYCHAIN_ACCOUNT} -w" >&2
    exit 1
  fi
}

# ── OpenSSL backend ───────────────────────────────────────────
# Runs openssl enc with the passphrase from the Keychain on fd 3 when a
# service is set; otherwise openssl prompts for it as before. openssl
# takes the first line of fd 3 without its newline, the same passphrase
# the prompt would have read, so files stay interchangeable.
openssl_enc() {
  if [[ -z "${KEYCHAIN_SERVICE}" ]]; then
    openssl enc "$@"
    return
  fi
  keychain_require
  openssl enc "$@" -pass fd:3 \
    3< <(security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" -w)
}

openssl_encrypt() {
  local plain="$1" encrypted="$2"
  openssl_enc -aes-256-cbc -salt -pbkdf2 -in "${plain}" -out "${encrypted}"
}

openssl_decrypt() {
  local encrypted="$1" plain="$2"
  openssl_enc -aes-256-cbc -d -pbkdf2 -in "${encrypted}" -out "${plain}"
}

openssl_decrypt_stdout() {
  local encrypted="$1"
  openssl_enc -aes-256-cbc -d -pbkdf2 -in "${encrypted}"
}

openssl_check() {
  if ! command -v openssl &>/dev/null; then
    echo "FAIL: openssl not found" >&2
    return 1
  fi
  echo "OK: openssl $(openssl version 2>&1 | head -1)"
  if [[ -n "${KEYCHAIN_SERVICE}" ]]; then
    keychain_require
    echo "OK: Keychain item '${KEYCHAIN_SERVICE}' (account '${KEYCHAIN_ACCOUNT}') found"
  fi
}

# ── SOPS+age backend ─────────────────────────────────────────
sops_encrypt() {
  local plain="$1" encrypted="$2"
  sops encrypt --input-type yaml --output-type yaml "${plain}" > "${encrypted}"
}

sops_decrypt() {
  local encrypted="$1" plain="$2"
  sops decrypt --input-type yaml --output-type yaml "${encrypted}" > "${plain}"
}

sops_decrypt_stdout() {
  local encrypted="$1"
  sops decrypt --input-type yaml --output-type yaml "${encrypted}"
}

sops_check() {
  local ok=true
  if ! command -v sops &>/dev/null; then
    echo "FAIL: sops not found — install with: brew install sops" >&2
    ok=false
  else
    echo "OK: sops $(sops --version 2>&1 | head -1)"
  fi

  if ! command -v age &>/dev/null; then
    echo "FAIL: age not found — install with: brew install age" >&2
    ok=false
  else
    echo "OK: age $(age --version 2>&1 | head -1)"
  fi

  local key_file="${SOPS_AGE_KEY_FILE:-${HOME}/.config/sops/age/keys.txt}"
  if [[ ! -f "${key_file}" ]]; then
    echo "FAIL: age key file not found at ${key_file}" >&2
    echo "  Generate with: age-keygen -o ${key_file}" >&2
    ok=false
  else
    echo "OK: age key file exists at ${key_file}"
  fi

  if [[ -f "${ROOT_DIR}/.sops.yaml" ]]; then
    echo "OK: .sops.yaml config found"
  else
    echo "WARN: no .sops.yaml in repo root — sops will use defaults" >&2
  fi

  ${ok}
}

# ── Backend dispatch ──────────────────────────────────────────
do_encrypt() {
  local plain encrypted
  plain="$(plaintext_path)"
  encrypted="$(encrypted_path)"

  if [[ ! -f "${plain}" ]]; then
    echo "Error: ${plain} not found" >&2
    exit 1
  fi

  case "${BACKEND}" in
    openssl) openssl_encrypt "${plain}" "${encrypted}" ;;
    sops)    sops_encrypt "${plain}" "${encrypted}" ;;
    *)       echo "Error: unknown backend '${BACKEND}'" >&2; exit 1 ;;
  esac

  echo "Encrypted: ${encrypted}"
}

do_decrypt() {
  local plain encrypted
  plain="$(plaintext_path)"
  encrypted="$(encrypted_path)"

  if [[ ! -f "${encrypted}" ]]; then
    echo "Error: ${encrypted} not found" >&2
    exit 1
  fi

  if [[ -f "${plain}" ]]; then
    echo "Warning: ${plain} already exists and will be overwritten"
    read -r -p "Continue? [y/N] " confirm
    if [[ "${confirm}" != [yY] ]]; then
      echo "Aborted"
      exit 0
    fi
  fi

  case "${BACKEND}" in
    openssl) openssl_decrypt "${encrypted}" "${plain}" ;;
    sops)    sops_decrypt "${encrypted}" "${plain}" ;;
    *)       echo "Error: unknown backend '${BACKEND}'" >&2; exit 1 ;;
  esac

  echo "Decrypted: ${plain}"
}

do_run_e2e() {
  local encrypted
  encrypted="$(encrypted_path)"

  if [[ ! -f "${encrypted}" ]]; then
    echo "Error: ${encrypted} not found" >&2
    exit 1
  fi

  echo "Decrypting secrets to memory..."

  local secrets_content
  case "${BACKEND}" in
    openssl) secrets_content="$(openssl_decrypt_stdout "${encrypted}")" ;;
    sops)    secrets_content="$(sops_decrypt_stdout "${encrypted}")" ;;
    *)       echo "Error: unknown backend '${BACKEND}'" >&2; exit 1 ;;
  esac

  # Export secrets as env var — SecretsHelper checks this before file
  export STRATOS_SECRETS="${secrets_content}"

  # Pass through --env as the profile selector
  if [[ -n "${ENV_NAME}" ]]; then
    export E2E_PROFILE="${ENV_NAME}"
  fi

  echo "Running E2E tests..."
  exec bunx playwright test "${E2E_ARGS[@]+"${E2E_ARGS[@]}"}"
}

do_check() {
  echo "Checking prerequisites for backend: ${BACKEND}"
  echo "---"
  case "${BACKEND}" in
    openssl) openssl_check ;;
    sops)    sops_check ;;
    *)       echo "Error: unknown backend '${BACKEND}'" >&2; exit 1 ;;
  esac
}

# ── Main ──────────────────────────────────────────────────────
parse_args "$@"

case "${COMMAND}" in
  encrypt) do_encrypt ;;
  decrypt) do_decrypt ;;
  run-e2e) do_run_e2e ;;
  check)   do_check ;;
esac
