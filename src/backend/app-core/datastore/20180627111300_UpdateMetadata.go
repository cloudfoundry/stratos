package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20180627111300, "UpdateMetadata", func(txn *sql.Tx, conf *goose.DBConf) error {
		var statements []string

		switch {
		case strings.Contains(conf.Driver.Name, "postgres"):
			statements = append(statements,
				"ALTER TABLE tokens ALTER COLUMN meta_data SET DEFAULT ''",
				"UPDATE tokens SET meta_data='' where meta_data is NULL",
			)

		case strings.Contains(conf.Driver.Name, "sqlite3"):
			// sqllite cannot alter existing columns, so we need to rename the table, and copy the data into a new table
			statements = append(statements,
				"DROP INDEX tokens_user_guid",
				"DROP INDEX tokens_cnsi_guid",
				"DROP INDEX tokens_token_type",
				"UPDATE tokens SET meta_data='' where meta_data is NULL",
				"ALTER TABLE tokens RENAME TO _old_tokens",
				`CREATE TABLE tokens (
					user_guid     VARCHAR(36) NOT NULL,
					cnsi_guid     VARCHAR(36),
					token_type    VARCHAR(4)  NOT NULL,
					auth_token    BYTEA       NOT NULL,
					refresh_token BYTEA       NOT NULL,
					token_expiry  BIGINT      NOT NULL,
					last_updated  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
					disconnected boolean      NOT NULL DEFAULT FALSE,
					auth_type VARCHAR(255)    DEFAULT 'OAuth2',
					meta_data TEXT DEFAULT ''
				)`,
				`INSERT INTO tokens (
						user_guid,
						cnsi_guid,
						token_type,
						auth_token,
						refresh_token,
						token_expiry,
						last_updated,
						disconnected,
						auth_type,
						meta_data)
					SELECT user_guid,
						cnsi_guid,
						token_type,
						auth_token,
						refresh_token,
						token_expiry,
						last_updated,
						disconnected,
						auth_type,
						meta_data
					FROM _old_tokens`,
				"CREATE INDEX tokens_user_guid ON tokens (user_guid)",
				"CREATE INDEX tokens_cnsi_guid ON tokens (cnsi_guid)",
				"CREATE INDEX tokens_token_type ON tokens (token_type)",
				"DROP TABLE _old_tokens",
			)
		default: // fallback to MySQL
			statements = append(statements,
				"ALTER TABLE tokens modify meta_data TEXT DEFAULT ''",
				"UPDATE tokens SET meta_data='' where meta_data is NULL",
			)
		}

		for _, st := range statements {
			_, err := txn.Exec(st)
			if err != nil {
				return err
			}
		}

		return nil
	})
}
