#!/usr/bin/env bash

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

source "${DIR}/build.sh"

echo "Running electron app ...."
npm run electron -- ${ARGS}