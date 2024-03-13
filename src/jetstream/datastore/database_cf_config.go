package datastore

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/govau/cf-common/env"
	log "github.com/sirupsen/logrus"
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
func ParseCFEnvs(db *DatabaseConfig, env *env.VarSet) (bool, error) {
	if !env.IsSet(SERVICES_ENV) {
		return false, nil
	}

	// Extract struts from VCAP_SERVICES env
	vcapServicesStr := env.MustString(SERVICES_ENV)
	var vcapServices map[string][]VCAPService
	err := json.Unmarshal([]byte(vcapServicesStr), &vcapServices)
	if err != nil {
		log.Warnf("Unable to convert %s env var into JSON. Error: %s", SERVICES_ENV, err)
		return false, nil
	}

	if len(vcapServices) == 0 {
		log.Info("No DB configurations defined, will use SQLite")
		return false, nil
	}
	return findDatabaseConfig(vcapServices, db, env), nil
}

func findDatabaseConfig(vcapServices map[string][]VCAPService, db *DatabaseConfig, env *env.VarSet) bool {
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
		dbCredentials := service.Credentials

		log.Infof("Attempting to apply Cloud Foundry database service config from VCAP_SERVICES credentials")

		// 1) Check db config in credentials
		db.Username = getDBCredentialsValue(dbCredentials["username"])
		db.Password = getDBCredentialsValue(dbCredentials["password"])
		db.Host = getDBCredentialsValue(dbCredentials["hostname"])
		db.SSLMode = env.String("DB_SSL_MODE", "disable")
		db.Port, _ = strconv.Atoi(getDBCredentialsValue(dbCredentials["port"]))
		// Note - Both isPostgresService and isMySQLService look at the credentials uri & tags
		if isPostgresService(service) {
			db.DatabaseProvider = "pgsql"
			db.Database = getDBCredentialsValue(dbCredentials["dbname"])
		} else if isMySQLService(service) {
			db.DatabaseProvider = "mysql"
			db.Database = getDBCredentialsValue(dbCredentials["name"])
		} else {
			log.Infof("Cloud Foundry database service contains unsupported db type")
			return false
		}
		err := validateRequiredDatabaseParams(db.Username, db.Password, db.Database, db.Host, db.Port)

		if err != nil {
			// 2) Check for db config in credentials uri
			log.Infof("Failed to find required Cloud Foundry database service config, falling back on credential's `%v`\n%v", DB_URI, err)
			uri := getDBCredentialsValue(dbCredentials[DB_URI])
			if len(uri) == 0 {
				log.Warnf("Failed to find Cloud Foundry service credential's `%v`", DB_URI)
				return false
			}

			db.Username, db.Password, db.Host, db.Port, db.Database, err = findDatabaseConfigurationFromURI(uri, defaultDBProviderPort(service))

			if err != nil {
				log.Warnf("Failed to find Cloud Foundry service config from `%v` (failed to parse)", DB_URI)
				return false
			}

			err := validateRequiredDatabaseParams(db.Username, db.Password, db.Database, db.Host, db.Port)
			if err != nil {
				log.Warnf("Failed to find Cloud Foundry service config from `%v` (missing values)\n%v", DB_URI, err)
				return false
			}
		}

		log.Infof("Applied Cloud Foundry database service config (provider: %s)", db.DatabaseProvider)
		return true
	}
	return false
}

func getDBCredentialsValue(val interface{}) string {
	// First ensure that the value is not null, otherwise fmt print will convert to the string "<nil>"
	if val == nil {
		val = ""
	}
	return fmt.Sprintf("%v", val)
}

func findDatabaseConfigurations(vcapServices map[string][]VCAPService) map[string]VCAPService {
	configs := make(map[string]VCAPService)

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
	uri := getDBCredentialsValue(service.Credentials[DB_URI])
	return strings.HasPrefix(uri, URI_POSTGRES) || stringInSlice(TAG_POSTGRES, service.Tags)
}

func isMySQLService(service VCAPService) bool {
	uri := getDBCredentialsValue(service.Credentials[DB_URI])
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

func findDatabaseConfigurationFromURI(uri string, defaultPort int) (string, string, string, int, string, error) {
	re := regexp.MustCompile(`(?P<provider>.+)://(?P<username>[^:]+)(?::(?P<password>.+))?@(?P<host>[^:]+)(?::(?P<port>.+))?\/(?P<dbname>.+)`)
	n1 := re.SubexpNames()
	matches := re.FindAllStringSubmatch(uri, -1)
	if len(matches) < 1 {
		return "", "", "", 0, "", errors.New("failed to parse database URI")
	}

	r2 := matches[0]
	md := map[string]string{}
	for i, n := range r2 {
		md[n1[i]] = n
	}

	username := md["username"]
	password := md["password"]
	host := md["host"]
	portStr := fmt.Sprintf("%v", md["port"])
	var port int
	if portStr != "<nil>" {
		port, _ = strconv.Atoi(portStr)
	} else {
		port = defaultPort
	}
	dbname := md["dbname"]

	return username, password, host, port, dbname, nil

}

func defaultDBProviderPort(service VCAPService) int {
	if isPostgresService(service) {
		return 5432
	} else if isMySQLService(service) {
		return 3306
	}
	return 0
}
