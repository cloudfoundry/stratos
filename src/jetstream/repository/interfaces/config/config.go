// Package config allows a struct-loading approach to configuration.
// This is a modified version of the ucpconfig package
package config

import (
	"bufio"
	"errors"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"

	"github.com/govau/cf-common/env"
	log "github.com/sirupsen/logrus"
)

const secretsDir = "/etc/secrets"

// APIKeysConfigValue - special type for configuring whether API keys feature is enabled
type APIKeysConfigValue string

// APIKeysConfigEnum - defines possible configuration values for Stratos API keys feature
var APIKeysConfigEnum = struct {
	Disabled  APIKeysConfigValue
	AdminOnly APIKeysConfigValue
	AllUsers  APIKeysConfigValue
}{
	Disabled:  "disabled",
	AdminOnly: "admin_only",
	AllUsers:  "all_users",
}

// verifies that given string is a valid config value (i.e., present in APIKeysConfigEnum)
func parseAPIKeysConfigValue(input string) (APIKeysConfigValue, error) {
	t := reflect.TypeOf(APIKeysConfigEnum)
	v := reflect.ValueOf(APIKeysConfigEnum)

	var allowedValues []string

	for i := 0; i < t.NumField(); i++ {
		allowedValue := string(v.Field(i).Interface().(APIKeysConfigValue))
		if allowedValue == input {
			return APIKeysConfigValue(input), nil
		}

		allowedValues = append(allowedValues, allowedValue)
	}

	return "", fmt.Errorf("Invalid value %q, allowed values: %q", input, allowedValues)
}

// UserEndpointsConfigValue - special type for configuring whether user endpoints feature is enabled
type UserEndpointsConfigValue string

// UserEndpointsConfigEnum - defines possible configuration values for Stratos user endpoints feature
var UserEndpointsConfigEnum = struct {
	Disabled  UserEndpointsConfigValue
	AdminOnly UserEndpointsConfigValue
	Enabled   UserEndpointsConfigValue
}{
	Disabled:  "disabled",
	AdminOnly: "admin_only",
	Enabled:   "enabled",
}

// verifies that given string is a valid config value
func parseUserEndpointsConfigValue(input string) (UserEndpointsConfigValue, error) {
	t := reflect.TypeOf(UserEndpointsConfigEnum)
	v := reflect.ValueOf(UserEndpointsConfigEnum)

	var allowedValues []string

	for i := 0; i < t.NumField(); i++ {
		allowedValue := string(v.Field(i).Interface().(UserEndpointsConfigValue))
		if allowedValue == input {
			return UserEndpointsConfigValue(input), nil
		}

		allowedValues = append(allowedValues, allowedValue)
	}

	return "", fmt.Errorf("Invalid value %q, allowed values: %q", input, allowedValues)
}

var urlType *url.URL

// Load the given pointer to struct with values from the environment and the
// /etc/secrets/ directory.
//
// In order to make the struct load correctly, use struct tags to define the
// configuration name, if the configName struct tag is ommitted it will
// not attempt to look anything up. This is contrary to most serialization
// libraries like JSON which require a "-" struct tag to bypass deserialization.
//
//   type A struct {
//     Port   uint    `configName:"PORT"`
//     Name   string  `configName:"SERVICE_NAME"`
//     Struct *myType
//   }
//
// The name will be given as defined to Getenv, and if that fails a lookup
// it's name is then munged to conform to the /etc/secrets filename structure
// and the file is attempted to be read.
func Load(intf interface{}, envLookup env.Lookup) error {
	value := reflect.ValueOf(intf)

	if value.Kind() != reflect.Ptr {
		return errors.New("config: must provide pointer to struct value")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("config: must provide pointer to struct value")
	}

	nFields := value.NumField()
	typ := value.Type()

	for i := 0; i < nFields; i++ {
		field := value.Field(i)
		strField := typ.Field(i)
		tag := strField.Tag.Get("configName")
		if tag == "" {
			continue
		}

		if err := setFieldValue(value, field, tag, envLookup); err != nil {
			return err
		}
	}

	return nil
}

func setFieldValue(value reflect.Value, field reflect.Value, tags string, envLookup env.Lookup) error {
	// Allow multiple values, separated by ',' to allow fallbacks
	tagList := strings.Split(tags, ",")
	for _, tag := range tagList {
		val, ok := envLookup(strings.TrimSpace(tag))
		if ok {
			return SetStructFieldValue(value, field, val)
		}
	}

	return nil
}

func SetStructFieldValue(value reflect.Value, field reflect.Value, val string) error {

	var newVal interface{}
	var err error
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
		apiKeysConfigType := reflect.TypeOf((*APIKeysConfigValue)(nil)).Elem()
		userEndpointsConfigType := reflect.TypeOf((*UserEndpointsConfigValue)(nil)).Elem()
		if typ == apiKeysConfigType {
			newVal, err = parseAPIKeysConfigValue(val)
		} else if typ == userEndpointsConfigType {
			newVal, err = parseUserEndpointsConfigValue(val)
		} else {
			newVal = val
		}
	default:
		if typ == reflect.TypeOf(urlType) {
			newVal, err = url.Parse(val)
		} else {
			return fmt.Errorf("failed to decode value: unsupported type %q", kind.String())
		}
	}

	if err != nil {
		return fmt.Errorf("failed to decode value %q to %q: %v", val, kind.String(), err)
	}

	field.Set(reflect.ValueOf(newVal))
	return nil
}

// NewSecretsDirLookup - create a secret dir lookup
// reads a variable in the form HELLO_THERE from a file
// in /etc/secrets/hello-there
func NewSecretsDirLookup(secretsDir string) env.Lookup {
	return func(name string) (string, bool) {
		name = strings.ToLower(strings.Replace(name, "_", "-", -1))
		filename := filepath.Join(secretsDir, name)

		if _, err := os.Stat(filename); err == nil {
			contents, err := ioutil.ReadFile(filename)
			if err != nil {
				log.Warnf("Error reading secrets file: %s, %s", filename, err)
				return "", false
			}
			return strings.TrimSpace(string(contents)), true
		}
		// File does not exist
		return "", false
	}
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

// NewConfigFileLookup - Load the configuration values in the specified config file if it exists
func NewConfigFileLookup(path string) env.Lookup {

	// Check if the config file exists
	if _, err := os.Stat(path); err != nil {
		return env.NoopLookup
	}

	file, err := os.Open(path)
	if err != nil {
		log.Warn("Error reading configuration file, ignoring this file: ", err)
		return env.NoopLookup
	}
	defer file.Close()

	loadedConfig := make(map[string]string)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		line = strings.TrimSpace(line)
		if strings.Index(line, "#") != 0 {
			// Not a comment
			keyValue := strings.SplitN(line, "=", 2)
			if len(keyValue) == 2 {
				loadedConfig[keyValue[0]] = keyValue[1]
			}
		}
	}

	if scanner.Err() != nil {
		// Error reading configuration file, ignoring this file
		return env.NoopLookup
	}

	log.Debugf("Loaded configuration from file: %s", path)

	return func(k string) (string, bool) {
		v, ok := loadedConfig[k]
		return v, ok
	}
}
