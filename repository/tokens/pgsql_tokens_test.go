package tokens

import "testing"

func TestTokenEncryptAndDecrypt(t *testing.T) {
	t.Parallel()

	var (
		key   []byte
		token string
	)

	key = []byte("THISISTHEKEYUSEDTODOENCRYPTIONYA")
	token = "My daughter thinks HAMILTON is THE BOMB !!!"

	encryptedToken, err := EncryptToken(key, token)
	if err != nil {
		t.Errorf("Error thrown encrypting token %v", err)
	}

	decryptedToken, err := decryptToken(key, encryptedToken)
	if err != nil {
		t.Errorf("Error thrown decrypting token %v", err)
	}

	if decryptedToken != token {
		t.Errorf("No match - something is wrong.")
	}
}
