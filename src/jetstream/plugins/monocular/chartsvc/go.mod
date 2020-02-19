module github.com/helm/monocular/chartsvc

go 1.12

require (
	github.com/disintegration/imaging v1.6.2
	github.com/globalsign/mgo v0.0.0-20181015135952-eeefdecb41b8
	github.com/golang/snappy v0.0.1 // indirect
	github.com/gorilla/mux v1.7.3
	github.com/heptiolabs/healthcheck v0.0.0-20180807145615-6ff867650f40
	github.com/kubeapps/common v0.0.0-20190508164739-10b110436c1a
	github.com/labstack/echo v3.3.10+incompatible // indirect
	github.com/labstack/gommon v0.3.0 // indirect
	github.com/prometheus/client_golang v1.2.1 // indirect
	github.com/sirupsen/logrus v1.4.2
	github.com/stretchr/testify v1.4.0
	github.com/unrolled/render v1.0.1 // indirect
	github.com/urfave/negroni v1.0.0
	github.com/xdg/scram v0.0.0-20180814205039-7eeb5667e42c // indirect
	github.com/xdg/stringprep v1.0.0 // indirect
	go.mongodb.org/mongo-driver v1.1.3
	golang.org/x/crypto v0.0.0-20191205161847-0a08dada0ff9 // indirect
	golang.org/x/sync v0.0.0-20190911185100-cd5d95a43a6e // indirect
	k8s.io/helm v2.16.1+incompatible
)

replace (
	github.com/helm/monocular/chartsvc/foundationdb => ./foundationdb
	github.com/helm/monocular/chartsvc/models => ./models
	github.com/helm/monocular/chartsvc/utils => ./utils
)
