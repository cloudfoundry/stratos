package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180413135700, "MetricsSchema", func(txn *sql.Tx, conf *goose.DBConf) error {
		if strings.Contains(conf.Driver.Name, "sqlite3") {
			// SQLite does not support MODIFY on ALTER TABLE - but fortunately it doesn't mind about the column sizes
			return nil
		}

		// Special case Postgres as it has different syntax
		if strings.Contains(conf.Driver.Name, "postgres") {
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
	})
}
