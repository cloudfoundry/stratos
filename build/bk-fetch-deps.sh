#!/usr/bin/env bash

# Fetch the backend dependencies using go modules

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

echo "Fetching backend dependencies"

pushd "${STRATOS}/src/jetstream" > /dev/null
go mod download
popd > /dev/null
