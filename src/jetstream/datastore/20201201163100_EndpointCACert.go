package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20201201163100, nil)
}

func Up20201201163100(txn *sql.Tx) error {
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
}
