#!/usr/bin/env bash

# Fetch the backend dependencies using dep

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

echo "Fetching backend dependencies"
export DEPPROJECTROOT="${STRATOS}"
dep ensure -vendor-only -v
