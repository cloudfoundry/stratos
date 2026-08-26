package console_config

import (
	"log/slog"
	"strconv"

	"github.com/govau/cf-common/env"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
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
func MigrateSetupData(portal api.PortalProxy, configStore Repository) error {

	// Determine if we need to migrate data first
	_, ok, err := configStore.GetValue(systemGroupName, configSetupNeededMarker)
	if err != nil {
		slog.Error("MigrateSetupData: unable to check the migration marker", "error", err)
		return err
	} else if !ok {
		slog.Debug("MigrateSetupData: marker not present - no need to run migrations")
		return nil
	}

	// If we got a value, then we should migrate
	if !portal.GetConfig().CanMigrateDatabaseSchema {
		slog.Info("Will not migrate setup data on this instance")
		return nil
	}

	slog.Info("Migrating setup data to config store")

	// Load the set  up config from the old table, first

	config, err := configStore.GetConsoleConfig()
	if err != nil {
		slog.Warn("Unable to load Setup configuration from the database")
		return err
	}

	if config == nil {
		slog.Info("Can not migrate setup data - setup table is empty")

		// Remove the marker
		return configStore.DeleteValue(systemGroupName, configSetupNeededMarker)
	}

	// Persist the config - only save the settings if they differ from the environment
	if err := migrateConfigSetting(portal.Env(), configStore, "UAA_ENDPOINT", config.UAAEndpoint.String(), ""); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_ADMIN_SCOPE", config.ConsoleAdminScope, ""); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_CLIENT", config.ConsoleClient, ""); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "CONSOLE_CLIENT_SECRET", config.ConsoleClientSecret, ""); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "AUTH_ENDPOINT_TYPE", config.AuthEndpointType, ""); err != nil {
		return err
	}

	if err := migrateConfigSetting(portal.Env(), configStore, "SKIP_SSL_VALIDATION", strconv.FormatBool(config.SkipSSLValidation), "false"); err != nil {
		return err
	}

	// Don't store previous SSO_LOGIN value if it's false.
	// SSO_LOGIN was incorrectly being set in previous console config table, this was then transferred over here where the console expects
	// previous values to have been explicitly set by user (and as such should take precedents over env vars)
	// See https://github.com/cloudfoundry/stratos/issues/4013
	if config.UseSSO {
		if err := migrateConfigSetting(portal.Env(), configStore, "SSO_LOGIN", strconv.FormatBool(config.UseSSO), "false"); err != nil {
			return err
		}
	}

	// Delete the content form the legacy table
	err = configStore.DeleteConsoleConfig()
	if err != nil {
		slog.Warn("unable to delete legacy console config data", "error", err)
		return err
	}

	// Delete the migration marker
	err = configStore.DeleteValue(systemGroupName, configSetupNeededMarker)
	if err != nil {
		slog.Warn("unable to delete the setup config migration marker", "error", err)
		return err
	}

	return nil
}

func migrateConfigSetting(envLookup *env.VarSet, configStore Repository, envVarName, value, defaultValue string) error {

	var shouldStore bool

	// Get the current value from the environment
	if currentValue, ok := envLookup.Lookup(envVarName); ok {
		shouldStore = currentValue != value
	} else {
		// Only store if the value is not the default value
		shouldStore = value != defaultValue
	}

	if shouldStore {
		err := configStore.SetValue(envGroupName, envVarName, value)
		return err
	}

	return nil
}
