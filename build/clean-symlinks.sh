#!/usr/bin/env bash

# Clean any symlinks from a pre 4.0 Stratos
# These are no longer used for customization and need to be removed

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

function processFolder {
  for filename in $1; do
    if [ -L "$filename" ]; then
      rm $filename
    fi
  done
}

processFolder "${STRATOS}/src/frontend/packages/core/sass/*.*"
processFolder "${STRATOS}/src/frontend/packages/core/assets/*.*"
