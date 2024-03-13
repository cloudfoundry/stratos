package monocular

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20200206090600, nil)
}

func Up20200206090600(txn *sql.Tx) error {
	dropChartsTable := "DROP TABLE IF EXISTS charts"
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
}
