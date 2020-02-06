#!/bin/bash

# Check that a Cloud Foundry endpoint is available
# Can be used in CI jobs to check that a CF needed for tests is running
# Needs org and space e2e/e2e
set -eu

# Args: API_ENDPOINT USERNAME PASSWORD
API=$1
USERNAME=$2
PASSWORD=$3

echo "Checking CF is up and running: ${API}"

cf api $API --skip-ssl-validation
cf login -u $USERNAME -p $PASSWORD -o e2e -s e2e
cf apps

# If we got this far without errors then it should be up and running

