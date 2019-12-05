package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180703142800, "SetupSchema", func(txn *sql.Tx, conf *goose.DBConf) error {
		binaryDataType := "BYTEA"
		if strings.Contains(conf.Driver.Name, "mysql") {
			binaryDataType = "BLOB"
		}

		alterCnsis := "ALTER TABLE cnsis ADD COLUMN client_id VARCHAR(255) NOT NULL DEFAULT 'cf';"
		_, err := txn.Exec(alterCnsis)
		if err != nil {
			return err
		}

		alterCnsis = "ALTER TABLE cnsis ADD COLUMN client_secret " + binaryDataType + ";"
		_, err = txn.Exec(alterCnsis)
		if err != nil {
			return err
		}

		return nil
	})
}
