package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20190305144600, nil)
}

func Up20190305144600(txn *sql.Tx) error {
	addColumn := "ALTER TABLE cnsis ADD sub_type VARCHAR(64) DEFAULT NULL"
	_, err := txn.Exec(addColumn)
	if err != nil {
		return err
	}

	addColumn = "ALTER TABLE cnsis ADD meta_data TEXT DEFAULT NULL"
	_, err = txn.Exec(addColumn)
	if err != nil {
		return err
	}

	return nil
}
