package crypto

import (
	"fmt"
	"log"
)

// Note:
// When it's time to store the encrypted token in PostgreSQL, it's gets a bit
// hairy. The encrypted token is binary data, not really text data, which
// typically has a character set, unlike binary data. Generally speaking, it
// comes down to one of two choices: store it in a bytea column, and deal with
// some funkiness; or store it in a text column and make sure to base64 encode
// it going in and decode it coming out.
// https://wiki.postgresql.org/wiki/BinaryFilesInDB
// http://engineering.pivotal.io/post/ByteA_versus_TEXT_in_PostgreSQL/
// I chose option 1.

// EncryptToken - Encrypt a token being
func EncryptToken(key []byte, t string) ([]byte, error) {
	log.Println("encryptToken")
	var plaintextToken = []byte(t)
	ciphertextToken, err := Encrypt(key, plaintextToken)
	if err != nil {
		msg := "Unable to encrypt token: %v"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return ciphertextToken, nil
}

// DecryptToken - Decrypt a token
func DecryptToken(key, t []byte) (string, error) {
	log.Println("decryptToken")
	plaintextToken, err := Decrypt(key, t)
	if err != nil {
		msg := "Unable to decrypt token: %v"
		log.Printf(msg, err)
		return "", fmt.Errorf(msg, err)
	}

	return string(plaintextToken), nil
}
