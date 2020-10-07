package monocular

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20201007113503, "RemoveHelmHub", func(txn *sql.Tx, conf *goose.DBConf) error {
		cleanCNSIS := "DELETE FROM cnsis WHERE guid IN (SELECT guid FROM cnsis WHERE cnsi_type='helm' AND sub_type='hub');"
		_, err := txn.Exec(cleanCNSIS)
		if err != nil {
			return err
		}

		return nil
	})
}
