package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20190515133200, nil)
}

func Up20190515133200(txn *sql.Tx) error {
	addColumn := "ALTER TABLE console_config ADD auth_endpoint VARCHAR(255)"
	_, err := txn.Exec(addColumn)
	if err != nil {
		return err
	}

	return nil
}
