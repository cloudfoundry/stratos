module github.com/cloudfoundry/stratos/src/jetstream/plugins/monocular

go 1.26.3

require (
	github.com/Masterminds/semver/v3 v3.4.0
	github.com/cloudfoundry/stratos/src/jetstream v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry/stratos/src/jetstream/api v0.0.0-20250312201517-2a076063346f
	github.com/labstack/echo/v5 v5.3.1
	github.com/pressly/goose v2.7.0+incompatible
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.9.4
	gopkg.in/yaml.v2 v2.4.0
)

require (
	filippo.io/edwards25519 v1.2.0 // indirect
	github.com/cloudfoundry-community/go-cfenv v1.19.0 // indirect
	github.com/coder/websocket v1.8.15 // indirect
	github.com/go-sql-driver/mysql v1.9.2 // indirect
	github.com/go-viper/mapstructure/v2 v2.5.0 // indirect
	github.com/gorilla/securecookie v1.1.2 // indirect
	github.com/gorilla/sessions v1.4.0 // indirect
	github.com/govau/cf-common v0.0.7 // indirect
	github.com/kat-co/vala v0.0.0-20170210184112-42e1d8b61f12 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/ncruces/go-sqlite3 v0.35.2 // indirect
	github.com/ncruces/go-sqlite3-wasm/v3 v3.2.35303 // indirect
	github.com/ncruces/julianday v1.0.0 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rogpeppe/go-internal v1.10.0 // indirect
	github.com/samber/lo v1.50.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
	golang.org/x/text v0.40.0 // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
)

replace github.com/cloudfoundry/stratos/src/jetstream => ../../

replace github.com/cloudfoundry/stratos/src/jetstream/api => ../../api

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/cfapppush => ../cfapppush

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes => ../kubernetes

replace github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth => ../kubernetes/auth
