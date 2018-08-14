#!/usr/bin/env bash

# Creates a directory called "fixbuild", clone the repo, and create a commit that will
# make an app-core that can be built with a standard:
# go get github.com/cloudfoundry-incubator/stratos/components/app-core

# This assumes that Go is installed, as well as dep (https://golang.github.io/dep/)

set -eux
set -o pipefail

git reset --hard v2-master

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
#find . -name "*.go" | xargs gofmt -w

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

# Add dep files
# git add Gopkg.lock Gopkg.toml
#git commit -a -m "Build now easier to work with in Go"

# Verify it now builds
#go install github.com/cloudfoundry-incubator/stratos/components/app-core

# And runs (segfaults, unrelated to the build though, more likely missing config, TODO someone should fix that)
#$GOPATH/bin/app-core