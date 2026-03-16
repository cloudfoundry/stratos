#!/usr/bin/env bash
#
# Stage Stratos into dist/install/ for local testing.
#
# Uses symlinks for the binary and UI so changes from rebuild are
# picked up immediately without re-running install.
#
# Usage: ./build/install-local.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
BIN_DIR="${DIST_DIR}/bin"
INSTALL_DIR="${DIST_DIR}/install"

log()   { echo "-----> $1"; }
error() { echo "ERROR: $1" >&2; }

# ── Validate required artifacts ───────────────────────────────

fail=0

# Frontend
ui_src=""
if [[ -d "${DIST_DIR}/browser" ]]; then
  ui_src="${DIST_DIR}/frontend/browser"
elif [[ -d "${DIST_DIR}/frontend/stratos" ]]; then
  ui_src="${DIST_DIR}/frontend/stratos"
else
  error "Frontend build not found at dist/frontend/browser/"
  error "  Run: make build frontend"
  fail=1
fi

# Backend
if [[ ! -f "${BIN_DIR}/jetstream" ]]; then
  error "Backend binary not found at dist/bin/jetstream"
  error "  Run: make build backend"
  fail=1
fi

if [[ "${fail}" -ne 0 ]]; then
  exit 1
fi

# ── Stage install directory ───────────────────────────────────

log "Staging local install..."

rm -rf "${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}/bin"

# Symlink binary
ln -sf "${BIN_DIR}/jetstream" "${INSTALL_DIR}/bin/jetstream"

# Symlink UI
ln -sf "${ui_src}" "${INSTALL_DIR}/ui"

# Copy config
if [[ -f "${ROOT_DIR}/src/jetstream/config.example" ]]; then
  cp "${ROOT_DIR}/src/jetstream/config.example" "${INSTALL_DIR}/config.properties"
fi

# Copy templates
if [[ -d "${ROOT_DIR}/src/jetstream/templates" ]]; then
  cp -r "${ROOT_DIR}/src/jetstream/templates" "${INSTALL_DIR}/templates"
fi

# Copy plugins
if [[ -f "${ROOT_DIR}/src/jetstream/plugins.yaml" ]]; then
  cp "${ROOT_DIR}/src/jetstream/plugins.yaml" "${INSTALL_DIR}/plugins.yaml"
fi

# Create run.sh wrapper
cat > "${INSTALL_DIR}/run.sh" <<'RUNSH'
#!/usr/bin/env bash
# Run Stratos locally from the install staging directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export UI_PATH="${SCRIPT_DIR}/ui"
export TEMPLATE_DIR="${SCRIPT_DIR}/templates"

exec "${SCRIPT_DIR}/bin/jetstream"
RUNSH
chmod +x "${INSTALL_DIR}/run.sh"

# ── Summary ───────────────────────────────────────────────────

echo ""
log "Local install staged at: ${INSTALL_DIR}"
echo ""
echo "Run with:"
echo "  ${INSTALL_DIR}/run.sh"
echo ""
