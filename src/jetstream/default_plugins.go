package main

// These imports bring in the default set of plugins

import (
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/backup"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundryhosting"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/metrics"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites"
	_ "github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userinfo"
)
