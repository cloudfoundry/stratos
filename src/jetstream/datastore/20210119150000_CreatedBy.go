package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20210119150000, "CreatedBy", func(txn *sql.Tx, conf *goose.DBConf) error {
		alterCNSI := "ALTER TABLE cnsis ADD COLUMN created_by VARCHAR(36) NOT NULL DEFAULT '';"

		_, err := txn.Exec(alterCNSI)
		if err != nil {
			return err
		}

		return nil
	})
}
