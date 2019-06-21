#!/bin/bash

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

echo "Checking Stratos is up and running: ${ENDPOINT}"

npm install

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

# Run the e2e check test suite against the supplied endpoint
./node_modules/.bin/ng e2e --dev-server-target= --base-url=${ENDPOINT} --suite=check
RET=$?

if [ -f "$SECRETS.bak" ]; then
  mv $SECRETS.bak $SECRETS
else 
  rm -f $SECRETS
fi

popd

exit $RET
