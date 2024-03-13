package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180703142800, nil)
}

func Up20180703142800(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	binaryDataType := "BYTEA"

	if _, ok := dialect.(*goose.MySQLDialect); ok {
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
}
