package console_config

import (
	"strconv"

	"github.com/govau/cf-common/env"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

const (
	configSetupNeededMarker = "__CONFIG_MIGRATION_NEEDED"
	envGroupName            = "env"
	systemGroupName         = "system"
)

// Env Vars from config store
var envVars map[string]string

// ConfigLookup looks up env var from the config database
func ConfigLookup(name string) (string, bool) {
	// Not initialized yet
	if envVars == nil {
		return "", false
	}

	// Get value from map if available
	v, ok := envVars[name]
	return v, ok
}

// InitializeConfEnvProvider reads the config from the database
func InitializeConfEnvProvider(configStore Repository) error {

	vars, err := configStore.GetValues(envGroupName)
	if err != nil {
		return err
	}

	envVars = vars
	return nil
}

// MigrateSetupData will migrate the old data if needed
func MigrateSetupData(portal interfaces.PortalProxy, configStore Repository) error {

	// Determine if we need to migrate data first
	_, ok, err := configStore.GetValue(systemGroupName, configSetupNeededMarker)
	if err != nil || !ok {
		return err
	}

	// If we got a value, then we should migrate

	if !portal.CanPerformMigrations() {
		log.Info("Will not migrate setup data on this instance")
		return nil
	}

	log.Info("Migrating setup data to config store")

	// Load the set  up config from the old table, first

	config, err := configStore.GetConsoleConfig()
	if err != nil {
		log.Warn("Unable to load Setup configuration from the database")
		return err
	}

	if config == nil {
		log.Info("Can not migrate setup data - setup table is empty")
		return nil
	}

	// Persist the config - only save the settings if they differ from the environment
	if err := migrateConfigSetting(portal.Env(), configStore, "UAA_ENDPOINT", config.UAAEndpoint.String()); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_ADMIN_SCOPE", config.ConsoleAdminScope); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_CLIENT", config.ConsoleClient); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_CLIENT_SECRET", config.ConsoleClientSecret); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "SKIP_SSL_VALIDATION", strconv.FormatBool(config.SkipSSLValidation)); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "SSO_LOGIN", strconv.FormatBool(config.UseSSO)); err != nil {
		return err
	}

	// Delete the migration marker
	err = configStore.DeleteValue(systemGroupName, configSetupNeededMarker)
	if err != nil {
		log.Warnf("Unable to delete setup config migration marker: %+v", err)
		return err
	}

	return nil
}

func migrateConfigSetting(envLookup *env.VarSet, configStore Repository, envVarName, value string) error {

	var shouldStore = true

	// Get the current value from the environment
	if currentValue, ok := envLookup.Lookup(envVarName); ok {
		shouldStore = currentValue != value
	}

	if shouldStore {
		err := configStore.SetValue(envGroupName, envVarName, value)
		return err
	}

	return nil
}
