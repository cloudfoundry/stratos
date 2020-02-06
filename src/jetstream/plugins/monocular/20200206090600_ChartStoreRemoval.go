package monocular

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20200206090600, "ChartStoreRemoval", func(txn *sql.Tx, conf *goose.DBConf) error {

		dropChartsTable := "DROP TABLE IF EXISTS charts";
		_, err := txn.Exec(dropChartsTable)
		if err != nil {
			return err
		}

		dropChartFilesTable := "DROP TABLE IF EXISTS chart_files;"
		_, err = txn.Exec(dropChartFilesTable)
		if err != nil {
			return err
		}

		return nil
	})
}
