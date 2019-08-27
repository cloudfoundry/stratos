package monocular

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20190307115301, "ChartStore", func(txn *sql.Tx, conf *goose.DBConf) error {

		createChartsTable := "CREATE TABLE IF NOT EXISTS charts ("
		createChartsTable += "id                  VARCHAR(255) NOT NULL,"
		createChartsTable += "name                VARCHAR(255) NOT NULL,"
		createChartsTable += "repo_name           VARCHAR(255) NOT NULL,"
		createChartsTable += "update_batch        VARCHAR(64)  NOT NULL,"
		createChartsTable += "content             TEXT,"
		createChartsTable += "last_updated        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
		createChartsTable += "PRIMARY KEY (id) );"

		_, err := txn.Exec(createChartsTable)
		if err != nil {
			return err
		}

		createIndex := "CREATE INDEX charts_id ON charts (id);"
		_, err = txn.Exec(createIndex)
		if err != nil {
			return err
		}

		binaryDataType := "BYTEA"
		if strings.Contains(conf.Driver.Name, "mysql") {
			binaryDataType = "BLOB"
		}

		createChartFilesTable := "CREATE TABLE IF NOT EXISTS chart_files ("
		createChartFilesTable += "id                  VARCHAR(255) NOT NULL,"
		createChartFilesTable += "filename            VARCHAR(64)  NOT NULL,"
		createChartFilesTable += "chart_id            VARCHAR(255) NOT NULL,"
		createChartFilesTable += "name                VARCHAR(255) NOT NULL,"
		createChartFilesTable += "repo_name           VARCHAR(255) NOT NULL,"
		createChartFilesTable += "digest              VARCHAR(255) NOT NULL,"
		createChartFilesTable += "content             " + binaryDataType + ","
		createChartFilesTable += "PRIMARY KEY (id, filename) );"

		_, err = txn.Exec(createChartFilesTable)
		if err != nil {
			return err
		}

		return nil
	})
}
