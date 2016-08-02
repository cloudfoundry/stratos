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

// ReadKey - Read the encryption key from the shared volume
func ReadKey(v, f string) ([]byte, error) {
	log.Println("ReadKey")

	fname := fmt.Sprintf("/%s/%s", v, f)
	log.Printf("Filename: %s", fname)
	key, err := ioutil.ReadFile(fname)
	if err != nil {
		log.Printf("Unable to read encryption key file: %+v\n", err)
		return nil, err
	}

	return key, nil
}
