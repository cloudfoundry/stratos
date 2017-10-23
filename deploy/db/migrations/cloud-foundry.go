package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
)

const (
	VCAP_SERVICES     = "VCAP_SERVICES"
	NAME              = "name"
	TAGS              = "tags"
	STRATOS_TAG       = "stratos"
	CREDENTIALS       = "credentials"
	HOSTNAME          = "hostname"
	PORT              = "port"
	USERNAME          = "username"
	PASSWORD          = "password"
	DBNAME            = "dbname"
	DATABASE_PROVIDER = "DATABASE_PROVIDER"
	DB_TYPE           = "DB_TYPE"
	DB_HOST           = "DB_HOST"
	DB_PORT           = "DB_PORT"
	DB_USER           = "DB_USER"
	DB_PASSWORD       = "DB_PASSWORD"
	DB_DATABASE_NAME  = "DB_DATABASE_NAME"
	PROVIDER_POSTGRES = "pgsql"
	TYPE_POSTGRES     = "postgresql"
	PROVIDER_MYSQL    = "mysql"
	TYPE_MYSQL        = "mysql"
	DB_URI            = "uri"
	URI_POSTGRES      = "postgres://"
	URI_MYSQL         = "mysql://"
)

type VCAPService struct {
	Credentials map[string]interface{} `json:"credentials"`
	Tags        []string               `json:"tags"`
	Name        string                 `json:"name"`
}

func parseCloudFoundryEnv() (string, error) {
	var dbEnv string

	fmt.Println("Attempting to parse VCAP_SERVICES")

	// Try and get the services environment variable
	services, ok := os.LookupEnv(VCAP_SERVICES)

	if ok {
		var vcapServices map[string][]VCAPService
		// Try and parse it as JSON
		err := json.Unmarshal([]byte(services), &vcapServices)
		if err == nil {
			findDatabaseConfig(vcapServices)
			switch dbType := os.Getenv(DB_TYPE); dbType {
			case TYPE_POSTGRES:
				dbEnv = "cf_postgres"
				fmt.Printf("Migrating postgresql instance on %s\n", os.Getenv(DB_HOST))
			case TYPE_MYSQL:
				dbEnv = "cf_mysql"
				fmt.Printf("Migrating mysql instance on %s\n", os.Getenv(DB_HOST))
			default:
				return "", errors.New("Database service not found or type not recognized")
			}
		} else {
			return "", err
		}
	}

	return dbEnv, nil
}

func findDatabaseConfig(vcapServices map[string][]VCAPService) {
	var service VCAPService
	configs := findDatabaseConfigurations(vcapServices)
	fmt.Printf("Found %d database service instances\n", len(configs))
	for _, s := range configs {
		// If only 1 db service, then use it
		if len(configs) == 1 {
			service = s
			fmt.Printf("Using first database service instance: %s\n", service.Name)
		} else {
			// Use it if it has our service tag
			if stringInSlice(STRATOS_TAG, s.Tags) {
				service = s
				fmt.Printf("Using tagged database service instance: %s\n", service.Name)
			}
		}
	}

	// If we found a service, then use if
	if len(service.Name) > 0 {
		uri := fmt.Sprintf("%v", service.Credentials[DB_URI])
		if strings.HasPrefix(uri, URI_POSTGRES) {
			fmt.Println("Parsing Postgres db config")

			exportString(DATABASE_PROVIDER, PROVIDER_POSTGRES)
			exportString(DB_TYPE, TYPE_POSTGRES)
			exportString(DB_HOST, service.Credentials[HOSTNAME])
			exportString(DB_PORT, service.Credentials[PORT])
			exportString(DB_USER, service.Credentials[USERNAME])
			exportString(DB_PASSWORD, service.Credentials[PASSWORD])
			exportString(DB_DATABASE_NAME, service.Credentials[DBNAME])
		} else if strings.HasPrefix(uri, URI_MYSQL) {
			fmt.Println("Parsing MySQL db config")

			exportString(DATABASE_PROVIDER, PROVIDER_MYSQL)
			exportString(DB_TYPE, TYPE_MYSQL)
			exportString(DB_HOST, service.Credentials[HOSTNAME])
			exportString(DB_PORT, service.Credentials[PORT])
			exportString(DB_USER, service.Credentials[USERNAME])
			exportString(DB_PASSWORD, service.Credentials[PASSWORD])
			exportString(DB_DATABASE_NAME, service.Credentials[NAME])
		}
	}
}

// Try and find the first service config that has the DB tag
func findFirstTaggedConfiguration(configs map[string]VCAPService) (VCAPService, bool) {
	for _, service := range configs {
		if stringInSlice(STRATOS_TAG, service.Tags) {
			return service, true
		}
	}
	return VCAPService{}, false
}

func findDatabaseConfigurations(vcapServices map[string][]VCAPService) map[string]VCAPService {
	var configs map[string]VCAPService
	configs = make(map[string]VCAPService)

	for _, services := range vcapServices {
		for _, service := range services {
			// Need a valid URI
			uri := fmt.Sprintf("%v", service.Credentials[DB_URI])
			valid := strings.HasPrefix(uri, URI_POSTGRES) || strings.HasPrefix(uri, URI_MYSQL)
			if valid {
				configs[service.Name] = service
			}
		}
	}

	return configs
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func exportString(name string, value interface{}) {
	os.Setenv(name, fmt.Sprintf("%v", value))
}
