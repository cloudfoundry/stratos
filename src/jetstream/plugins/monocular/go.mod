module github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular

go 1.12

require (
	bitbucket.org/liamstask/goose v0.0.0-20150115234039-8488cc47d90c
	github.com/Masterminds/semver/v3 v3.1.0 // indirect
	github.com/go-sql-driver/mysql v1.4.1 // indirect
	github.com/kubeapps/common v0.0.0-20190508164739-10b110436c1a
	github.com/kylelemons/go-gypsy v0.0.0-20160905020020-08cad365cd28 // indirect
	github.com/labstack/echo v3.3.10+incompatible
	github.com/labstack/gommon v0.3.0 // indirect
	github.com/lib/pq v1.0.0 // indirect
	github.com/mattn/go-sqlite3 v1.10.0 // indirect
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.4.2
	github.com/ziutek/mymysql v1.5.4 // indirect
	golang.org/x/crypto v0.0.0-20200820211705-5c72a883971a // indirect
	gopkg.in/yaml.v2 v2.3.0 // indirect
)

replace github.com/cloudfoundry-incubator/stratos/src/jetstream => ../..
