module github.com/cloudfoundry/stratos/src/jetstream

go 1.25.0

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
	code.cloudfoundry.org/go-log-cache v1.0.1-0.20230224210401-5e305670b626
	code.cloudfoundry.org/go-loggregator/v8 v8.0.5
	github.com/antonlindstrom/pgstore v0.0.0-20220421113606-e3a6e3fed12a
	github.com/cf-stratos/mysqlstore v0.0.0-20170822100912-304308519d13
	github.com/cloudfoundry-community/go-cfenv v1.18.0
	github.com/cloudfoundry/noaa/v2 v2.5.0
	github.com/cloudfoundry/sonde-go v0.0.0-20250505082611-517434ece96d
	github.com/cloudfoundry/stratos/src/jetstream/api v0.0.0-20250312201517-2a076063346f
	github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth v0.0.0-20250312201517-2a076063346f
	github.com/domodwyer/mailyak v3.1.1+incompatible
	github.com/go-sql-driver/mysql v1.9.2
	github.com/golang/mock v1.6.0
	github.com/gorilla/context v1.1.2
	github.com/gorilla/securecookie v1.1.2
	github.com/gorilla/sessions v1.4.0
	github.com/gorilla/websocket v1.5.4-0.20250319132907-e064f32e3674
	github.com/govau/cf-common v0.0.7
	github.com/kat-co/vala v0.0.0-20170210184112-42e1d8b61f12
	github.com/labstack/echo/v4 v4.13.3
	github.com/mattn/go-sqlite3 v1.14.28
	github.com/nwmac/sqlitestore v0.0.0-20180824125213-7d2ab221fb3f
	github.com/pressly/goose v2.7.0+incompatible
	github.com/samber/lo v1.50.0
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.9.3
	github.com/smartystreets/goconvey v1.8.1
	github.com/swaggo/echo-swagger v1.4.1
	golang.org/x/crypto v0.46.0
	gopkg.in/DATA-DOG/go-sqlmock.v1 v1.3.0
	gopkg.in/yaml.v2 v2.4.0
	k8s.io/client-go v0.35.1
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/KyleBanks/depth v1.2.1 // indirect
	github.com/SermoDigital/jose v0.9.2-0.20161205224733-f6df55f235c2 // indirect
	github.com/aws/aws-sdk-go v1.55.7 // indirect
	github.com/aws/aws-sdk-go-v2 v1.36.3 // indirect
	github.com/aws/smithy-go v1.22.3 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/blang/semver v3.5.1+incompatible // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes v0.0.0-20250312201517-2a076063346f // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/fsnotify/fsnotify v1.9.0 // indirect
	github.com/fxamacker/cbor/v2 v2.9.0 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-openapi/jsonpointer v0.21.1 // indirect
	github.com/go-openapi/jsonreference v0.21.0 // indirect
	github.com/go-openapi/spec v0.21.0 // indirect
	github.com/go-openapi/swag v0.23.1 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/gofrs/flock v0.13.0 // indirect
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/gopherjs/gopherjs v1.17.2 // indirect
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.26.3 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/jtolds/gls v4.20.0+incompatible // indirect
	github.com/labstack/gommon v0.4.2 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/mailru/easyjson v0.9.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.3-0.20250322232337-35a7c28c31ee // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/nxadm/tail v1.4.11 // indirect
	github.com/onsi/ginkgo v1.16.5 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/prometheus/client_golang v1.23.2 // indirect
	github.com/prometheus/client_model v0.6.2 // indirect
	github.com/prometheus/common v0.66.1 // indirect
	github.com/prometheus/procfs v0.16.1 // indirect
	github.com/sclevine/spec v1.4.0 // indirect
	github.com/smarty/assertions v1.15.0 // indirect
	github.com/spf13/afero v1.14.0 // indirect
	github.com/spf13/pflag v1.0.10 // indirect
	github.com/swaggo/files/v2 v2.0.2 // indirect
	github.com/swaggo/swag v1.16.4 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	go.yaml.in/yaml/v2 v2.4.3 // indirect
	golang.org/x/net v0.48.0 // indirect
	golang.org/x/oauth2 v0.34.0 // indirect
	golang.org/x/sys v0.40.0 // indirect
	golang.org/x/term v0.39.0 // indirect
	golang.org/x/text v0.33.0 // indirect
	golang.org/x/time v0.12.0 // indirect
	golang.org/x/tools v0.40.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20251202230838-ff82c1b0f217 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251202230838-ff82c1b0f217 // indirect
	google.golang.org/grpc v1.79.3 // indirect
	google.golang.org/protobuf v1.36.10 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	k8s.io/apimachinery v0.35.1 // indirect
	k8s.io/klog/v2 v2.130.1 // indirect
	k8s.io/kube-openapi v0.0.0-20250910181357-589584f1c912 // indirect
	k8s.io/utils v0.0.0-20251002143259-bc988d571ff4 // indirect
	sigs.k8s.io/aws-iam-authenticator v0.7.2 // indirect
	sigs.k8s.io/json v0.0.0-20250730193827-2d320260d730 // indirect
	sigs.k8s.io/randfill v1.0.0 // indirect
	sigs.k8s.io/structured-merge-diff/v6 v6.3.0 // indirect
	sigs.k8s.io/yaml v1.6.0 // indirect
)
