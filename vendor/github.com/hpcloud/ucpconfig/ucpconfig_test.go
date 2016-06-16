package ucpconfig

import (
	"flag"
	"os"
	"reflect"
	"strings"
	"testing"
)

var testFlagSecretFile = flag.Bool("test.readsecrets", false, "Attempt to read a secret file called /etc/secrets/hello-world")

func setup(env map[string]string) {
	readSecretFileTestHarness = func(string) (string, error) {
		return "", os.ErrNotExist
	}

	// Set up environment
	for k, v := range env {
		if err := os.Setenv(k, v); err != nil {
			panic(err)
		}
	}
}

func teardown(env map[string]string) {
	readSecretFileTestHarness = readSecretFile

	// Restore environment
	for k := range env {
		if err := os.Setenv(k, ""); err != nil {
			panic(err)
		}
	}
}

func TestLoad(t *testing.T) {
	vars := map[string]string{
		"INT":          "-4222",
		"INT_64":       "-9223372036854775808",
		"UINT":         "4222",
		"UINT_64":      "18446744073709551615",
		"FLOAT_64":     "1.44445",
		"BOOL_1":       "true",
		"BOOL_2":       "false",
		"STRING_VAR":   "a s\ttr\ning",
		"STRING_SLICE": "a str , but separated,by",
	}

	setup(vars)
	defer teardown(vars)

	A := struct {
		Int     int      `ucp:"INT"`
		Int64   int64    `ucp:"INT_64"`
		Uint    uint     `ucp:"UINT"`
		Uint64  uint64   `ucp:"UINT_64"`
		Float64 float64  `ucp:"FLOAT_64"`
		Bool1   bool     `ucp:"BOOL_1"`
		Bool2   bool     `ucp:"BOOL_2"`
		String  string   `ucp:"STRING_VAR"`
		Slice   []string `ucp:"STRING_SLICE"`
		Ignored string
	}{}

	err := Load(&A)
	if err != nil {
		t.Error(err)
	}

	if A.Int != -4222 {
		t.Error("Int was wrong:", A.Int)
	}
	if A.Int64 != -9223372036854775808 {
		t.Error("Int64 was wrong:", A.Int64)
	}
	if A.Uint != 4222 {
		t.Error("Uint was wrong:", A.Uint)
	}
	if A.Uint64 != 18446744073709551615 {
		t.Error("Uint64 was wrong:", A.Uint64)
	}
	if A.Float64 != 1.44445 {
		t.Error("Float64 was wrong:", A.Float64)
	}
	if A.Bool1 != true {
		t.Error("Bool1 was wrong:", A.Bool1)
	}
	if A.Bool2 != false {
		t.Error("Bool2 was wrong:", A.Bool2)
	}
	if A.String != "a s\ttr\ning" {
		t.Error("String was wrong:", A.String)
	}
	if !reflect.DeepEqual([]string{"a str ", " but separated", "by"}, A.Slice) {
		t.Errorf("Slice was wrong: %#v", A.Slice)
	}
	if A.Ignored != "" {
		t.Error("Ignored was not ignored properly:", A.Ignored)
	}
}

func TestLoadFailures(t *testing.T) {
	env := map[string]string{"KEYNAME": "value,ofthings"}
	setup(env)
	defer teardown(env)

	var A = struct {
		IntFail int `ucp:"KEYNAME"`
	}{}
	var B = struct {
		BadType float32 `ucp:"KEYNAME"`
	}{}
	var C = struct {
		SliceBadType []int `ucp:"KEYNAME"`
	}{}

	var err error
	if err = Load(&A); !strings.Contains(err.Error(), `"value,ofthings" to "int": strconv.ParseInt:`) {
		t.Error("err was wrong:", err)
	}
	if err = Load(&B); !strings.Contains(err.Error(), "unsupported type") {
		t.Error("err was wrong:", err)
	}
	if err = Load(&C); !strings.Contains(err.Error(), "unsupported slice type") {
		t.Error("err was wrong:", err)
	}
}

// TestReadSecretFile requires there to be a file in /etc/secrets/hello-world
// that can be read by the user running these tests.
func TestReadSecretFile(t *testing.T) {
	if !*testFlagSecretFile {
		t.Skip("Use -test.readsecrets to enable secret test")
	}

	val, err := readSecretFile("HELLO_WORLD")
	if err != nil {
		t.Error(err)
	}

	if val != "config_value" {
		t.Error("config value was wrong:", val)
	}

	_, err = readSecretFile("NON_EXISTENT")
	if !isNotFoundErr(err) {
		t.Errorf("wanted a not found err: %T, %v", err, err)
	}
}
