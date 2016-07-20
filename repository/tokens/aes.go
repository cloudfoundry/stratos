package tokens

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
	"log"
)

// This file is based on the following direction on how to AES encrypt/decrypt
// our secret information, in this case tokens (normal, refresh and OAuth tokens).
// Source: https://github.com/giorgisio/examples/blob/master/aes-encrypt/main.go

// Encrypt - <TBD>
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

// Decrypt - <TBD>
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
