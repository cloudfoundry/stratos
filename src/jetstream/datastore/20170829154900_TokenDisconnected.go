package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20170829154900, nil)
}

func Up20170829154900(txn *sql.Tx) error {
	alterTokens := "ALTER TABLE tokens ADD COLUMN disconnected boolean NOT NULL DEFAULT FALSE;"

	_, err := txn.Exec(alterTokens)
	if err != nil {
		return err
	}

	return nil
}
