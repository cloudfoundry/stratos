package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20171108102900, nil)
}
func Up20171108102900(txn *sql.Tx) error {
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
}
