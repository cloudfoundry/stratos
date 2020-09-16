package main

// Note: The ordering is important here, so don't save in VSCode
// otherwise the order will be swapped for alphabetical

// These imports bring in the plugins

import (
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/backup"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundryhosting"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/metrics"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userinfo"
)
