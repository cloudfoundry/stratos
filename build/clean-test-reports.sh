#!/usr/bin/env bash

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

rm -f "${STRATOS_PATH}/coverage/stratos-unittest-*.txt"
rm -f "${STRATOS_PATH}/coverage/stratos-unittests.json"
rm -f "${STRATOS_PATH}/coverage/stratos-unittests.txt"
rm -f "${STRATOS_PATH}/coverage/stratos-exitcode.txt"

# Create the coverage folder if needed
mkdir -p "${STRATOS_PATH}/coverage"
