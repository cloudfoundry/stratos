package backup

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/crypto"
)

func TestEncryptDecryptPayloadRoundTrip(t *testing.T) {
	payload := &BackupContentPayload{
		Endpoints: []map[string]interface{}{{"name": "test-endpoint"}},
	}

	encrypted, err := encryptPayload(payload, "correct horse battery staple")
	if err != nil {
		t.Fatalf("encryptPayload failed: %v", err)
	}

	decrypted, err := decryptPayload(encrypted, "correct horse battery staple")
	if err != nil {
		t.Fatalf("decryptPayload failed: %v", err)
	}
	if !strings.Contains(*decrypted, "test-endpoint") {
		t.Fatalf("decrypted payload missing content: %s", *decrypted)
	}

	// AES-CFB is unauthenticated: a wrong password yields garbage rather
	// than an error (restore detects it at JSON parse)
	garbage, err := decryptPayload(encrypted, "wrong password")
	if err == nil && strings.Contains(*garbage, "test-endpoint") {
		t.Fatal("wrong password recovered the plaintext")
	}
}

func TestDecryptPayloadLegacyFormat(t *testing.T) {
	// Backups created before the PBKDF2 format: single-round SHA256 key,
	// no magic prefix
	payloadBytes, err := json.Marshal(&BackupContentPayload{
		Endpoints: []map[string]interface{}{{"name": "legacy-endpoint"}},
	})
	if err != nil {
		t.Fatal(err)
	}
	secret, err := createHash("legacy password")
	if err != nil {
		t.Fatal(err)
	}
	legacy, err := crypto.EncryptToken(secret, string(payloadBytes))
	if err != nil {
		t.Fatal(err)
	}

	decrypted, err := decryptPayload(legacy, "legacy password")
	if err != nil {
		t.Fatalf("decryptPayload failed on legacy format: %v", err)
	}
	if !strings.Contains(*decrypted, "legacy-endpoint") {
		t.Fatalf("decrypted legacy payload missing content: %s", *decrypted)
	}
}
