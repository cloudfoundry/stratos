#!/usr/bin/env bash
#
# Encrypt secrets.yaml → secrets.yaml.enc using openssl aes-256-cbc
#
# Usage: e2e/scripts/secrets-encrypt.sh [passphrase]
#   If passphrase is not provided, you will be prompted.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAIN="${ROOT_DIR}/secrets.yaml"
ENCRYPTED="${ROOT_DIR}/secrets.yaml.enc"

if [[ ! -f "${PLAIN}" ]]; then
  echo "Error: ${PLAIN} not found" >&2
  exit 1
fi

if [[ -n "${1:-}" ]]; then
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "${PLAIN}" -out "${ENCRYPTED}" -pass "pass:$1"
else
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "${PLAIN}" -out "${ENCRYPTED}"
fi

echo "Encrypted: ${ENCRYPTED}"
echo "You can safely remove ${PLAIN} or keep it in .gitignore"
