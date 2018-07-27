package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20170829154900, "TokenDisconnected", func(txn *sql.Tx, conf *goose.DBConf) error {
		alterTokens := "ALTER TABLE tokens ADD COLUMN disconnected boolean NOT NULL DEFAULT FALSE;"

		_, err := txn.Exec(alterTokens)
		if err != nil {
			return err
		}

		return nil
	})
}
