package main

import (
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"bitbucket.org/liamstask/goose/lib/goose"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

const (
	TYPE_POSTGRES     = "postgresql"
	TYPE_MYSQL        = "mysql"
	DATABASE_PROVIDER = "DATABASE_PROVIDER"
	DB_TYPE           = "DB_TYPE"
	DB_HOST           = "DB_HOST"
	DB_PORT           = "DB_PORT"
	DB_USER           = "DB_USER"
	DB_PASSWORD       = "DB_PASSWORD"
	DB_DATABASE_NAME  = "DB_DATABASE_NAME"
)

// global options. available to any subcommands.
var flagPath = flag.String("path", "db", "folder containing db info")
var flagEnv = flag.String("env", "development", "which DB environment to use")
var flagPgSchema = flag.String("pgschema", "", "which postgres-schema to migrate (default = none)")
var flagCloudFoundry = flag.Bool("cf", false, "detect and parse Cloud Foundry database configuration from VCAP_SERVICES")

// helper to create a DBConf from the given flags
func dbConfFromFlags() (dbconf *goose.DBConf, err error) {
	return goose.NewDBConf(*flagPath, *flagEnv, *flagPgSchema)
}

func migrateDatabase() bool {

	flag.Usage = usage
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		return false
	}

	if args[0] == "-h" {
		flag.Usage()
		return true
	}

	if !parseCloudFoundry() {
		return false
	}

	switch args[0] {
	case "up":
		upRun(args[1:])
	case "status":
		statusRun()
	case "dbversion":
		dbVersionRun()
	default:
		log.Fatal("Command not supported")
	}

	// This function returns true if the migrator was called, false otherwise
	return true
}

func parseCloudFoundry() bool {

	if *flagCloudFoundry {
		dbEnv, err := parseCloudFoundryEnv()
		if err != nil {
			log.Fatal("Failed to parse Cloud Foundry Environment Variables")
		}
		flag.Set("env", dbEnv)

		// If there is no dbEnv, then we are using SQLite, so don't run migrations
		if len(dbEnv) == 0 {
			log.Println("No DB Environment detected - skipping migrations")
			return false
		}
	}

	return true
}

// Perform the migrations

func upRun(args []string) {

	conf, err := dbConfFromFlags()
	if err != nil {
		log.Fatal(err)
	}

	db, err := goose.OpenDBFromDBConf(conf)
	if err != nil {
		log.Fatal("Failed to open database connection")
	}
	defer db.Close()

	err = datastore.ApplyMigrations(conf, db)
	if err != nil {
		log.Fatal("Migration failed! ", err)
	}
}

func dbVersionRun() {
	conf, err := dbConfFromFlags()
	if err != nil {
		log.Fatal(err)
	}

	current, err := goose.GetDBVersion(conf)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("goose: dbversion %v\n", current)
}

func statusRun() {

	conf, err := dbConfFromFlags()
	if err != nil {
		log.Fatal(err)
	}

	// collect all migrations
	min := int64(0)
	max := int64((1 << 63) - 1)
	migrations, e := goose.CollectMigrations(conf.MigrationsDir, min, max)
	if e != nil {
		log.Fatal(e)
	}

	db, e := goose.OpenDBFromDBConf(conf)
	if e != nil {
		log.Fatal("couldn't open DB:", e)
	}
	defer db.Close()

	// must ensure that the version table exists if we're running on a pristine DB
	if _, e := goose.EnsureDBVersion(conf, db); e != nil {
		log.Fatal(e)
	}

	log.Printf("goose: status for environment '%v'\n", conf.Env)
	log.Println("    Applied At                  Migration")
	log.Println("    =======================================")
	for _, m := range migrations {
		printMigrationStatus(db, m.Version, filepath.Base(m.Source))
	}
}

func printMigrationStatus(db *sql.DB, version int64, script string) {
	var row goose.MigrationRecord
	q := fmt.Sprintf("SELECT tstamp, is_applied FROM goose_db_version WHERE version_id=%d ORDER BY tstamp DESC LIMIT 1", version)
	e := db.QueryRow(q).Scan(&row.TStamp, &row.IsApplied)

	if e != nil && e != sql.ErrNoRows {
		log.Fatal(e)
	}

	var appliedAt string

	if row.IsApplied {
		appliedAt = row.TStamp.Format(time.ANSIC)
	} else {
		appliedAt = "Pending"
	}

	log.Printf("    %-24s -- %v\n", appliedAt, script)
}

func usage() {
	fmt.Print(usagePrefix)
	flag.PrintDefaults()
}

var usagePrefix = `
stratos db migration cli
`

func parseCloudFoundryEnv() (string, error) {
	var dbEnv string

	fmt.Println("Attempting to parse VCAP_SERVICES")

	var dbConfig datastore.DatabaseConfig

	parsedDBConfig, err := datastore.ParseCFEnvs(&dbConfig)
	if err != nil {
		return "", errors.New("Could not parse Cloud Foundry Services environment")
	}

	if parsedDBConfig {
		exportDatabaseConfig(dbConfig)

		switch dbType := os.Getenv(DB_TYPE); dbType {
		case TYPE_POSTGRES:
			dbEnv = "cf_postgres"
			fmt.Printf("Migrating postgresql instance on %s\n", os.Getenv(DB_HOST))
		case TYPE_MYSQL:
			dbEnv = "cf_mysql"
			fmt.Printf("Migrating mysql instance on %s\n", os.Getenv(DB_HOST))
		default:
			// Database service not found or type not recognized
			return "", nil
		}
		return dbEnv, nil
	}

	return "", nil
}

func exportDatabaseConfig(dbConfig datastore.DatabaseConfig) {
	exportString(DATABASE_PROVIDER, dbConfig.DatabaseProvider)
	exportString(DB_HOST, dbConfig.Host)
	exportString(DB_PORT, dbConfig.Port)
	exportString(DB_USER, dbConfig.Username)
	exportString(DB_PASSWORD, dbConfig.Password)
	exportString(DB_DATABASE_NAME, dbConfig.Database)

	if dbConfig.DatabaseProvider == "pgsql" {
		exportString(DB_TYPE, TYPE_POSTGRES)
	} else if dbConfig.DatabaseProvider == "mysql" {
		exportString(DB_TYPE, TYPE_MYSQL)
	}
}

func exportString(name string, value interface{}) {
	os.Setenv(name, fmt.Sprintf("%v", value))
}
