package main

import (
	// "errors"
	// "fmt"
	// "net/url"
	"testing"
	// "time"

//	"gopkg.in/DATA-DOG/go-sqlmock.v1"
	log "github.com/sirupsen/logrus"
	"github.com/govau/cf-common/env"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"

	// "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	// "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	. "github.com/smartystreets/goconvey/convey"

)

func TestConsoleSetup(t *testing.T) {

	Convey("Check that we can migrate data from the old console_config table", t, func() {

		// Remove the migration that migrates the console data - we'll apply that later
		migrationSteps := datastore.GetOrderedMigrations()

		var newSteps []datastore.StratosMigrationStep

		for _, step := range migrationSteps {
			log.Info(step.Name)
			if step.Name != "ConfigSchema" {
				newSteps = append(newSteps, step)
			}
		}
		datastore.SetMigrations(newSteps)

		db, err := datastore.GetSQLLiteConnectionWithPath("file::memory:?cache=shared", true)
		if err != nil {
			t.Errorf("can not open sqlite database for testing: %v", err)
		}
		defer db.Close()

		// Okay, so now we have a db set up in the state BEFORE we migrate to the new schema
		// Insert a row into the setup table (need to do this manually now)
		addMarker := "INSERT INTO console_config (uaa_endpoint, console_client, console_client_secret, console_admin_scope) VALUES ('TEST_UAA', 'TEST_CLIENT', 'TEST_SCOPE', 'TEST_SECRET')"
		_, err = db.Exec(addMarker)
		if err != nil {
			t.Errorf("Failed to add data to the setup table: %v", err)
		}

		// Now apply the last migration
		datastore.SetMigrations(migrationSteps)
		conf := datastore.CreateFakeSQLiteGooseDriver()
		err = datastore.ApplyMigrations(conf, db)
		if err != nil {
			t.Errorf("Failed to apply migrations: %v", err)
		}

		// Okay - now we can migrate the data
		configStore, err := console_config.NewPostgresConsoleConfigRepository(db)
		if err != nil {
			t.Errorf("Could not get config store: %v", err)
		}

		envLookup := env.NewVarSet()
		envLookup.AppendSource(console_config.ConfigLookup)
		portal := &portalProxy{env: envLookup}
		err = console_config.MigrateSetupData(portal, configStore)
		if err != nil {
			t.Errorf("Could not migrate config settings: %v", err)
		}

		// Read the console config and check we read it back correctly
		old, err := configStore.GetConsoleConfig()
		if err != nil {
			t.Errorf("Could not get old config: %v", err)
		}

		console_config.InitializeConfEnvProvider(configStore)

		newConfig, err := portal.initialiseConsoleConfig(envLookup)
		if err != nil {
			t.Errorf("Could not get new config: %v", err)
		}

		So(old.UAAEndpoint.String(), ShouldEqual, newConfig.UAAEndpoint.String())
		So(newConfig.AuthorizationEndpoint.String(), ShouldEqual, "TEST_UAA")

		So(old.ConsoleClient, ShouldEqual, newConfig.ConsoleClient)
		So(old.ConsoleClientSecret, ShouldEqual, newConfig.ConsoleClientSecret)
		So(old.SkipSSLValidation, ShouldEqual, newConfig.SkipSSLValidation)
		So(old.UseSSO, ShouldEqual, newConfig.UseSSO)
	})
}
