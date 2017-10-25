package datastore

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	log "github.com/Sirupsen/logrus"
)

const (
	SERVICES_ENV = "VCAP_SERVICES"
	STRATOS_TAG  = "stratos"
	URI_POSTGRES = "postgres://"
	URI_MYSQL    = "mysql://"
	TAG_MYSQL    = "mysql"
	TAG_POSTGRES = "postgresql"
	DB_URI       = "uri"
)

type VCAPService struct {
	Credentials map[string]interface{} `json:"credentials"`
	Tags        []string               `json:"tags"`
	Name        string                 `json:"name"`
}

// Discover cf db services via their 'uri' env var and apply settings to the DatabaseConfig objects
func ParseCFEnvs(db *DatabaseConfig) bool {
	if config.IsSet(SERVICES_ENV) == false {
		return false
	}

	// Extract struts from VCAP_SERVICES env
	vcapServicesStr := config.GetString(SERVICES_ENV)
	var vcapServices map[string][]VCAPService
	err := json.Unmarshal([]byte(vcapServicesStr), &vcapServices)
	if err != nil {
		log.Warnf("Unable to convert %s env var into JSON. Error: %s", SERVICES_ENV, err)
		return false
	}

	return findDatabaseConfig(vcapServices, db)
}

func findDatabaseConfig(vcapServices map[string][]VCAPService, db *DatabaseConfig) bool {
	var service VCAPService
	configs := findDatabaseConfigurations(vcapServices)
	log.Infof("Found %d database service instances", len(configs))
	for _, s := range configs {
		// If only 1 db service, then use it
		if len(configs) == 1 {
			service = s
			log.Infof("Using first database service instance: %s", service.Name)
		} else {
			// Use it if it has our service tag
			if stringInSlice(STRATOS_TAG, s.Tags) {
				service = s
				log.Infof("Using tagged database service instance: %s", service.Name)
			}
		}
	}

	// If we found a service, then use it
	if len(service.Name) > 0 {
		if isPostgresService(service) {
			dbCredentials := service.Credentials
			db.DatabaseProvider = "pgsql"
			db.Username = fmt.Sprintf("%v", dbCredentials["username"])
			db.Password = fmt.Sprintf("%v", dbCredentials["password"])
			db.Database = fmt.Sprintf("%v", dbCredentials["dbname"])
			db.Host = fmt.Sprintf("%v", dbCredentials["hostname"])
			db.Port, _ = strconv.Atoi(fmt.Sprintf("%v", dbCredentials["port"]))
			db.SSLMode = "disable"
			log.Infof("Discovered Cloud Foundry postgres service and applied config")
			return true
		} else if isMySQLService(service) {
			dbCredentials := service.Credentials
			db.DatabaseProvider = "mysql"
			db.Username = fmt.Sprintf("%v", dbCredentials["username"])
			db.Password = fmt.Sprintf("%v", dbCredentials["password"])
			db.Database = fmt.Sprintf("%v", dbCredentials["name"])
			db.Host = fmt.Sprintf("%v", dbCredentials["hostname"])
			db.Port = (int)(dbCredentials["port"].(float64))
			db.SSLMode = "disable"
			log.Infof("Discovered Cloud Foundry mysql service and applied config")
			return true
		}
	}

	return false
}

func findDatabaseConfigurations(vcapServices map[string][]VCAPService) map[string]VCAPService {
	var configs map[string]VCAPService
	configs = make(map[string]VCAPService)

	for _, services := range vcapServices {
		for _, service := range services {
			// Need a valid URI
			if isPostgresService(service) || isMySQLService(service) {
				configs[service.Name] = service
			}
		}
	}

	return configs
}

func isPostgresService(service VCAPService) bool {
	uri := fmt.Sprintf("%v", service.Credentials[DB_URI])
	return strings.HasPrefix(uri, URI_POSTGRES) || stringInSlice(TAG_POSTGRES, service.Tags)
}

func isMySQLService(service VCAPService) bool {
	uri := fmt.Sprintf("%v", service.Credentials[DB_URI])
	return strings.HasPrefix(uri, URI_MYSQL) || stringInSlice(TAG_MYSQL, service.Tags)
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}
