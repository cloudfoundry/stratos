module github.com/cloudfoundry/stratos/src/jetstream/plugins/monocular

go 1.21

toolchain go1.21.5

require (
	github.com/Masterminds/semver/v3 v3.2.1
	github.com/cloudfoundry/stratos/src/jetstream v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry/stratos/src/jetstream/api v0.0.0-00010101000000-000000000000
	github.com/labstack/echo/v4 v4.11.3
	github.com/pressly/goose v2.7.0+incompatible
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.9.3
	gopkg.in/yaml.v2 v2.4.0
)

require (
	github.com/cloudfoundry-community/go-cfenv v1.18.0 // indirect
	github.com/go-sql-driver/mysql v1.7.1 // indirect
	github.com/gorilla/securecookie v1.1.1 // indirect
	github.com/gorilla/sessions v1.2.1 // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	github.com/govau/cf-common v0.0.7 // indirect
	github.com/kat-co/vala v0.0.0-20170210184112-42e1d8b61f12 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/labstack/gommon v0.4.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/mattn/go-sqlite3 v1.14.17 // indirect
	github.com/mitchellh/mapstructure v1.4.1 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rogpeppe/go-internal v1.10.0 // indirect
	github.com/samber/lo v1.38.1 // indirect
	github.com/sclevine/spec v1.4.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/exp v0.0.0-20220303212507-bbda1eaf7a17 // indirect
	golang.org/x/net v0.17.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
)

replace github.com/cloudfoundry/stratos/src/jetstream => ../../

replace github.com/cloudfoundry/stratos/src/jetstream/api => ../../api

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/cfapppush => ../cfapppush

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes => ../kubernetes

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth => ../kubernetes/auth
