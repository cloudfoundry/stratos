package analysis

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20201102132553, "RenameUserColumn", func(txn *sql.Tx, conf *goose.DBConf) error {
		// `user` is a reserved keyword in postgres, so for postgres the column
		// was created as `user_guid` from the beginning -- skipping this migration.
		if strings.Contains(conf.Driver.Name, "postgres") {
			return nil
		}

		var renameQuery string

		if strings.Contains(conf.Driver.Name, "mysql") {
			renameQuery = `ALTER TABLE analysis CHANGE COLUMN user user_guid VARCHAR(36) NOT NULL`
		} else {
			renameQuery = `ALTER TABLE analysis RENAME user TO user_guid`
		}

		_, err := txn.Exec(renameQuery)
		if err != nil {
			return err
		}

		return nil
	})
}
