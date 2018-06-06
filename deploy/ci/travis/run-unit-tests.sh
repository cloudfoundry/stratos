#!/bin/bash

set -e

echo "Stratos Unit tests"
echo "=================="

if [ "${TRAVIS_EVENT_TYPE}" == "pull_request" ]; then
  echo "Pull Request - running unit tests without code coverage"
  npm run test-nocov
else
  echo "Running unit tests with code coverage"
  npm run test
fi

