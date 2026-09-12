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
# The image is multi-arch (linux/amd64 and linux/arm64); the cf zip is not.

set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo "dev")}"
AIO_ARCH="${AIO_ARCH:-amd64}"
# Architectures to stage when their binaries are present.
AIO_ARCHES="${AIO_ARCHES:-amd64 arm64}"

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

# Backend binaries — the image is multi-arch, so stage one Linux ELF per
# architecture as jetstream-linux-<arch>; the Dockerfile picks by TARGETARCH.
# `make build` cross-compiles all of them; `make build backend
# PLATFORM=linux/<arch>` produces only dist/bin/jetstream, which is used for
# AIO_ARCH when no per-arch binary is present.
staged_arches=()
for arch in ${AIO_ARCHES}; do
  candidate=""
  # An explicit dist/bin/jetstream wins for AIO_ARCH: it is what
  # `make build backend PLATFORM=linux/<arch>` just produced, and it must not
  # be shadowed by an older cross-compiled jetstream-linux-<arch> beside it.
  # Only usable if it is a Linux ELF — a plain `make build backend` leaves a
  # host binary there.
  if [[ "${arch}" == "${AIO_ARCH}" ]] && [[ -f "${BIN_DIR}/jetstream" ]] \
     && file "${BIN_DIR}/jetstream" | grep -q "ELF"; then
    candidate="${BIN_DIR}/jetstream"
  elif [[ -f "${BIN_DIR}/jetstream-linux-${arch}" ]]; then
    candidate="${BIN_DIR}/jetstream-linux-${arch}"
  fi
  if [[ -n "${candidate}" ]] && file "${candidate}" | grep -q "ELF"; then
    staged_arches+=("${arch}:${candidate}")
  fi
done

if [[ ${#staged_arches[@]} -eq 0 ]]; then
  error "No Linux backend binary found for any of: ${AIO_ARCHES}"
  error "  Run: make build            (cross-compiles every platform)"
  error "  or:  make build backend PLATFORM=linux/${AIO_ARCH}"
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

# Backend binaries, one per architecture (the Dockerfile copies the one
# matching TARGETARCH to ./jetstream, which the ENTRYPOINT runs from /srv)
for entry in "${staged_arches[@]}"; do
  cp "${entry#*:}" "${PKG_DIR}/jetstream-linux-${entry%%:*}"
done
chmod +x "${PKG_DIR}"/jetstream-linux-*

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
