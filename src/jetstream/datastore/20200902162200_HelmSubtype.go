package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20200902162200, nil)
}

func Up20200902162200(txn *sql.Tx) error {
	// Make sure all previous helm endpoints type shave the correct 'repo' sub type
	updateHelmRepoSubtype := "UPDATE cnsis SET sub_type='repo' WHERE cnsi_type='helm';"
	_, err := txn.Exec(updateHelmRepoSubtype)
	if err != nil {
		return err
	}

	return nil
}
