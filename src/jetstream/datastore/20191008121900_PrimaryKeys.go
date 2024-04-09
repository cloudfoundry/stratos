package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20191008121900, nil)
}
func Up20191008121900(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	// Make sure all tokens have a CNSI guid
	ensureTokensHaveCnsi := "UPDATE tokens SET cnsi_guid='STRATOS' WHERE token_type='uaa' and cnsi_guid IS NULL;"
	_, err := txn.Exec(ensureTokensHaveCnsi)
	if err != nil {
		return err
	}

	// Note: SQLite does not allow constraints to be added after table creation
	if _, ok := dialect.(*goose.Sqlite3Dialect); ok {
		return nil
	}

	// Need cnsi_guid to not be NULL in order to be able to create this primary key
	addTokensPrimaryKey := "ALTER TABLE tokens ADD CONSTRAINT PK_Tokens PRIMARY KEY (user_guid, cnsi_guid, token_guid);"
	_, err = txn.Exec(addTokensPrimaryKey)
	if err != nil {
		return err
	}

	addSetupConfigPrimaryKey := "ALTER TABLE console_config ADD CONSTRAINT PK_ConsoleConfig PRIMARY KEY (uaa_endpoint, console_admin_scope);"
	_, err = txn.Exec(addSetupConfigPrimaryKey)
	if err != nil {
		return err
	}

	addConfigPrimaryKey := "ALTER TABLE config ADD CONSTRAINT PK_Config PRIMARY KEY (groupName, name);"
	_, err = txn.Exec(addConfigPrimaryKey)
	if err != nil {
		return err
	}

	return nil
}
