#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN="\033[96m"
YELLOW="\033[93m"
BOLD="\033[1m"
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}=================================${RESET}"
echo -e "${BOLD}${CYAN}Stratos System Availability check${RESET}"
echo -e "${BOLD}${CYAN}=================================${RESET}"
echo ""

# Check that a Stratos system is available
set -eu

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $DIRPATH

if [ -z "${ENDPOINT}" ]; then
  echo "Need Stratos endpoint"
  exit 1
fi

if [ -z "${USERNAME}" ]; then
  echo "Need username"
  exit 1
fi

if [ -z "${PASSWORD}" ]; then
  echo "Need password"
  exit 1
fi

echo -e "${BOLD}${CYAN}Checking Stratos is up and running: ${ENDPOINT}${RESET}"

echo -e "${BOLD}${YELLOW}Performing npm install ...${RESET}"
npm install

echo -e "${BOLD}${YELLOW}Updating web driver ...${RESET}"

# Ensure we have correct version of web driver
CHROME_VERSION=$(google-chrome --version | grep -iEo "[0-9.]{10,20}")
echo "Chrome version: ${CHROME_VERSION}"
npm run update-webdriver -- --versions.chrome=${CHROME_VERSION}

pushd "${DIRPATH}/../../.."
SECRETS=secrets.yaml
if [ -f "$SECRETS" ]; then
  mv $SECRETS $SECRETS.bak
fi

# Generate secrets.yaml for the e2e tests to run
rm -f ${SECRETS}
echo "consoleUsers:" > ${SECRETS}
echo "  admin:" >> ${SECRETS}
echo "    username: $USERNAME" >> ${SECRETS}
echo "    password: $PASSWORD" >> ${SECRETS}
echo "  nonAdmin:" >> ${SECRETS}
echo "    username: $USERNAME" >> ${SECRETS}
echo "    password: $PASSWORD" >> ${SECRETS}
echo "endpoints:" >> ${SECRETS}
echo "  cf:" >> ${SECRETS}
echo "    name: none" >> ${SECRETS}
echo "headless: true" >> ${SECRETS}

set +e

echo -e "${BOLD}${YELLOW}Running checks ...${RESET}"

# Need to set base URL via env var
export STRATOS_E2E_BASE_URL=${ENDPOINT}

# Run the e2e check test suite against the supplied endpoint
./node_modules/.bin/ng e2e --no-webdriver-update --dev-server-target= --base-url=${ENDPOINT} --suite=check
RET=$?

if [ -f "$SECRETS.bak" ]; then
  mv $SECRETS.bak $SECRETS
else 
  rm -f $SECRETS
fi

popd

exit $RET
