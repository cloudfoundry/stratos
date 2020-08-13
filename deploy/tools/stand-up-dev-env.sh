#!/bin/bash

# Uses Docker Compose to run a UAA and Stratos

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "Stratos Directory: ${STRATOS}"

BUILD="true"

while getopts "n" opt ; do
  case $opt in
    n)
      BUILD="false"
    ;;
  esac
done

# Build the all-in-one container unless -n arg is provided
if [ "$BUILD" == "true" ]; then
  echo "Building Docker All-In-One Container Image..."
  ${STRATOS}/build/store-git-metadata.sh
  pushd ${STRATOS} > /dev/null
  # Ensure that we have the latest images
  docker pull splatform/stratos-aio-base:opensuse
  docker pull splatform/stratos-bk-base
  # Build the aio image
  docker build --force-rm -f deploy/Dockerfile.all-in-one -t splatform/stratos:latest .
  popd > /dev/null
fi

# Remove existing system
docker-compose -f ${DIRPATH}/docker-compose.dev.yml down

# Bring up new system
docker-compose -f ${DIRPATH}/docker-compose.dev.yml up -d

echo "OK"