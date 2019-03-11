package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190305144600, "EndpointSubtype", func(txn *sql.Tx, conf *goose.DBConf) error {

		addColumn := "ALTER TABLE cnsis ADD sub_type VARCHAR(64) DEFAULT NULL"
		_, err := txn.Exec(addColumn)
		if err != nil {
			return err
		}

		addColumn = "ALTER TABLE cnsis ADD meta_data TEXT DEFAULT NULL"
		_, err = txn.Exec(addColumn)
		if err != nil {
			return err
		}

		return nil
	})
}
