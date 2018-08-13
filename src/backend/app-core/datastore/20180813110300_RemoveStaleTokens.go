package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180813110300, "RemoveStaleTokens", func(txn *sql.Tx, conf *goose.DBConf) error {

		removeStaleTokens := "DELETE t FROM tokens t LEFT JOIN cnsis c ON c.guid=t.cnsi_guid WHERE c.guid IS NULL AND t.token_type='cnsi';"
		_, err := txn.Exec(removeStaleTokens)
		if err != nil {
			return err
		}

		return nil
	})
}
