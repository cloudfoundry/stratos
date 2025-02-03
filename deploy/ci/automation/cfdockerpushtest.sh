#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN="\033[96m"
YELLOW="\033[93m"
BOLD="\033[1m"
RESET='\033[0m'

echo "============================="
echo "Stratos CF Push Test - Docker"
echo "============================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

# Push Stratos to the Cloud Foundry
cf delete -f -r console

set -e

echo "Performing cf push of Stratos Docker image"
date

MANIFEST=manifest.push.yml
rm -rf $MANIFEST

# Create manifest file to turn off auto-reg
cp manifest.yml $MANIFEST

echo "    env:" >> $MANIFEST
echo "      SKIP_AUTO_REGISTER: true" >> $MANIFEST
echo "      FORCE_ENABLE_PERSISTENCE_FEATURES: true" >> $MANIFEST

# Make sure we add invite users config if set
if [ -n "${SMTP_HOST}" ]; then
  echo "      SMTP_HOST: ${SMTP_HOST}" >> $MANIFEST
fi

if [ -n "${SMTP_FROM_ADDRESS}" ]; then
  echo "      SMTP_FROM_ADDRESS: ${SMTP_FROM_ADDRESS}" >> $MANIFEST
fi

# SSO
SUITE=""
if [ "$2" == "sso" ] || [ "$3" == "sso" ] ; then
  echo "      SSO_LOGIN: true" >> $MANIFEST
  SUITE=" --suite=sso"
  # Run the helper script to make sure the CF client is set up correctly
  "$DIRPATH/init-uaa-for-sso.sh"
fi  

cat $MANIFEST

# If the push fails, we want to continue and show the logs
set +e

# Push Stratos Docker image to the Cloud Foundry
cf push -f $MANIFEST --docker-image ${STRATOS_IMAGE}
RET=$?

date

if [ $RET -ne 0 ]; then
  set +e
  echo "Docker push failed... showing recent log of the Stratos app"
  cf logs --recent console
  set -e
else

  # Show the recent logs just we can see startup settings
  echo -e "${BOLD}${GREEN}Showing recent logs of the Stratos App${RESET}"
  cf logs --recent console | tail -n 100
  
  echo -e "${BOLD}${GREEN}"
  echo "==============================================================================="
  echo ""
  echo "Running E2E Tests...."
  echo -e "${RESET}"

  # Push was okay, so we can prepare and run E2E tests
  rm -rf node_modules
  npm install

  # Clean the E2E reports folder
  rm -rf ./e2e-reports
  mkdir -p ./e2e-reports
  export E2E_REPORT_FOLDER=./e2e-reports

  # Run the E2E tests
  "$DIRPATH/runandrecord.sh" https://console.${CF_DOMAIN} ${SUITE}
  RET=$?

  # If we had test failures then copy console log to reports folder
  if [ $RET -ne 0 ]; then
    cf logs --recent console > "${E2E_REPORT_FOLDER}/console-app.log"
  fi 
fi

# Clean up
rm $MANIFEST

set +e

# Delete the app - add one retry if it fails first time
cf delete -f -r console
if [ $? -ne 0 ]; then
  sleep 60
  cf delete -f -r console
fi

echo "All done"

# Return exit code form the e2e tests
exit $RET
