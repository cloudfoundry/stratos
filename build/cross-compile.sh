#!/usr/bin/env bash
# Cross-compile Go backend for all platforms

set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}
BUILD_DATE=${2:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
GIT_COMMIT=${3:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}

PLATFORMS=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
  "windows/amd64"
  "windows/arm64"
)

echo "Cross-compiling Jetstream backend..."
echo "Version: $VERSION"
echo "Platforms: ${#PLATFORMS[@]}"
echo ""

mkdir -p dist/bin

cd src/jetstream

go generate ./...

for platform in "${PLATFORMS[@]}"; do
  GOOS=${platform%/*}
  GOARCH=${platform#*/}
  OUTPUT="../../dist/bin/jetstream-${GOOS}-${GOARCH}"

  if [ "$GOOS" = "windows" ]; then
    OUTPUT="${OUTPUT}.exe"
  fi

  echo "Building for $GOOS/$GOARCH..."

  GOOS=$GOOS GOARCH=$GOARCH CGO_ENABLED=0 go build \
    -ldflags "-X main.appVersion=${VERSION} -X main.buildDate=${BUILD_DATE} -X main.gitCommit=${GIT_COMMIT}" \
    -o "$OUTPUT"

  echo "  ✓ $(basename "$OUTPUT")"
done

cd ../..

echo ""
echo "✓ Cross-compilation complete!"
echo "Binaries in: dist/bin/"
ls -lh dist/bin/jetstream-*
