package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20190930092500, nil)
}

func Up20190930092500(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	var dropTrigger string

	if _, ok := dialect.(*goose.Sqlite3Dialect); ok {
		//SQLITE
		dropTrigger = "DROP TRIGGER IF EXISTS update_last_updated;"
	}

	if _, ok := dialect.(*goose.PostgresDialect); ok {
		// POSTGRESQL
		dropTrigger = "DROP TRIGGER IF EXISTS update_trigger ON local_users;"
	} else if _, ok := dialect.(*goose.MySQLDialect); ok {
		// MYSQL
		dropTrigger = "DROP TRIGGER IF EXISTS update_last_updated;"
		// Ignore error - most likely permission bug issue on Mysql
		txn.Exec(dropTrigger)
		return nil
	}

	if len(dropTrigger) > 0 {
		// Remove the trigger
		_, err := txn.Exec(dropTrigger)
		return err
	}

	return nil
}
