package crypto

import (
	"crypto/rand"
	"fmt"

	log "github.com/sirupsen/logrus"

	"golang.org/x/crypto/bcrypt"
)

// See: https://github.com/gorilla/csrf/blob/a8abe8abf66db8f4a9750d76ba95b4021a354757/helpers.go
// generateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random number generator fails to function correctly.
func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	// err == nil only if len(b) == n
	if err != nil {
		return nil, err
	}

	return b, nil

}

// HashPassword accepts a plaintext password string and generates a salted hash
func HashPassword(password string) ([]byte, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return bytes, err
}

// CheckPasswordHash accepts a bcrypt salted hash and plaintext password.
// It verifies the password against the salted hash
func CheckPasswordHash(password string, hash []byte) error {
	err := bcrypt.CompareHashAndPassword(hash, []byte(password))
	return err
}

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
	log.Debug("encryptToken")
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
	log.Debug("decryptToken")
	plaintextToken, err := Decrypt(key, t)
	if err != nil {
		msg := "Unable to decrypt token: %v"
		log.Printf(msg, err)
		return "", fmt.Errorf(msg, err)
	}

	return string(plaintextToken), nil
}
