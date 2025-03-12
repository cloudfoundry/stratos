package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180907123000, nil)
}

func Up20180907123000(txn *sql.Tx) error {
	addTokenID := "ALTER TABLE console_config ADD use_sso BOOLEAN NOT NULL DEFAULT FALSE"
	_, err := txn.Exec(addTokenID)
	if err != nil {
		return err
	}

	return nil
}
