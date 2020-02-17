module github.com/helm/monocular/chartrepo

go 1.12

require (
	github.com/Masterminds/semver v1.5.0 // indirect
	github.com/arschles/assert v1.0.0
	github.com/cyphar/filepath-securejoin v0.2.2 // indirect
	github.com/disintegration/imaging v1.6.2
	github.com/ghodss/yaml v1.0.0
	github.com/globalsign/mgo v0.0.0-20181015135952-eeefdecb41b8 // indirect
	github.com/gobwas/glob v0.2.3 // indirect
	github.com/golang/snappy v0.0.1 // indirect
	github.com/google/uuid v1.1.1
	github.com/gorilla/mux v1.7.3
	github.com/heptiolabs/healthcheck v0.0.0-20180807145615-6ff867650f40
	github.com/jinzhu/copier v0.0.0-20190924061706-b57f9002281a
	github.com/kubeapps/common v0.0.0-20190508164739-10b110436c1a
	github.com/prometheus/client_golang v1.2.1 // indirect
	github.com/sirupsen/logrus v1.4.2
	github.com/spf13/cobra v0.0.5
	github.com/stretchr/testify v1.4.0
	github.com/urfave/negroni v1.0.0
	github.com/xdg/scram v0.0.0-20180814205039-7eeb5667e42c // indirect
	github.com/xdg/stringprep v1.0.0 // indirect
	go.mongodb.org/mongo-driver v1.1.3
	golang.org/x/sync v0.0.0-20190911185100-cd5d95a43a6e // indirect
	k8s.io/apimachinery v0.0.0-20191203211716-adc6f4cd9e7d // indirect
	k8s.io/client-go v11.0.0+incompatible // indirect
	k8s.io/helm v2.16.1+incompatible
)

replace (
	github.com/helm/monocular/chartrepo/common => ./common
	github.com/helm/monocular/chartrepo/foundationdb => ./foundationdb
	github.com/helm/monocular/chartrepo/utils => ./utils
)
