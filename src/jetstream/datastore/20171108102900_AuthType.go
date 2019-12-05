package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20171108102900, "AuthType", func(txn *sql.Tx, conf *goose.DBConf) error {
		createTokens := "ALTER TABLE tokens ADD auth_type VARCHAR(255) DEFAULT 'OAuth2'"
		_, err := txn.Exec(createTokens)
		if err != nil {
			return err
		}

		createTokens = "ALTER TABLE tokens ADD meta_data TEXT"
		_, err = txn.Exec(createTokens)
		if err != nil {
			return err
		}

		return nil
	})
}
