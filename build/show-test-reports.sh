#!/usr/bin/env bash

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

# Cat all of the files
for f in "${STRATOS_PATH}/coverage/stratos-unittest-*.txt"
do
  cat "${f}"
  echo ""
done

cat "${STRATOS_PATH}/coverage/stratos-unittests.txt"
echo ""

exitCode=$(cat ${STRATOS_PATH}/coverage/stratos-exitcode.txt)
echo "Exiting with exit code ${exitCode}"
exit ${exitCode}