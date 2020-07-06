#!/usr/bin/env bash

# Utils for front-end build

ACTION=${1}

PREBUILD_ZIP=stratos-frontend-prebuild.zip

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

function prebuild {
  echo "Creating pre-built package for front-end"
  pushd "${STRATOS}/dist" > /dev/null
  rm -f ../${PREBUILD_ZIP}
  zip ../${PREBUILD_ZIP} -r .
  popd > /dev/null
}

function devsetup {
  if [ ! -f "${STRATOS}/proxy.conf.js" ]; then
    echo "Copying default proxy.conf.js"
    cp "${DIR}/proxy.conf.localdev.js" "${STRATOS}/proxy.conf.js"
  fi
}

if [ "${ACTION}" == "prebuild" ]; then
  prebuild
elif [ "${ACTION}" == "devsetup" ]; then
  devsetup
else
  echo "Unknown build command"
fi