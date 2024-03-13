package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180831104300, nil)
}

func Up20180831104300(txn *sql.Tx) error {
	addTokenID := "ALTER TABLE cnsis ADD sso_allowed BOOLEAN NOT NULL DEFAULT FALSE"
	_, err := txn.Exec(addTokenID)
	if err != nil {
		return err
	}

	return nil
}
