module github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundry

go 1.12

replace github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces => ../../repository/interfaces

require (
	github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry/noaa v2.1.0+incompatible
	github.com/cloudfoundry/sonde-go v0.0.0-20171206171820-b33733203bb4
	github.com/gogo/protobuf v1.2.1 // indirect
	github.com/gorilla/websocket v1.4.0
	github.com/labstack/echo v3.3.10+incompatible
	github.com/mailru/easyjson v0.0.0-20190403194419-1ea4449da983 // indirect
	github.com/sirupsen/logrus v1.4.1
	golang.org/x/crypto v0.0.0-20190422183909-d864b10871cd // indirect
)
