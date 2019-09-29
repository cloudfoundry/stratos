package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190614121900, "PrimaryKeys", func(txn *sql.Tx, conf *goose.DBConf) error {

		// Note: SQLite does not allow constraints to be added after table creation
		if strings.Contains(conf.Driver.Name, "sqlite3") {
			return nil
		}

		addTokensPrimaryKey := "ALTER TABLE tokens ADD CONSTRAINT PK_Tokens PRIMARY KEY (user_guid, cnsi_guid, token_guid);"
		_, err := txn.Exec(addTokensPrimaryKey)
		if err != nil {
			return err
		}

		addSetupConfigPrimaryKey := "ALTER TABLE console_config ADD CONSTRAINT PK_ConsoleConfig PRIMARY KEY (uaa_endpoint, console_admin_scope);"
		_, err = txn.Exec(addSetupConfigPrimaryKey)
		if err != nil {
			return err
		}

		return nil
	})
}
