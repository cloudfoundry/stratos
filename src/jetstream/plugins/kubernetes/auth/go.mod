module github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes/auth

go 1.21

replace (
	github.com/cloudfoundry-community/stratos/src/jetstream/api => ../../../api
	github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes => ../../kubernetes
	github.com/kubernetes-sigs/aws-iam-authenticator => github.com/kubernetes-sigs/aws-iam-authenticator v0.3.1-0.20190111160901-390d9087a4bc
	k8s.io/client-go => k8s.io/client-go v0.23.17
)

require (
	github.com/SermoDigital/jose v0.9.1
	github.com/aws/aws-sdk-go v1.44.324
	github.com/cloudfoundry-community/stratos/src/jetstream/api v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes v0.0.0-00010101000000-000000000000
	github.com/labstack/echo/v4 v4.11.3
	github.com/sirupsen/logrus v1.9.3
	k8s.io/client-go v0.27.3
	sigs.k8s.io/aws-iam-authenticator v0.6.11
)

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/cloudfoundry-community/go-cfenv v1.17.0 // indirect
	github.com/go-logr/logr v1.2.4 // indirect
	github.com/gofrs/flock v0.8.1 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/gorilla/securecookie v1.1.1 // indirect
	github.com/gorilla/sessions v1.2.1 // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	github.com/govau/cf-common v0.0.7 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/labstack/gommon v0.4.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.4 // indirect
	github.com/mitchellh/mapstructure v1.4.1 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/prometheus/client_golang v1.14.0 // indirect
	github.com/prometheus/client_model v0.3.0 // indirect
	github.com/prometheus/common v0.37.0 // indirect
	github.com/prometheus/procfs v0.8.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/net v0.17.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/protobuf v1.31.0 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	k8s.io/apimachinery v0.28.0 // indirect
	k8s.io/klog/v2 v2.100.1 // indirect
	k8s.io/utils v0.0.0-20230406110748-d93618cff8a2 // indirect
	sigs.k8s.io/json v0.0.0-20221116044647-bc3834ca7abd // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.2.3 // indirect
)
