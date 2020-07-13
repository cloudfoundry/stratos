#!/usr/bin/env bash

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

BUILD_FRONTEND=false
BUILD_BACKEND=false
ARGS=""

if [ "$1" == "fe" ]; then
  BUILD_FRONTEND=true
  shift
elif [ "$1" == "be" ]; then
  BUILD_BACKEND=true
  shift
elif [ "$1" == "all" ]; then
  BUILD_FRONTEND=true
  BUILD_BACKEND=true
  shift
fi

if [ "$1" == "dev" ]; then
  ARGS="dev"
fi

pushd ${STRATOS} > /dev/null
if [ "$BUILD_FRONTEND" == "true" ]; then
  ng build
fi
if [ "$BUILD_BACKEND" == "true" ]; then
  npm run build-backend
fi
cp ./src/jetstream/jetstream ./electron
cp -R ${STRATOS}/dist ${DIR}
cp -R ${STRATOS}/dev-ssl ${DIR}
popd > /dev/null

npm run electron -- ${ARGS}