#!/usr/bin/env bash
#
# Stage the Stratos all-in-one payload for the thin Docker image.
#
# Usage: ./deploy/all-in-one/stage-aio.sh [VERSION]
#
# Reuses the release-built artifacts — it does NOT build anything. Run
# 'make build' (or 'make build backend PLATFORM=linux/amd64' + 'make build
# frontend') first. Produces dist/aio-package/, which is the Docker build
# context for deploy/all-in-one/Dockerfile.
#
# The all-in-one image is linux/amd64 only for now (the cf zip is too).

set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo "dev")}"
AIO_ARCH="${AIO_ARCH:-amd64}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
BIN_DIR="${DIST_DIR}/bin"
PKG_DIR="${DIST_DIR}/aio-package"

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

# Backend binary — the AIO image is Linux; prefer an explicit dist/bin/jetstream
# (from make build PLATFORM=linux/amd64), fall back to the cross-compiled one.
jetstream_bin="${BIN_DIR}/jetstream"
if [[ ! -f "${jetstream_bin}" ]] && [[ -f "${BIN_DIR}/jetstream-linux-${AIO_ARCH}" ]]; then
  jetstream_bin="${BIN_DIR}/jetstream-linux-${AIO_ARCH}"
fi

if [[ ! -f "${jetstream_bin}" ]]; then
  error "Backend binary not found at dist/bin/jetstream"
  error "  Run: make build backend PLATFORM=linux/${AIO_ARCH}"
  fail=1
elif ! file "${jetstream_bin}" | grep -q "ELF"; then
  error "Backend binary is not a Linux binary — the AIO image needs a Linux ELF"
  error "  Current binary: $(file "${jetstream_bin}")"
  error "  Run: make build backend PLATFORM=linux/${AIO_ARCH}"
  fail=1
fi

if [[ "${fail}" -ne 0 ]]; then
  exit 1
fi

command -v openssl >/dev/null 2>&1 || { error "'openssl' not found — needed to generate dev-certs"; exit 1; }

# ── Stage AIO package ─────────────────────────────────────────

log "Staging all-in-one package (${VERSION})..."

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}"

# Backend binary (ENTRYPOINT runs ./jetstream from /srv)
cp "${jetstream_bin}" "${PKG_DIR}/jetstream"
chmod +x "${PKG_DIR}/jetstream"

# Frontend assets
cp -r "${ui_src}" "${PKG_DIR}/ui"

# All-in-one config (sqlite, :5443, STRATOS_DEPLOYMENT_DOCKER_AIO=true)
cp "${ROOT_DIR}/deploy/all-in-one/config.all-in-one.properties" "${PKG_DIR}/config.properties"

# Plugins + user-invite templates
if [[ -f "${ROOT_DIR}/src/jetstream/plugins.yaml" ]]; then
  cp "${ROOT_DIR}/src/jetstream/plugins.yaml" "${PKG_DIR}/"
fi
if [[ -d "${ROOT_DIR}/src/jetstream/templates" ]]; then
  cp -r "${ROOT_DIR}/src/jetstream/templates" "${PKG_DIR}/templates"
fi

# Dev-certs — jetstream's detectTLSCert() serves HTTPS :5443 from
# dev-certs/pproxy.{crt,key}; it does not self-generate.
CERTS_PATH="${PKG_DIR}/dev-certs" "${ROOT_DIR}/deploy/tools/generate_cert.sh" >/dev/null

# ── Summary ───────────────────────────────────────────────────

echo ""
log "All-in-one package staged."
echo "  Version:  ${VERSION}"
echo "  Package:  ${PKG_DIR}"
echo ""
echo "Build the image with:"
echo "  docker build -f deploy/all-in-one/Dockerfile -t stratos-aio:${VERSION} ${PKG_DIR}"
echo ""
