package tokens

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
)

// EncryptionKeyName - the filename of the encryption key
const EncryptionKeyName = "aes-key"

// Encrypt - Encrypt a token based on an encryption key
// The approach used here is based on the following direction on how to AES
// encrypt/decrypt our secret information, in this case tokens (normal, refresh
// and OAuth tokens).
// Source: https://github.com/giorgisio/examples/blob/master/aes-encrypt/main.go
func Encrypt(key, text []byte) (ciphertext []byte, err error) {
	log.Println("Encrypt")
	var block cipher.Block

	if block, err = aes.NewCipher(key); err != nil {
		return nil, err
	}

	ciphertext = make([]byte, aes.BlockSize+len(string(text)))

	// iv =  initialization vector
	iv := ciphertext[:aes.BlockSize]
	if _, err = io.ReadFull(rand.Reader, iv); err != nil {
		return
	}

	cfb := cipher.NewCFBEncrypter(block, iv)
	cfb.XORKeyStream(ciphertext[aes.BlockSize:], text)

	return
}

// Decrypt - Decrypt a token based on an encryption key
// The approach used here is based on the following direction on how to AES
// encrypt/decrypt our secret information, in this case tokens (normal, refresh
// and OAuth tokens).
// Source: https://github.com/giorgisio/examples/blob/master/aes-encrypt/main.go
func Decrypt(key, ciphertext []byte) (plaintext []byte, err error) {
	log.Println("Decrypt")

	var block cipher.Block

	if block, err = aes.NewCipher(key); err != nil {
		return
	}

	if len(ciphertext) < aes.BlockSize {
		err = errors.New("ciphertext too short")
		return
	}

	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	cfb := cipher.NewCFBDecrypter(block, iv)
	cfb.XORKeyStream(ciphertext, ciphertext)

	plaintext = ciphertext

	return
}

// CreateKey - Create an AES encryption key
func CreateKey() ([]byte, error) {
	log.Println("CreateKey")
	key := make([]byte, 32)
	_, err := rand.Read(key)

	if err != nil {
		return nil, err
	}
	return key, nil
}

// ReadKey - Read the encryption key from the shared volume
func ReadKey(v string) ([]byte, error) {
	log.Println("ReadKey")
	f := fmt.Sprintf("%s/%s", v, EncryptionKeyName)
	key, err := ioutil.ReadFile(f)
	if err != nil {
		return nil, err
	}

	return key, nil
}

// WriteKey - Write the encryption key to the shared volume
func WriteKey(v string, key []byte) error {
	log.Println("WriteKey")
	f := fmt.Sprintf("%s/%s", v, EncryptionKeyName)
	err := ioutil.WriteFile(f, key, 0777)
	if err != nil {
		return err
	}
	return nil
}
