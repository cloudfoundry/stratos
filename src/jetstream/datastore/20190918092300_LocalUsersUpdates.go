package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20190918092300, nil)
}

func Up20190918092300(txn *sql.Tx) error {
	addGivenNameColumn := "ALTER TABLE local_users ADD given_name VARCHAR(128);"
	_, err := txn.Exec(addGivenNameColumn)
	if err != nil {
		return err
	}

	addFamilyNameColumn := "ALTER TABLE local_users ADD family_name VARCHAR(128);"
	_, err = txn.Exec(addFamilyNameColumn)
	if err != nil {
		return err
	}

	// All existing data will not have values, so set to defaults
	populate := "UPDATE local_users SET given_name='Admin', family_name='User'"
	_, err = txn.Exec(populate)
	if err != nil {
		return err
	}

	return nil
}
