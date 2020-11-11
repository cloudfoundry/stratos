package monocular

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20200819184800, "HelmChartStore", func(txn *sql.Tx, conf *goose.DBConf) error {

		// This is a dupe of 20190307115301. After the kube upstreaming process it was skipped during upstream upgrades
		createChartsTable := "CREATE TABLE IF NOT EXISTS helm_charts ("
		createChartsTable += "endpoint            VARCHAR(64)  NOT NULL,"
		createChartsTable += "name                VARCHAR(255) NOT NULL,"
		createChartsTable += "repo_name           VARCHAR(255) NOT NULL,"
		createChartsTable += "version             VARCHAR(64)  NOT NULL,"
		createChartsTable += "created             TIMESTAMP    NOT NULL,"
		createChartsTable += "app_version         VARCHAR(64)  NOT NULL,"
		createChartsTable += "description         VARCHAR(255) NOT NULL,"
		createChartsTable += "icon_url            VARCHAR(255) NOT NULL,"
		createChartsTable += "chart_url           VARCHAR(255) NOT NULL,"
		createChartsTable += "source_url          VARCHAR(255) NOT NULL,"
		createChartsTable += "digest              VARCHAR(64)  NOT NULL,"
		createChartsTable += "is_latest           BOOLEAN      NOT NULL DEFAULT FALSE,"
		createChartsTable += "update_batch        VARCHAR(64)  NOT NULL,"
		createChartsTable += "PRIMARY KEY (endpoint, name, version) );"

		_, err := txn.Exec(createChartsTable)
		if err != nil {
			return err
		}

		createIndex := "CREATE INDEX helm_charts_endpoint ON helm_charts (endpoint, name, version);"
		_, err = txn.Exec(createIndex)
		if err != nil {
			return err
		}

		createRepoIndex := "CREATE INDEX helm_charts_repository ON helm_charts (name, repo_name, version);"
		_, err = txn.Exec(createRepoIndex)
		if err != nil {
			return err
		}

		return nil
	})
}
