package crypto

import (
	"encoding/hex"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

var (
	FakeVolumeName    string
	FakeKeyName       = "fake-key-name"
	FakeKeyValue      = `B374A26A71490437AA024E4FADD5B497FDFF1A8EA6FF12F6FB65AF2720B59CCF`
	FakeKey           = []byte(FakeKeyValue)
	FakeEncryptionKey = make([]byte, 32)
)

func TestAESEncryptDecrypt(t *testing.T) {

	Convey("Given an encryption key and a string that requires encryption", t, func() {

		var (
			mockText          = []byte(`abcdefghijklmnopqrstuvwxyz0123456789`)
			mockEncryptionKey = make([]byte, 32)
		)

		Convey("encrypting & decrypting the string it should succeed", func() {
			ciphertext, _ := Encrypt(mockEncryptionKey, mockText)
			plaintext, _ := Decrypt(mockEncryptionKey, ciphertext)
			So(plaintext, ShouldResemble, mockText)
		})
	})

	Convey("Given the need to read an encryption key from a volume", t, func() {

		if err := writeFakeEncryptionKey(); err != nil {
			log.Fatal(err)
		}

		Convey("if successfully read", func() {
			result, _ := ReadEncryptionKey(FakeVolumeName, FakeKeyName)
			So(strings.ToUpper(hex.EncodeToString(result)), ShouldResemble, FakeKeyValue)
		})

		Convey("if not successfully read", func() {

		})

		Reset(func() {
			os.RemoveAll(FakeVolumeName)
		})

	})

	Convey("TestEncryptToken", t, func() {

		Convey("should fail with an invalid key", func() {
			_, err := EncryptToken(nil, FakeKeyValue)
			So(err, ShouldNotBeNil)
		})

		Convey("should succeed", func() {
			b, err := EncryptToken(FakeEncryptionKey, FakeKeyValue)
			So(err, ShouldBeNil)
			So(b, ShouldNotBeNil)

		})
	})

	Convey("TestDecryptToken", t, func() {

		Convey("should fail with an invalid key", func() {
			_, err := DecryptToken(nil, nil)
			So(err, ShouldNotBeNil)
		})

		Convey("should succeed", func() {
			b, err := DecryptToken(FakeEncryptionKey, FakeEncryptionKey)
			So(err, ShouldBeNil)
			So(b, ShouldNotBeNil)
		})
	})
}

func writeFakeEncryptionKey() error {

	var err error

	// create a temporary volume
	FakeVolumeName, err = ioutil.TempDir("", "fake-volume")
	if err != nil {
		return err
	}

	key := filepath.Join(FakeVolumeName, FakeKeyName)
	if err = ioutil.WriteFile(key, FakeKey, 0666); err != nil {
		return err
	}

	return nil
}
