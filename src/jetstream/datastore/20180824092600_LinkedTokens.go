package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180813110300, "LinkedTokens", func(txn *sql.Tx, conf *goose.DBConf) error {

		addTokenID := "ALTER TABLE tokens ADD token_guid VARCHAR(36) DEFAULT 'default-token'"
		_, err := txn.Exec(addTokenID)
		if err != nil {
			return err
		}

		addLinkedTokens := "ALTER TABLE tokens ADD linked_token VARCHAR(36)"
		_, err = txn.Exec(addLinkedTokens)
		if err != nil {
			return err
		}

		// Ensure any existing tokens have an ID
		ensureTokenID := "UPDATE tokens SET token_guid='default-token' WHERE token_guid IS NULL"
		_, err = txn.Exec(ensureTokenID)
		if err != nil {
			return err
		}

		return nil
	})
}
