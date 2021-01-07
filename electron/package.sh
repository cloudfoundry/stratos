#!/usr/bin/env bash

# Colours
CYAN="\033[96m"
YELLOW="\033[93m"
RED="\033[91m"
RESET="\033[0m"
BOLD="\033[1m"
NORMAL="\033[21m"

echo -e "${CYAN}${BOLD}=========================\nPackaging Stratos Desktop\n=========================\n${RESET}"

echo -e "${YELLOW}Note: This will only package for your current architecture and OS${RESET}"

OS="$(uname -s)"

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

source "${DIR}/build.sh"

pushd ${DIR} > /dev/null
rm -rf dist/*es5*
VERSION=$(cat ./package.json | jq -r .version)
popd > /dev/null

#npm run package
npm run epublish

# Mac - move the app to the Applications folder
if [ "$1" == "-i" ]; then
  mv ./out/Stratos-darwin-x64/Stratos.app /Applications
fi

if  [ "${OS}" == "Darwin" ]; then
  DMG="Stratos-${VERSION}.dmg"
  if [ -d "${DIR}/out/Stratos-darwin-x64" ]; then
    echo -e "${YELLOW}${BOLD}Mac App${NORMAL} is in ${BOLD}${DIR}/out/Stratos-darwin-x64/Stratos.app${RESET}"
    echo -e "${CYAN}You can run the app with:"
    echo -e "${YELLOW}open ${DIR}/out/Stratos-darwin-x64/Stratos.app${RESET}"
    echo ""
  fi

  if [ -f "${DIR}/out/make/${DMG}" ]; then
    echo -e "${YELLOW}${BOLD}Mac DMG${NORMAL} is in: ${BOLD}${DIR}/out/make/${DMG}${RESET}"
  fi
fi