package datastore

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/govau/cf-common/env"
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
		slog.Warn("unable to convert the env var into JSON", "var", SERVICES_ENV, "error", err)
		return false, nil
	}

	if len(vcapServices) == 0 {
		slog.Info("No DB configurations defined, will use SQLite")
		return false, nil
	}
	return findDatabaseConfig(vcapServices, db, env), nil
}

func findDatabaseConfig(vcapServices map[string][]VCAPService, db *DatabaseConfig, env *env.VarSet) bool {
	var service VCAPService
	configs := findDatabaseConfigurations(vcapServices)
	slog.Info("Found database service instances", "count", len(configs))
	for _, s := range configs {
		// If only 1 db service, then use it
		if len(configs) == 1 {
			service = s
			slog.Info("Using the first database service instance", "service", service.Name)
		} else {
			// Use it if it has our service tag
			if stringInSlice(STRATOS_TAG, s.Tags) {
				service = s
				slog.Info("Using the tagged database service instance", "service", service.Name)
			}
		}
	}

	// If we found a service, then use it
	if len(service.Name) > 0 {
		dbCredentials := service.Credentials

		slog.Info("Attempting to apply Cloud Foundry database service config from VCAP_SERVICES credentials")

		// 1) Check db config in credentials
		db.Username = getDBCredentialsValue(dbCredentials["username"])
		db.Password = getDBCredentialsValue(dbCredentials["password"])
		db.Host = getDBCredentialsValue(dbCredentials["host"])
		if db.Host == "" { // If host is empty, use hostname
			db.Host = getDBCredentialsValue(dbCredentials["hostname"])
		}
		db.SSLMode = env.String("DB_SSL_MODE", "disable")
		db.Port, _ = strconv.Atoi(getDBCredentialsValue(dbCredentials["port"]))
		// Note - Both isPostgresService and isMySQLService look at the credentials uri & tags
		if isPostgresService(service) {
			db.DatabaseProvider = "pgsql"
			db.Database = getDBCredentialsValue(dbCredentials["name"])
			if db.Database == "" { // If database name is empty, use dbname
				db.Database = getDBCredentialsValue(dbCredentials["dbname"])
			}
			if db.SSLMode == string(SSLVerifyCA) {
				slog.Info("Attempting to use SSL for the database connection")
				if (dbCredentials["cacrt"] != nil) && (dbCredentials["cacrt"] != "") { // Check if CA certificate is present
					slog.Info("Found a service CA in VCAP_SERVICES, will use it to verify the database connection")
					tempFile, err := os.CreateTemp("", "postgres-ssl-*.crt")
					if err != nil {
						slog.Warn("failed to store the Cloud Foundry service certificate in a temp file", "reason", "could not create the temp file", "error", err)
						return false
					}
					_, err = tempFile.WriteString(getDBCredentialsValue(dbCredentials["cacrt"]))
					if err != nil {
						slog.Warn("failed to store the Cloud Foundry service certificate in a temp file", "reason", "could not write to the temp file", "error", err)
						return false
					}

					err = tempFile.Close()
					if err != nil {
						slog.Warn("failed to store the Cloud Foundry service certificate in a temp file", "reason", "could not save the temp file after writing", "error", err)
						return false
					}

					db.SSLRootCertificate = tempFile.Name()
				} else {
					slog.Info("No CA certificate found in VCAP_SERVICES, using system CA certificates")
				}
			}
		} else if isMySQLService(service) {
			db.DatabaseProvider = "mysql"
			db.Database = getDBCredentialsValue(dbCredentials["name"])
		} else {
			slog.Info("Cloud Foundry database service contains an unsupported db type")
			return false
		}
		err := validateRequiredDatabaseParams(db.Username, db.Password, db.Database, db.Host, db.Port)

		if err != nil {
			// 2) Check for db config in credentials uri
			slog.Info("Failed to find the required Cloud Foundry database service config, falling back on the credential",
				"credential", DB_URI, "error", err)
			uri := getDBCredentialsValue(dbCredentials[DB_URI])
			if len(uri) == 0 {
				slog.Warn("Failed to find the Cloud Foundry service credential", "credential", DB_URI)
				return false
			}

			db.Username, db.Password, db.Host, db.Port, db.Database, db.QueryParams, err = findDatabaseConfigurationFromURI(uri, defaultDBProviderPort(service))

			if err != nil {
				slog.Warn("Failed to find the Cloud Foundry service config", "credential", DB_URI, "reason", "failed to parse")
				return false
			}

			err := validateRequiredDatabaseParams(db.Username, db.Password, db.Database, db.Host, db.Port)
			if err != nil {
				slog.Warn("Failed to find the Cloud Foundry service config",
					"credential", DB_URI, "reason", "missing values", "error", err)
				return false
			}
		}

		slog.Info("Applied the Cloud Foundry database service config", "provider", db.DatabaseProvider)
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

func findDatabaseConfigurationFromURI(uri string, defaultPort int) (string, string, string, int, string, map[string]string, error) {
	re := regexp.MustCompile(`(?P<provider>.+)://(?P<username>[^:]+)(?::(?P<password>.+))?@(?P<host>[^:]+)(?::(?P<port>.+))?\/(?P<dbname>[^?]+)(?:\?(?P<queryparams>.*))*`)
	n1 := re.SubexpNames()
	matches := re.FindAllStringSubmatch(uri, -1)
	if len(matches) < 1 {
		return "", "", "", 0, "", map[string]string{}, errors.New("failed to parse database URI")
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
	queryparamsraw := md["queryparams"]
	queryparams := make(map[string]string)
	for _, keyvalue := range strings.Split(queryparamsraw, "&") {
		if key, value, valid := strings.Cut(keyvalue, "="); valid {
			queryparams[key] = value
		}
	}

	return username, password, host, port, dbname, queryparams, nil
}

func defaultDBProviderPort(service VCAPService) int {
	if isPostgresService(service) {
		return 5432
	} else if isMySQLService(service) {
		return 3306
	}
	return 0
}
