#!/usr/bin/env bash

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

source "${DIR}/build.sh"

pushd ${DIR} > /dev/null
rm -rf dist/*es5*
popd > /dev/null

npm run package

# Mac - move the app to the Applications folder
if [ "$1" == "-i" ]; then
  mv ./out/Stratos-darwin-x64/Stratos.app /Applications
fi