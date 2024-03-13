package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180813110300, nil)
}

func Up20180813110300(txn *sql.Tx) error {
	removeStaleTokens := "DELETE FROM tokens WHERE token_type='cnsi' AND cnsi_guid NOT IN (SELECT guid FROM cnsis);"
	_, err := txn.Exec(removeStaleTokens)
	if err != nil {
		return err
	}

	return nil
}
