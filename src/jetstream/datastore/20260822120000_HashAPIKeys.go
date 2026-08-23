package datastore

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"regexp"

	"github.com/pressly/goose"
)

// safeAPIKeyGUID matches the machine-generated UUID stored in api_keys.guid.
// The migration inlines the guid and hash as SQL literals (both are strictly
// hex/hyphen character sets, so injection is not possible) to stay portable
// across the postgres/mysql/sqlite dialects without driver-specific bind
// placeholders; this guard rejects any unexpected guid rather than inlining it.
var safeAPIKeyGUID = regexp.MustCompile(`^[0-9a-fA-F-]{36}$`)

func init() {
	goose.AddMigration(Up20260822120000, nil)
}

// Up20260822120000 replaces the plaintext api_keys.secret values with their
// SHA-256 hashes so a database dump no longer yields usable API keys. The
// secrets held by users still authenticate: GetAPIKeyBySecret hashes the
// incoming value before the lookup.
func Up20260822120000(txn *sql.Tx) error {
	rows, err := txn.Query("SELECT guid, secret FROM api_keys")
	if err != nil {
		return err
	}

	type apiKeyRow struct{ guid, secret string }
	var keys []apiKeyRow
	for rows.Next() {
		var r apiKeyRow
		if err := rows.Scan(&r.guid, &r.secret); err != nil {
			rows.Close()
			return err
		}
		keys = append(keys, r)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	for _, k := range keys {
		if !safeAPIKeyGUID.MatchString(k.guid) {
			return fmt.Errorf("unexpected api_keys.guid format %q, aborting hash migration", k.guid)
		}
		sum := sha256.Sum256([]byte(k.secret))
		hashed := hex.EncodeToString(sum[:])
		if _, err := txn.Exec(fmt.Sprintf("UPDATE api_keys SET secret = '%s' WHERE guid = '%s'", hashed, k.guid)); err != nil {
			return err
		}
	}

	return nil
}
