#!/usr/bin/env bash

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

pushd ${STRATOS} > /dev/null
# Ensure we include the desktop backend plugin
STRATOS_YAML=./electron/stratos.yaml npm run prepare-backend
popd > /dev/null