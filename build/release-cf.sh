#!/usr/bin/env bash
#
# Stage and zip Stratos for Cloud Foundry deployment.
#
# Usage: ./build/release-cf.sh [VERSION] [MODE]
#
# MODE: cf (default) — classic CF manifest (binary_buildpack)
#       korifi       — Korifi manifest (paketo-buildpacks/procfile;
#                      requires a statically linked binary — make build korifi)
#
# Validates that required build artifacts exist before packaging.
# Does NOT build anything — run 'make build' first.

set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo "dev")}"
MODE="${2:-cf}"

case "${MODE}" in
  cf|korifi) ;;
  *) echo "ERROR: unknown mode '${MODE}' — supported: cf, korifi" >&2; exit 1 ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
BIN_DIR="${DIST_DIR}/bin"
PKG_DIR="${DIST_DIR}/${MODE}-package"
ZIP_FILE="${DIST_DIR}/stratos-${MODE}-${VERSION}.zip"

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
# Prefer an explicit dist/bin/jetstream (from `make build PLATFORM=linux/amd64`
# or `make build korifi`); for cf mode, fall back to the cross-compiled
# artifact from a plain `make build`, so `make build release cf github`
# composes in one pass. korifi keeps requiring its own static build below.
CF_ARCH="${CF_ARCH:-amd64}"
jetstream_bin="${BIN_DIR}/jetstream"
if [[ ! -f "${jetstream_bin}" && "${MODE}" == "cf" && -f "${BIN_DIR}/jetstream-linux-${CF_ARCH}" ]]; then
  jetstream_bin="${BIN_DIR}/jetstream-linux-${CF_ARCH}"
fi

if [[ ! -f "${jetstream_bin}" ]]; then
  error "Backend binary not found at dist/bin/jetstream"
  error "  Run: make build PLATFORM=linux/amd64  (or linux/arm64)"
  fail=1
elif ! file "${jetstream_bin}" | grep -q "ELF"; then
  error "Backend binary is not a Linux binary — CF requires a Linux ELF binary"
  error "  Current binary: $(file "${jetstream_bin}")"
  error "  Run: make build PLATFORM=linux/amd64  (or linux/arm64)"
  fail=1
elif [[ "${MODE}" == "korifi" ]] && ! file "${jetstream_bin}" | grep -q "statically linked"; then
  error "Backend binary is dynamically linked — Korifi's run image cannot exec it"
  error "  Current binary: $(file "${jetstream_bin}")"
  error "  Run: make build korifi"
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
if [[ "${MODE}" == "korifi" ]]; then
  # Stable per-workstation key, generated once and reused so data the
  # console encrypted under it (endpoint tokens) survives repackaging.
  # A shared hardcoded key would be a credential leak; a fresh key per
  # package would orphan previously encrypted data.
  KEY_FILE="${DIST_DIR}/.korifi-encryption-key"
  if [[ ! -f "${KEY_FILE}" ]]; then
    (umask 077 && openssl rand -hex 32 > "${KEY_FILE}")
  fi
  ENCRYPTION_KEY="$(cat "${KEY_FILE}")"
  cat > "${PKG_DIR}/manifest.yml" <<MANIFEST
applications:
  - name: console
    memory: 512M
    disk_quota: 1024M
    timeout: 180
    buildpacks:
      - paketo-buildpacks/procfile
    health-check-type: port
    env:
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      SESSION_STORE_EXPIRY: "240"
      # The CF API address inferred from VCAP_APPLICATION may not be
      # reachable from inside the cluster (on kind it is localhost).
      # Target the Korifi API service directly; its certificate does
      # not carry the service hostname, hence the SSL skip. Adjust
      # both for a non-default install.
      CF_API_URL: https://korifi-api-svc.korifi.svc.cluster.local
      SKIP_SSL_VALIDATION: "true"
MANIFEST
else
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
      SESSION_STORE_EXPIRY: "240"
# Override CF API endpoint URL inferred from VCAP_APPLICATION env
#       CF_API_URL: https://CLOUD_FOUNDRY_API_ENDPOINT
# Force the console to use secured communication with the Cloud Foundry API endpoint
#       CF_API_FORCE_SECURE: true
MANIFEST
fi

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
