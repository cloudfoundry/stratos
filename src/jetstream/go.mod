module github.com/cloudfoundry/stratos/src/jetstream

go 1.26.3

replace (
	github.com/cloudfoundry/stratos/src/jetstream/api => ./api
	github.com/cloudfoundry/stratos/src/jetstream/api/config => ./api/config
	github.com/cloudfoundry/stratos/src/jetstream/crypto => ./crypto
	github.com/cloudfoundry/stratos/src/jetstream/plugins/cfapppush => ./plugins/cfapppush
	github.com/cloudfoundry/stratos/src/jetstream/plugins/cloudfoundry => ./plugins/cloudfoundry
	github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes => ./plugins/kubernetes
	github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth => ./plugins/kubernetes/auth
	github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/terminal => ./plugins/kubernetes/terminal
	github.com/cloudfoundry/stratos/src/jetstream/plugins/monocular => ./plugins/monocular
)

// ported from plugins/kubernetes
replace (
	code.cloudfoundry.org/go-log-cache => code.cloudfoundry.org/go-log-cache v1.0.1-0.20211011162012-ede82a99d3cc
	github.com/SermoDigital/jose => github.com/SermoDigital/jose v0.9.2-0.20180104203859-803625baeddc
	github.com/sabhiram/go-gitignore => github.com/sabhiram/go-gitignore v0.0.0-20180611051255-d3107576ba94
	github.com/vito/go-interact => github.com/vito/go-interact v1.0.0
)

require (
	code.cloudfoundry.org/go-log-cache/v2 v2.0.7
	code.cloudfoundry.org/go-loggregator/v9 v9.2.1
	github.com/antonlindstrom/pgstore v0.0.0-20220421113606-e3a6e3fed12a
	github.com/cf-stratos/mysqlstore v0.0.0-20170822100912-304308519d13
	github.com/cloudfoundry-community/go-cfenv v1.18.0
	github.com/cloudfoundry/noaa/v2 v2.5.0
	github.com/cloudfoundry/sonde-go v0.0.0-20250505082611-517434ece96d
	github.com/cloudfoundry/stratos/src/jetstream/api v0.0.0-20250312201517-2a076063346f
	github.com/domodwyer/mailyak v3.1.1+incompatible
	github.com/fivetwenty-io/capi/v3 v3.222.4
	github.com/go-sql-driver/mysql v1.9.2
	github.com/golang/mock v1.6.0
	github.com/google/uuid v1.6.0
	github.com/gorilla/context v1.1.2
	github.com/gorilla/securecookie v1.1.2
	github.com/gorilla/sessions v1.4.0
	github.com/gorilla/websocket v1.5.4-0.20250319132907-e064f32e3674
	github.com/govau/cf-common v0.0.7
	github.com/kat-co/vala v0.0.0-20170210184112-42e1d8b61f12
	github.com/labstack/echo/v4 v4.13.3
	github.com/ncruces/go-sqlite3 v0.35.2
	github.com/pressly/goose v2.7.0+incompatible
	github.com/prometheus/client_golang v1.23.2
	github.com/prometheus/client_model v0.6.2
	github.com/samber/lo v1.50.0
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.9.4
	github.com/smartystreets/goconvey v1.8.1
	github.com/stretchr/testify v1.11.1
	github.com/swaggo/echo-swagger v1.4.1
	golang.org/x/crypto v0.53.0
	golang.org/x/sync v0.21.0
	gopkg.in/DATA-DOG/go-sqlmock.v1 v1.3.0
	gopkg.in/yaml.v2 v2.4.0
)

require (
	filippo.io/edwards25519 v1.2.0 // indirect
	github.com/KyleBanks/depth v1.2.1 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/blang/semver/v4 v4.0.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/fatih/color v1.19.0 // indirect
	github.com/fsnotify/fsnotify v1.9.0 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/go-openapi/jsonpointer v0.21.1 // indirect
	github.com/go-openapi/jsonreference v0.21.0 // indirect
	github.com/go-openapi/spec v0.21.0 // indirect
	github.com/go-openapi/swag v0.23.1 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/google/pprof v0.0.0-20260302011040-a15ffb7f9dcc // indirect
	github.com/gopherjs/gopherjs v1.17.2 // indirect
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.26.3 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-retryablehttp v0.7.8 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/jtolds/gls v4.20.0+incompatible // indirect
	github.com/kylelemons/godebug v1.1.0 // indirect
	github.com/labstack/gommon v0.4.2 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/mailru/easyjson v0.9.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/ncruces/go-sqlite3-wasm/v3 v3.2.35303 // indirect
	github.com/ncruces/julianday v1.0.0 // indirect
	github.com/nxadm/tail v1.4.11 // indirect
	github.com/onsi/ginkgo v1.16.5 // indirect
	github.com/onsi/ginkgo/v2 v2.28.1 // indirect
	github.com/onsi/gomega v1.39.1 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/prometheus/common v0.66.1 // indirect
	github.com/prometheus/procfs v0.16.1 // indirect
	github.com/rogpeppe/go-internal v1.14.1 // indirect
	github.com/sclevine/spec v1.4.0 // indirect
	github.com/smarty/assertions v1.15.0 // indirect
	github.com/swaggo/files/v2 v2.0.2 // indirect
	github.com/swaggo/swag v1.16.4 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	go.yaml.in/yaml/v2 v2.4.3 // indirect
	golang.org/x/net v0.56.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
	golang.org/x/text v0.39.0 // indirect
	golang.org/x/time v0.12.0 // indirect
	golang.org/x/tools v0.47.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20260414002931-afd174a4e478 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260414002931-afd174a4e478 // indirect
	google.golang.org/grpc v1.82.1 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
