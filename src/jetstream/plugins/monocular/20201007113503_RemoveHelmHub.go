package monocular

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20201007113503, nil)
}

func Up20201007113503(txn *sql.Tx) error {
	cleanCNSIS := "DELETE FROM cnsis WHERE cnsi_type='helm' AND sub_type='hub';"
	_, err := txn.Exec(cleanCNSIS)
	if err != nil {
		return err
	}

	return nil
}
