#!/usr/bin/env bash

# Re-jig the backend code layout to be more standard

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

# Remove readme file for plugin - no longer needed
git rm src/backend/cfapppush/README.md

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
sed -i '' '/.*app-core.*/d' .gitignore
