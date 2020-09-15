package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	
	RegisterMigration(20190918092300, "LocalUsersUpdates", func(txn *sql.Tx, conf *goose.DBConf) error {
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
	})
}
