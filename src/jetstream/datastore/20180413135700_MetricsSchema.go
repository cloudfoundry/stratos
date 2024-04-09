package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20180413135700, nil)
}

func Up20180413135700(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	if _, ok := dialect.(*goose.Sqlite3Dialect); ok {
		// SQLite does not support MODIFY on ALTER TABLE - but fortunately it doesn't mind about the column sizes
		return nil
	}

	// Special case Postgres as it has different syntax
	if _, ok := dialect.(*goose.PostgresDialect); ok {
		alterColumn := "ALTER TABLE cnsis ALTER COLUMN cnsi_type TYPE VARCHAR(16), ALTER COLUMN cnsi_type SET NOT NULL"
		_, err := txn.Exec(alterColumn)
		if err != nil {
			return err
		}
	} else {
		// Fallback to MySQL
		alterColumn := "ALTER TABLE cnsis modify cnsi_type VARCHAR(16) NOT NULL"
		_, err := txn.Exec(alterColumn)
		if err != nil {
			return err
		}
	}

	return nil
}
