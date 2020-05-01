#!/usr/bin/env bash

# Re-jig the frontend code layout 

CMD=$1

set -eu
set -o pipefail

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
echo ${STRATOS_PATH}

pushd ${STRATOS_PATH} > /dev/null

# Run with reset as first arg to undo the source code changes
if [ "$CMD" == "reset" ]; then
  echo "Resetting source changes"
  git reset HEAD src
  git reset HEAD examples
  git checkout -- src
  git checkout -- examples
  # rm -rf src/jetstream
  # rm -rf vendor
  exit 0
fi

echo "Rename the @stratos package org to @stratosui"
find ./src -name "*.ts" | xargs sed -i.bak 's*@stratos/*@stratosui/*g'
find ./examples -name "*.ts" | xargs sed -i.bak 's*@stratos/*@stratosui/*g'
find ./src -name "tsconfig.json" | xargs sed -i.bak 's*@stratos/*@stratosui/*g'
find ./examples -name "tsconfig.json" | xargs sed -i.bak 's*@stratos/*@stratosui/*g'

# git mv src/backend src/jetstream
# mkdir src/jetstream/plugins
# git mv src/jetstream/app-core/* src/jetstream
# git mv src/jetstream/cfapppush src/jetstream/plugins/cfapppush
# git mv src/jetstream/cfappssh src/jetstream/plugins/cfappssh
# git mv src/jetstream/cloudfoundry src/jetstream/plugins/cloudfoundry
# git mv src/jetstream/cloudfoundryhosting src/jetstream/plugins/cloudfoundryhosting
# git mv src/jetstream/metrics src/jetstream/plugins/metrics
# git mv src/jetstream/userinfo src/jetstream/plugins/userinfo



# Change imports from github.com/SUSE/stratos-ui to github.com/cloudfoundry-incubator/stratos to match the new repo
# find . -name "*.go" | xargs sed -i '' 's/github.com\/SUSE\/stratos-ui/github.com\/cloudfoundry-incubator\/stratos/g'

# Fix logrus imports to match capitalization used by the CF CLI library (else dep will fail)
# find . -name "*.go" | xargs sed -i '' 's/github.com\/Sirupsen\/logrus/github.com\/sirupsen\/logrus/g'

# Update imports
# find . -name "*.go" | xargs sed -i '' 's/github.com\/cloudfoundry-incubator\/stratos/github.com\/cloudfoundry-incubator\/stratos\/src\/jetstream/g'

# Cleanup our changes above with gofmt
# find . -name "*.go" | xargs gofmt -w

# Remove glide and other vendored stuff
# find . -name glide.lock | xargs git rm -f
# find . -name glide.yaml | xargs git rm -f
# git rm -rf src/jetstream/__vendor

# Stop ignore of app-core
#sed -i '' '/.*vendor.*/d' .gitignore
# sed -i '' '/.*app-core.*/d' .gitignore

echo "Remove all backup files"
find . -name *.bak | xargs rm -f

popd > /dev/null