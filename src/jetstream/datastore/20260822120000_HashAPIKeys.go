package datastore

import (
	"crypto/hmac"
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

// apiKeyHMACKey is the pepper (the server encryption key) used to hash existing
// api_keys.secret values during migration. It must match what crypto.HashAPIKey
// uses on the live path. main sets it via SetAPIKeyHMACKey before migrations run.
var apiKeyHMACKey []byte

// SetAPIKeyHMACKey provides the pepper used by Up20260822120000 to hash existing
// API key secrets. Call once, before ApplyMigrations.
func SetAPIKeyHMACKey(key []byte) {
	apiKeyHMACKey = key
}

func init() {
	goose.AddMigration(Up20260822120000, nil)
}

// Up20260822120000 replaces the plaintext api_keys.secret values with a keyed
// hash (HMAC-SHA256 peppered with the encryption key) so a database dump no
// longer yields usable API keys. Secrets held by users still authenticate:
// GetAPIKeyBySecret hashes the incoming value the same way before the lookup.
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

	if len(keys) > 0 && len(apiKeyHMACKey) == 0 {
		return fmt.Errorf("cannot migrate api_keys: encryption key (HMAC pepper) not set")
	}

	for _, k := range keys {
		if !safeAPIKeyGUID.MatchString(k.guid) {
			return fmt.Errorf("unexpected api_keys.guid format %q, aborting hash migration", k.guid)
		}
		mac := hmac.New(sha256.New, apiKeyHMACKey)
		mac.Write([]byte(k.secret))
		hashed := hex.EncodeToString(mac.Sum(nil))
		if _, err := txn.Exec(fmt.Sprintf("UPDATE api_keys SET secret = '%s' WHERE guid = '%s'", hashed, k.guid)); err != nil {
			return err
		}
	}

	return nil
}
