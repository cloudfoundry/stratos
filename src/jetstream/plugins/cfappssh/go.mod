module github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundry

go 1.13

replace github.com/cloudfoundry-incubator/stratos/src/jetstream/api => ../../api

require (
	github.com/cloudfoundry-incubator/stratos/src/jetstream/api v0.0.0-00010101000000-000000000000
	github.com/gorilla/websocket v1.4.1
	github.com/labstack/echo v3.3.10+incompatible
	github.com/sirupsen/logrus v1.4.2
	golang.org/x/crypto v0.0.0-20191011191535-87dc89f01550
)
