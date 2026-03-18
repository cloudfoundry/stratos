#!/usr/bin/env bash
#
# Stage and zip Stratos for Cloud Foundry deployment.
#
# Usage: ./build/release-cf.sh [VERSION]
#
# Validates that required build artifacts exist before packaging.
# Does NOT build anything — run 'make build' first.

set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo "dev")}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
BIN_DIR="${DIST_DIR}/bin"
PKG_DIR="${DIST_DIR}/cf-package"
ZIP_FILE="${DIST_DIR}/stratos-cf-${VERSION}.zip"

log()   { echo "-----> $1"; }
error() { echo "ERROR: $1" >&2; }

# ── Validate required artifacts ───────────────────────────────

fail=0

# Frontend
if [[ -d "${DIST_DIR}/frontend/browser" ]]; then
  ui_src="${DIST_DIR}/frontend/browser"
elif [[ -d "${DIST_DIR}/frontend/stratos" ]]; then
  ui_src="${DIST_DIR}/frontend/stratos"
else
  error "Frontend build not found at dist/frontend/browser/"
  error "  Run: make build frontend"
  ui_src=""
  fail=1
fi

# Backend binary — CF requires a Linux ELF binary (amd64 or arm64)
jetstream_bin="${BIN_DIR}/jetstream"

if [[ ! -f "${jetstream_bin}" ]]; then
  error "Backend binary not found at dist/bin/jetstream"
  error "  Run: make build PLATFORM=linux/amd64  (or linux/arm64)"
  fail=1
elif ! file "${jetstream_bin}" | grep -q "ELF"; then
  error "Backend binary is not a Linux binary — CF requires a Linux ELF binary"
  error "  Current binary: $(file "${jetstream_bin}")"
  error "  Run: make build PLATFORM=linux/amd64  (or linux/arm64)"
  fail=1
fi

if [[ "${fail}" -ne 0 ]]; then
  exit 1
fi

# zip required
if ! command -v zip >/dev/null 2>&1; then
  error "'zip' command not found — install it and retry"
  exit 1
fi

# ── Stage CF package ──────────────────────────────────────────

log "Staging CF package (${VERSION})..."

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}"

# Backend binary at package root (Procfile expects ./jetstream)
cp "${jetstream_bin}" "${PKG_DIR}/jetstream"
chmod +x "${PKG_DIR}/jetstream"

# Frontend assets
cp -r "${ui_src}" "${PKG_DIR}/ui"

# Config from CF deploy directory
cp "${ROOT_DIR}/deploy/cloud-foundry/config.properties" "${PKG_DIR}/"

# Plugins
if [[ -f "${ROOT_DIR}/src/jetstream/plugins.yaml" ]]; then
  cp "${ROOT_DIR}/src/jetstream/plugins.yaml" "${PKG_DIR}/"
fi

# Templates
if [[ -d "${ROOT_DIR}/src/jetstream/templates" ]]; then
  cp -r "${ROOT_DIR}/src/jetstream/templates" "${PKG_DIR}/templates"
fi

# Procfile
echo "web: ./jetstream" > "${PKG_DIR}/Procfile"

# CF manifest
cat > "${PKG_DIR}/manifest.yml" <<'MANIFEST'
applications:
  - name: console
    memory: 256M
    disk_quota: 1024M
    timeout: 180
    buildpack: binary_buildpack
    health-check-type: port
    command: ./jetstream
    env:
      ENCRYPTION_KEY: B374A26A71490437AA024E4FADD5B497FDFF1A8EA6FF12F6FB65AF2720B59CCF
# Override CF API endpoint URL inferred from VCAP_APPLICATION env
#       CF_API_URL: https://CLOUD_FOUNDRY_API_ENDPOINT
# Force the console to use secured communication with the Cloud Foundry API endpoint
#       CF_API_FORCE_SECURE: true
MANIFEST

# ── Create zip ────────────────────────────────────────────────

log "Creating ${ZIP_FILE}..."
rm -f "${ZIP_FILE}"
cd "${PKG_DIR}"
zip -r "${ZIP_FILE}" . -x '*.git*' '*.DS_Store' > /dev/null
cd "${ROOT_DIR}"

# ── Summary ───────────────────────────────────────────────────

echo ""
log "CF package complete!"
echo "  Version:  ${VERSION}"
echo "  Archive:  ${ZIP_FILE}"
echo "  Size:     $(du -h "${ZIP_FILE}" | cut -f1)"
echo ""
echo "Deploy with:"
echo "  cf push -f ${PKG_DIR}/manifest.yml -p ${ZIP_FILE}"
echo "  # or from the staging directory:"
echo "  cd ${PKG_DIR} && cf push"
echo ""
