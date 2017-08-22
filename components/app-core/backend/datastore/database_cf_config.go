package datastore

import (
	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"encoding/json"
	log "github.com/Sirupsen/logrus"
	"strconv"
)

const (
	SERVICES_ENV = "VCAP_SERVICES"
)

type VCAPServices struct {
	Postgresql []VCAPService `json:"postgresql"`
}

type VCAPService struct {
	Credentials VCAPCredential `json:"credentials"`
}

type VCAPCredential struct {
	Username                string `json:"username"`
	Password                string `json:"password"`
	Dbname                	string `json:"dbname"`
	Hostname                string `json:"hostname"`
	Port                    string `json:"port"`
	Uri 					string `json:"uri"`
}

func ParseCFEnvs(db *DatabaseConfig) (bool){
	if (config.IsSet(SERVICES_ENV) == false) {
		return false;
	}

	vcapServicesStr := config.GetString(SERVICES_ENV)

	var vcapServices VCAPServices
	err := json.Unmarshal([]byte(vcapServicesStr), &vcapServices)
	if err != nil {
		log.Warnf("Unable to convert %s env var into JSON", SERVICES_ENV)
		return false;
	}

	// At the moment we only handle Postgres
	if vcapServices.Postgresql != nil {
		log.Info("Found postgres section in VCAP_SERVICES")

		if (len(vcapServices.Postgresql) == 0) {
			return false
		}

		postgresqlCreds := vcapServices.Postgresql[0].Credentials

		db.DatabaseProvider = "pgsql"
		db.Username = postgresqlCreds.Username
		db.Password = postgresqlCreds.Password
		db.Database = postgresqlCreds.Dbname
		db.Host = postgresqlCreds.Hostname
		db.Port, err = strconv.Atoi(postgresqlCreds.Port)
		db.SSLMode = "disable"
		return true
	}

	return false;
}
