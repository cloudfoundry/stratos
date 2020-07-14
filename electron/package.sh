#!/usr/bin/env bash

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

pushd ${DIR} > /dev/null
rm -rf dist
rm -rf out
popd > /dev/null

pushd ${STRATOS} > /dev/null
rm -rf dist
ng build --configuration=desktop
npm run build-backend
cp ./src/jetstream/jetstream ./electron
cp -R ${STRATOS}/dist ${DIR}
cp -R ${STRATOS}/dev-ssl ${DIR}
popd > /dev/null


pushd ${DIR} > /dev/null
rm -rf dist/*es5*
popd > /dev/null

npm run package
