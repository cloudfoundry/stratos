#!/usr/bin/env bash

# Clean any symlinks from a pre 4.0 Stratos
# These are no longer used for customization and need to be removed

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

function processFile {
  filename=$1
  if [ -L "$filename" ]; then
    echo Removing symlink $filename
    rm $filename
  fi
}

function processFolder {
  for filename in $1; do
    processFile $filename
  done
}

processFolder "${STRATOS}/src/frontend/packages/core/sass/*.*"
processFolder "${STRATOS}/src/frontend/packages/core/assets/*.*"
processFile "${STRATOS}/src/frontend/packages/core/favicon.ico"
