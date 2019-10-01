package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190930092500, "LocalUsersTriggerFix", func(txn *sql.Tx, conf *goose.DBConf) error {

		var dropTrigger string

		if strings.Contains(conf.Driver.Name, "sqlite") {
			//SQLITE
			dropTrigger = "DROP TRIGGER update_last_updated;"
		}
		if strings.Contains(conf.Driver.Name, "postgres") {
			// POSTGRESQL
			dropTrigger = "DROP TRIGGER update_trigger ON local_users;"
		} else if strings.Contains(conf.Driver.Name, "mysql") {
			// MYSQL
			dropTrigger = "DROP TRIGGER update_last_updated;"
		}

		if len(dropTrigger) > 0 {
			// Remove the trigger
			_, err := txn.Exec(dropTrigger)
			return err
		}

		return nil
	})
}
