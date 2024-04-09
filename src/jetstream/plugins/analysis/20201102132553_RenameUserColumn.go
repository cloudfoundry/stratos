package analysis

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20201102132553, nil)
}

func Up20201102132553(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	// `user` is a reserved keyword in postgres, so for postgres the column
	// was created as `user_guid` from the beginning -- skipping this migration.
	if _, ok := dialect.(*goose.PostgresDialect); ok {
		return nil
	}

	var renameQuery string

	if _, ok := dialect.(*goose.MySQLDialect); ok {
		renameQuery = `ALTER TABLE analysis CHANGE COLUMN user user_guid VARCHAR(36) NOT NULL`
	} else {
		renameQuery = `ALTER TABLE analysis RENAME user TO user_guid`
	}

	_, err := txn.Exec(renameQuery)
	if err != nil {
		return err
	}

	return nil
}
