package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180627111300, "UpdateMetadata", func(txn *sql.Tx, conf *goose.DBConf) error {
		// Removed migration, the backend has been updated to deal with nullable reads in the tokens table
		return nil
	})
}
