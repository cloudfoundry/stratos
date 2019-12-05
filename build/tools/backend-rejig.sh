#!/usr/bin/env bash

# Re-jig the backend code layout to be more standard

# This assumes that Go is installed, as well as dep (https://golang.github.io/dep/)

CMD=$1

set -eux
set -o pipefail

# Run with reset as first arg to undo the source code changes
if [ "$CMD" == "reset" ]; then
  echo "Resetting source changes"
  git reset HEAD src/backend
  git reset HEAD src/jetstream
  git checkout -- src/backend
  rm -rf src/jetstream
  rm -rf vendor
  exit 0
fi

# Assumes you are running from top-level folder

git mv src/backend src/jetstream
mkdir src/jetstream/plugins
git mv src/jetstream/app-core/* src/jetstream
git mv src/jetstream/cfapppush src/jetstream/plugins/cfapppush
git mv src/jetstream/cfappssh src/jetstream/plugins/cfappssh
git mv src/jetstream/cloudfoundry src/jetstream/plugins/cloudfoundry
git mv src/jetstream/cloudfoundryhosting src/jetstream/plugins/cloudfoundryhosting
git mv src/jetstream/metrics src/jetstream/plugins/metrics
git mv src/jetstream/userinfo src/jetstream/plugins/userinfo

# Always build all known plugins
git mv src/jetstream/load_plugins.go.tmpl src/jetstream/load_plugins.go
cat <<EOF > src/jetstream/load_plugins.go
package main

import (
    "github.com/SUSE/stratos-ui/plugins/cfapppush"
    "github.com/SUSE/stratos-ui/plugins/cfappssh"
    "github.com/SUSE/stratos-ui/plugins/cloudfoundry"
    "github.com/SUSE/stratos-ui/plugins/cloudfoundryhosting"
    "github.com/SUSE/stratos-ui/plugins/metrics"
    "github.com/SUSE/stratos-ui/plugins/userinfo"
    "github.com/SUSE/stratos-ui/repository/interfaces"
    log "github.com/Sirupsen/logrus"
)

func (pp *portalProxy) loadPlugins() {

    pp.Plugins = make(map[string]interfaces.StratosPlugin)

    log.Info("Initialising plugins")

    for _, p := range []struct {
        Name string
        Init func(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error)
    }{
        {"cfapppush", cfapppush.Init},
        {"cfappssh", cfappssh.Init},
        {"cloudfoundry", cloudfoundry.Init},
        {"cloudfoundryhosting", cloudfoundryhosting.Init},
        {"metrics", metrics.Init},
        {"userinfo", userinfo.Init},
    } {
        plugin, err := p.Init(pp)
        pp.Plugins[p.Name] = plugin
        if err != nil {
            log.Fatalf("Error loading plugin: %s (%s)", p.Name, err)
        }
        log.Infof("Loaded plugin: %s", p.Name)
    }
}
EOF

# Change imports from github.com/SUSE/stratos-ui to github.com/cloudfoundry-incubator/stratos to match the new repo
find . -name "*.go" | xargs sed -i '' 's/github.com\/SUSE\/stratos-ui/github.com\/cloudfoundry-incubator\/stratos/g'

# Fix logrus imports to match capitalization used by the CF CLI library (else dep will fail)
find . -name "*.go" | xargs sed -i '' 's/github.com\/Sirupsen\/logrus/github.com\/sirupsen\/logrus/g'

# Update imports
find . -name "*.go" | xargs sed -i '' 's/github.com\/cloudfoundry-incubator\/stratos/github.com\/cloudfoundry-incubator\/stratos\/src\/jetstream/g'

# Cleanup our changes above with gofmt
find . -name "*.go" | xargs gofmt -w

# Remove glide and other vendored stuff
find . -name glide.lock | xargs git rm -f
find . -name glide.yaml | xargs git rm -f
git rm -rf src/jetstream/__vendor

# Stop ignore of app-core
#sed -i '' '/.*vendor.*/d' .gitignore
sed -i '' '/.*app-core.*/d' .gitignore

# Add dep
cat <<EOF > Gopkg.toml
# without this constraint, dep will give errors about unadvertised objects in src/github.com/codegangsta/cli
# which we don't even use, but older versions of the the CF cli reference. Pinning to a recent version
# seems to fix this
[[constraint]]
  name = "code.cloudfoundry.org/cli"
  source = "github.com/cloudfoundry/cli"
  version = "v6.37.0"

# API changed in the newer version - pin to 1.1.3 for now
[[constraint]]
  name = "gopkg.in/DATA-DOG/go-sqlmock.v1"
  version = "=1.1.3"  

# Pin the next two dependencies for tests to work as before
[[constraint]]
  name = "github.com/smartystreets/goconvey"
  version = "=1.6.2"

[[constraint]]
  name = "github.com/kat-co/vala"
  revision = "43c3f19f86f47a7a83ce5656a1dd8fee3da5d12b"

# code.cloudfoundry.org/cli requires moby master, which isn't compatible with current code.cloudfoundry.org/cli
[[override]]
  name = "github.com/moby/moby"
  revision = "9de84a78d76ed2ffe386fe21466f7401cf5d2e9d"

[prune]
  go-tests = true
  unused-packages = true
EOF

# Next step takes about 5-10 minutes
dep ensure
