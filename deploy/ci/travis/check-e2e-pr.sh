#!/bin/bash

if [ -n "${TRAVIS_PULL_REQUEST}" ]; then
  if [ "${TRAVIS_PULL_REQUEST}" != "false" ]; then
    echo "Checking labels on ${TRAVIS_PULL_REQUEST_SLUG} #${TRAVIS_PULL_REQUEST}"
    LABEL=$(curl -s "https://api.github.com/repos/${TRAVIS_PULL_REQUEST_SLUG}/pulls/${TRAVIS_PULL_REQUEST}" | jq -r '.labels[] | select(.name == "e2e-debug") | .name')
    if [ "${LABEL}" == "e2e-debug" ]; then
      echo "PR has the 'e2e-debug' label - enabling debug logging for E2E tests"
      export STRATOS_E2E_DEBUG=true
    fi
  fi
fi
