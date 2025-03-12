package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180627111300, nil)
}

func Up20180627111300(txn *sql.Tx) error {
	// Removed migration, the backend has been updated to deal with nullable reads in the tokens table
	return nil
}
