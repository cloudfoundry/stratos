#!/bin/bash


set -e

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_DIR="$( cd "${PROG_DIR}/.." && pwd )"

echo "Stratos Directory: ${STRATOS_DIR}"
echo "Directory: ${PROG_DIR}"

npm run build-builder

pushd ${STRATOS_DIR}/dist-tools/builder 
npm publish -f
popd

npm install @stratos/builder