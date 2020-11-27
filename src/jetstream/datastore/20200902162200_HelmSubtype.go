package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20200902162200, "HelmSubtype", func(txn *sql.Tx, conf *goose.DBConf) error {

		// Make sure all previous helm endpoints type shave the correct 'repo' sub type
		updateHelmRepoSubtype := "UPDATE cnsis SET sub_type='repo' WHERE cnsi_type='helm';"
		_, err := txn.Exec(updateHelmRepoSubtype)
		if err != nil {
			return err
		}

		return nil
	})
}
