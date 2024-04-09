package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20210201110000, nil)
}

func Up20210201110000(txn *sql.Tx) error {
	alterCNSI := "ALTER TABLE cnsis ADD COLUMN creator VARCHAR(36) NOT NULL DEFAULT '';"

	_, err := txn.Exec(alterCNSI)
	if err != nil {
		return err
	}

	return nil
}
