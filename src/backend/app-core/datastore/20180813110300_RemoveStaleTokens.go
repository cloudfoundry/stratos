package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180813110300, "RemoveStaleTokens", func(txn *sql.Tx, conf *goose.DBConf) error {

		removeStaleTokens := "DELETE FROM tokens WHERE token_type='cnsi' AND cnsi_guid NOT IN (SELECT guid FROM cnsis);"
		_, err := txn.Exec(removeStaleTokens)
		if err != nil {
			return err
		}

		return nil
	})
}
