package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20201201163100, "EndpointCACert", func(txn *sql.Tx, conf *goose.DBConf) error {
		createCertColumn := "ALTER TABLE cnsis ADD ca_cert TEXT"
		_, err := txn.Exec(createCertColumn)
		if err != nil {
			return err
		}

		createEnableColumn := "ALTER TABLE tokens ADD enabled BOOLEAN NOT NULL DEFAULT TRUE"
		_, err = txn.Exec(createEnableColumn)
		if err != nil {
			return err
		}

		return nil
	})
}
