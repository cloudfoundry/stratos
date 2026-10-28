package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20261028120000, nil)
}

// Up20261028120000 adds API key expiry. A NULL expires_at means the key never
// expires, so existing keys keep working. last_used_refused records that the
// most recent use was refused because the key had expired.
func Up20261028120000(txn *sql.Tx) error {
	for _, stmt := range []string{
		"ALTER TABLE api_keys ADD COLUMN expires_at TIMESTAMP NULL;",
		"ALTER TABLE api_keys ADD COLUMN last_used_refused BOOLEAN NOT NULL DEFAULT FALSE;",
	} {
		if _, err := txn.Exec(stmt); err != nil {
			return err
		}
	}

	return nil
}
