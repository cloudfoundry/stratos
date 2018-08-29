#!/bin/bash

# Only update if this is running against v2-master
if [ "$TRAVIS_BRANCH" == "v2-master" ] && [ "$TRAVIS_EVENT_TYPE" != "pull_request" ]; then
  echo "Updating GO Report Card for: github.com/${TRAVIS_REPO_SLUG}"
  curl -m 300 -d "repo=github.com/${TRAVIS_REPO_SLUG}" https://goreportcard.com/checks
fi

# Always return success - any failure is down to the goreportcad site not being available
# Don't fail our build for this reason
exit 0