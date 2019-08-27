package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190515133200, "AuthEndpoint", func(txn *sql.Tx, conf *goose.DBConf) error {

		addColumn := "ALTER TABLE console_config ADD auth_endpoint VARCHAR(255)"
		_, err := txn.Exec(addColumn)
		if err != nil {
			return err
		}

		return nil
	})
}
