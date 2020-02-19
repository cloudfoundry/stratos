package main

import (
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"

	"github.com/govau/cf-common/env"
	. "github.com/smartystreets/goconvey/convey"
)

func TestConsoleSetup(t *testing.T) {

	Convey("Check that we can migrate data from the old console_config table", t, func() {

		db, _, err := datastore.GetInMemorySQLLiteConnection()
		if err != nil {
			t.Errorf("can not open sqlite database for testing: %v", err)
		}
		defer db.Close()

		// Okay, so now we have a db set up in the state BEFORE we migrate to the new schema
		// Insert a row into the setup table (need to do this manually now)
		addMarker := "INSERT INTO console_config (uaa_endpoint, console_client, console_client_secret, console_admin_scope) VALUES ('TEST_UAA', 'TEST_CLIENT', 'TEST_SECRET', 'TEST_SCOPE')"
		_, err = db.Exec(addMarker)
		if err != nil {
			t.Errorf("Failed to add data to the setup table: %v", err)
		}

		// Okay - now we can migrate the data
		configStore, err := console_config.NewPostgresConsoleConfigRepository(db)
		if err != nil {
			t.Errorf("Could not get config store: %v", err)
		}

		envLookup := env.NewVarSet()
		envLookup.AppendSource(console_config.ConfigLookup)
		portal := &portalProxy{env: envLookup}
		// Initalize for testing
		portal.GetConfig().CanMigrateDatabaseSchema = true
		err = console_config.MigrateSetupData(portal, configStore)
		if err != nil {
			t.Errorf("Could not migrate config settings: %v", err)
		}

		// The old config should have been removed

		// Read the console config and check we read it back correctly
		old, err := configStore.GetConsoleConfig()
		if err != nil {
			t.Errorf("Could not get old config: %v", err)
		}

		// Old should be nil as we should have removed the row
		So(old, ShouldBeNil)

		console_config.InitializeConfEnvProvider(configStore)

		newConfig, err := portal.initialiseConsoleConfig(envLookup)
		if err != nil {
			t.Errorf("Could not get new config: %v", err)
		}

		// New config should be

		So(newConfig.UAAEndpoint.String(), ShouldEqual, "TEST_UAA")
		So(newConfig.AuthorizationEndpoint.String(), ShouldEqual, "TEST_UAA")

		So(newConfig.ConsoleClient, ShouldEqual, "TEST_CLIENT")
		So(newConfig.ConsoleClientSecret, ShouldEqual, "TEST_SECRET")
		So(newConfig.ConsoleAdminScope, ShouldEqual, "TEST_SCOPE")
		So(newConfig.SkipSSLValidation, ShouldEqual, false)
		So(newConfig.UseSSO, ShouldEqual, false)

		Convey("Check values stored in the db as patr of migratio", func() {
			v, ok, err := configStore.GetValue("env", "UAA_ENDPOINT")
			So(err, ShouldBeNil)
			So(ok, ShouldBeTrue)
			So(v, ShouldEqual, "TEST_UAA")

			v, ok, err = configStore.GetValue("env", "SKIP_SSL_VALIDATION")
			So(err, ShouldBeNil)
			So(ok, ShouldBeFalse)
			So(v, ShouldEqual, "")
		})
	})
}
