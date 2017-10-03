package datastore

import (
	"encoding/json"
	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	log "github.com/Sirupsen/logrus"
	"strconv"
	"strings"
	"fmt"
)

const (
	SERVICES_ENV = "VCAP_SERVICES"
)

type VCAPService struct {
	Credentials map[string]interface{} `json:"credentials"`
	Tags        []string               `json:"tags"`
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

	for _, services := range vcapServices {
		if len(services) == 0 {
			continue
		}

		service := services[0]

		for _, tag := range service.Tags {
			if strings.HasPrefix(tag, "stratos_postgresql") {
				dbCredentials := service.Credentials
				db.DatabaseProvider = "pgsql"
				db.Username = fmt.Sprintf("%v", dbCredentials["username"])
				db.Password = fmt.Sprintf("%v", dbCredentials["password"])
				db.Database = fmt.Sprintf("%v", dbCredentials["dbname"])
				db.Host = fmt.Sprintf("%v", dbCredentials["hostname"])
				db.Port, _ = strconv.Atoi(fmt.Sprintf("%v", dbCredentials["port"]))
				db.SSLMode = "disable"
				log.Info("Discovered Cloud Foundry postgres service and applied config")
				return true
			} else if strings.HasPrefix(tag, "stratos_mysql") {
				dbCredentials := service.Credentials
				db.DatabaseProvider = "mysql"
				db.Username = fmt.Sprintf("%v", dbCredentials["username"])
				db.Password = fmt.Sprintf("%v", dbCredentials["password"])
				db.Database = fmt.Sprintf("%v", dbCredentials["name"])
				db.Host = fmt.Sprintf("%v", dbCredentials["hostname"])
				db.Port = (int)(dbCredentials["port"].(float64))
				db.SSLMode = "disable"
				log.Info("Discovered Cloud Foundry mysql service and applied config")
				return true
			}
		}
	}

	return false
}
