#!/usr/bin/env bash
#
# Decrypt secrets.yaml.enc → secrets.yaml using openssl aes-256-cbc
#
# Usage: e2e/scripts/secrets-decrypt.sh [passphrase]
#   If passphrase is not provided, you will be prompted.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAIN="${ROOT_DIR}/secrets.yaml"
ENCRYPTED="${ROOT_DIR}/secrets.yaml.enc"

if [[ ! -f "${ENCRYPTED}" ]]; then
  echo "Error: ${ENCRYPTED} not found" >&2
  exit 1
fi

if [[ -f "${PLAIN}" ]]; then
  echo "Warning: ${PLAIN} already exists and will be overwritten"
  read -r -p "Continue? [y/N] " confirm
  if [[ "${confirm}" != [yY] ]]; then
    echo "Aborted"
    exit 0
  fi
fi

if [[ -n "${1:-}" ]]; then
  openssl enc -aes-256-cbc -d -pbkdf2 -in "${ENCRYPTED}" -out "${PLAIN}" -pass "pass:$1"
else
  openssl enc -aes-256-cbc -d -pbkdf2 -in "${ENCRYPTED}" -out "${PLAIN}"
fi

echo "Decrypted: ${PLAIN}"
