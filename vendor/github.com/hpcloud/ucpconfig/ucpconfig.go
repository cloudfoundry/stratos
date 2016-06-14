// Package ucpconfig allows a struct-loading approach to ucp configurations.
package ucpconfig

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
)

const secretsDir = "/etc/secrets"

// Load the given pointer to struct with values from the environment and the
// /etc/secrets/ directory according to the UCP spec.
//
// In order to make the struct load correctly, use struct tags to define the
// ucp-related configuration name, if the ucp struct tag is ommitted it will
// not attempt to look anything up. This is contrary to most serialization
// libraries like JSON which require a "-" struct tag to bypass deserialization.
//
//   type A struct {
//     Port   uint    `ucp:"PORT"`
//     Name   string  `ucp:"SERVICE_NAME"`
//     Struct *myType
//   }
//
// The name will be given as defined to Getenv, and if that fails a lookup
// it's name is then munged to conform to the /etc/secrets filename structure
// and the file is attempted to be read.
func Load(intf interface{}) error {
	value := reflect.ValueOf(intf)

	if value.Kind() != reflect.Ptr {
		return errors.New("ucpconfig: must provide pointer to struct value")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("ucpconfig: must provide pointer to struct value")
	}

	nFields := value.NumField()
	typ := value.Type()

	for i := 0; i < nFields; i++ {
		field := value.Field(i)
		strField := typ.Field(i)
		tag := strField.Tag.Get("ucp")
		if tag == "" {
			continue
		}

		if err := setFieldValue(value, field, tag); err != nil {
			return err
		}
	}

	return nil
}

func setFieldValue(value reflect.Value, field reflect.Value, tag string) error {
	val, err := getValue(tag)
	if err != nil && !isNotFoundErr(err) {
		return err
	}

	if len(val) == 0 {
		return nil
	}

	var newVal interface{}
	typ := field.Type()
	kind := typ.Kind()

	switch kind {
	case reflect.Int:
		var i int
		i, err = strconv.Atoi(val)
		newVal = i
	case reflect.Int64:
		var i int64
		i, err = strconv.ParseInt(val, 10, 64)
		newVal = i
	case reflect.Uint:
		var i uint64
		i, err = strconv.ParseUint(val, 10, int(typ.Size())*32)
		newVal = uint(i)
	case reflect.Uint64:
		var i uint64
		i, err = strconv.ParseUint(val, 10, 64)
		newVal = i
	case reflect.Float64:
		var i float64
		i, err = strconv.ParseFloat(val, 64)
		newVal = i
	case reflect.Slice:
		sliceTyp := typ.Elem()
		if sliceTyp.Kind() != reflect.String {
			return fmt.Errorf("failed to decode value: unsupported slice type %q, only []string supported", kind.String())
		}
		newVal = strings.Split(val, ",")
	case reflect.Bool:
		var b bool
		b, err = strconv.ParseBool(val)
		newVal = b
	case reflect.String:
		newVal = val
	default:
		return fmt.Errorf("failed to decode value: unsupported type %q", kind.String())
	}

	if err != nil {
		return fmt.Errorf("failed to decode value %q to %q: %v", val, kind.String(), err)
	}

	field.Set(reflect.ValueOf(newVal))
	return nil
}

// getValue tries to look up an env var of the given name and then
// tries to look up the secret file of the same
func getValue(name string) (string, error) {
	env := os.Getenv(name)
	if len(env) == 0 {
		return readSecretFileTestHarness(name)
	}

	return env, nil
}

var readSecretFileTestHarness = readSecretFile

// readSecretFile reads a variable in the form HELLO_THERE from a file
// in /etc/secrets/hello-there
func readSecretFile(name string) (string, error) {
	name = strings.ToLower(strings.Replace(name, "_", "-", -1))
	filename := filepath.Join(secretsDir, name)

	contents, err := ioutil.ReadFile(filename)
	if os.IsNotExist(err) {
		return "", notFoundErr(filename)
	} else if err != nil {
		return "", fmt.Errorf("failed to read secret file %q: %v", name, err)
	}

	return strings.TrimSpace(string(contents)), nil
}

type notFoundErr string

func isNotFoundErr(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(notFoundErr)
	return ok
}

func (n notFoundErr) Error() string {
	return fmt.Sprintf("could not find secret file: %s", string(n))
}
