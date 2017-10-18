package main

import (
	"encoding/json"
	"fmt"
	"os"
)

const (
	VCAP_SERVICES        = "VCAP_SERVICES"
	NAME                 = "name"
	TAGS                 = "tags"
	STRATOS_POSTGRES_TAG = "stratos_postgresql"
	STRATOS_MYSQL_TAG    = "stratos_mysql"
	CREDENTIALS          = "credentials"
	HOSTNAME             = "hostname"
	PORT                 = "port"
	USERNAME             = "username"
	PASSWORD             = "password"
	DBNAME               = "dbname"
	DATABASE_PROVIDER    = "DATABASE_PROVIDER"
	DB_TYPE              = "DB_TYPE"
	DB_HOST              = "DB_HOST"
	DB_PORT              = "DB_PORT"
	DB_USER              = "DB_USER"
	DB_PASSWORD          = "DB_PASSWORD"
	DB_DATABASE_NAME     = "DB_DATABASE_NAME"
	PROVIDER_POSTGRES    = "pgsql"
	TYPE_POSTGRES        = "postgresql"
	PROVIDER_MYSQL       = "mysql"
	TYPE_MYSQL           = "mysql"
)

type VCAPService struct {
	Credentials map[string]interface{} `json:"credentials"`
	Tags        []string               `json:"tags"`
}

func main() {

	fmt.Println("# VCAP_SERVICES Parsing")

	// Try and get the services environment variable
	services, ok := os.LookupEnv(VCAP_SERVICES)

	if ok {
		var vcapServices map[string][]VCAPService

		// Try and parse it as JSON
		err := json.Unmarshal([]byte(services), &vcapServices)
		if err == nil {
			findDatabaseConfig(vcapServices)
		} else {
			fmt.Println("#", err)
		}
	}

	fmt.Println("")
}

func findDatabaseConfig(vcapServices map[string][]VCAPService) {
	for _, services := range vcapServices {
		for _, service := range services {
			if stringInSlice(STRATOS_POSTGRES_TAG, service.Tags) {
				fmt.Println("# Postgres db config")

				exportString(DATABASE_PROVIDER, PROVIDER_POSTGRES)
				exportString(DB_TYPE, TYPE_POSTGRES)
				exportString(DB_HOST, service.Credentials[HOSTNAME])
				exportString(DB_PORT, service.Credentials[PORT])
				exportString(DB_USER, service.Credentials[USERNAME])
				exportString(DB_PASSWORD, service.Credentials[PASSWORD])
				exportString(DB_DATABASE_NAME, service.Credentials[DBNAME])
			} else if stringInSlice(STRATOS_MYSQL_TAG, service.Tags) {
				fmt.Println("# MySQL db config")

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
	fmt.Printf("\nexport %s=\"%v\"", name, value)
}
