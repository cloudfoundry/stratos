module github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular

go 1.12

require (
	bitbucket.org/liamstask/goose v0.0.0-20150115234039-8488cc47d90c
	github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces v0.0.0-00010101000000-000000000000
	github.com/go-sql-driver/mysql v1.4.1 // indirect
	github.com/helm/monocular v1.4.0
	github.com/helm/monocular/chartrepo v0.0.0-00010101000000-000000000000
	github.com/helm/monocular/chartsvc v0.0.0-00010101000000-000000000000
	github.com/kubeapps/common v0.0.0-20181107174310-61d8eb6f11b4
	github.com/kylelemons/go-gypsy v0.0.0-20160905020020-08cad365cd28 // indirect
	github.com/labstack/echo v3.3.10+incompatible
	github.com/lib/pq v1.0.0 // indirect
	github.com/mattn/go-sqlite3 v1.10.0 // indirect
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.3.0
	github.com/ziutek/mymysql v1.5.4 // indirect
)

replace (
	github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces => ../../repository/interfaces
	github.com/helm/monocular/chartrepo => ./chart-repo
	github.com/helm/monocular/chartsvc => ./chartsvc
)
