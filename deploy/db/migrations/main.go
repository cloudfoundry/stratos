package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"time"

	"bitbucket.org/liamstask/goose/lib/goose"
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

func main() {

	flag.Usage = usage
	flag.Parse()

	args := flag.Args()
	if len(args) == 0 || args[0] == "-h" {
		flag.Usage()
		return
	}

	if *flagCloudFoundry {
		dbEnv, err := parseCloudFoundryEnv()
		if err != nil {
			log.Fatal("Failed to parse Cloud Foundry Environment Variables")
		}
		flag.Set("env", dbEnv)

		// If there is no dbEnv, then we are using SQLite, so don't run migrations
		if len(dbEnv) == 0 {
			log.Println("No DB Environment detected - skipping migrations")
			return
		}
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
}

type StratosMigrationMehod struct {
	Name    string
	Version int64
	Method  reflect.Method
}

type StratosMigrations struct {
}

// func (s *StratosMigrations) Up_20170818162837(txn *sql.Tx) {
// 	Up_20170818162837(txn)
// }

// func (s *StratosMigrations) Up_20170818120003(txn *sql.Tx) {
// 	Up_20170818120003(txn)
// }

// -- Sorting

type By func(p1, p2 *StratosMigrationMehod) bool

// Sort is a method on the function type, By, that sorts the argument slice according to the function.
func (by By) Sort(methods []StratosMigrationMehod) {
	ps := &methodsSorter{
		methods: methods,
		by:      by, // The Sort method's receiver is the function (closure) that defines the sort order.
	}
	sort.Sort(ps)
}

// planetSorter joins a By function and a slice of Planets to be sorted.
type methodsSorter struct {
	methods []StratosMigrationMehod
	by      func(p1, p2 *StratosMigrationMehod) bool // Closure used in the Less method.
}

// Len is part of sort.Interface.
func (s *methodsSorter) Len() int {
	return len(s.methods)
}

// Swap is part of sort.Interface.
func (s *methodsSorter) Swap(i, j int) {
	s.methods[i], s.methods[j] = s.methods[j], s.methods[i]
}

// Less is part of sort.Interface. It is implemented by calling the "by" closure in the sorter.
func (s *methodsSorter) Less(i, j int) bool {
	return s.by(&s.methods[i], &s.methods[j])
}

// Perform the migrations

func upRun(args []string) {

	conf, err := dbConfFromFlags()
	if err != nil {
		log.Fatal(err)
	}

	migrationsDir := conf.MigrationsDir

	db, err := goose.OpenDBFromDBConf(conf)
	if err != nil {
		log.Fatal("Failed to open database connection")
	}
	defer db.Close()

	current, err := goose.EnsureDBVersion(conf, db)
	if err != nil {
		log.Fatal("Failed to get database version")
	}

	fmt.Println("========================")
	fmt.Println("Stratos UI DB Migration")
	fmt.Println("========================")
	fmt.Printf("Migrations dir: %s\n", migrationsDir)

	fmt.Printf("Current %d\n", current)

	sMigrationMethods := &StratosMigrations{}
	sMigrationMethodsType := reflect.TypeOf(sMigrationMethods)

	stratosMigrations := make([]StratosMigrationMehod, sMigrationMethodsType.NumMethod())
	for i := 0; i < sMigrationMethodsType.NumMethod(); i++ {
		method := sMigrationMethodsType.Method(i)
		methodVersion, err := strconv.ParseInt(method.Name[3:], 10, 64)
		if err == nil {
			stratosMigrations[i] = StratosMigrationMehod{
				Name:    method.Name,
				Version: methodVersion,
				Method:  method,
			}
		}
	}

	// Filter the migrations, so we only get those that need to be run
	sortMethods := func(p1, p2 *StratosMigrationMehod) bool {
		return p1.Version < p2.Version
	}
	By(sortMethods).Sort(stratosMigrations)

	// Target is always the last migration
	target := stratosMigrations[sMigrationMethodsType.NumMethod()-1].Version
	fmt.Printf("Target: %d\n", target)

	fmt.Println("Running migrations ....")
	didRun := false
	for _, element := range stratosMigrations {
		if element.Version > current && element.Version <= target {
			fmt.Printf("Running migration: %d\n", element.Version)

			txn, err := db.Begin()
			if err != nil {
				log.Fatal("db.Begin:", err)
			}

			method := reflect.ValueOf(sMigrationMethods).MethodByName(element.Name)
			in := make([]reflect.Value, 1)
			in[0] = reflect.ValueOf(txn)
			method.Call(in)

			log.Println("")

			err = goose.FinalizeMigration(conf, txn, true, element.Version)
			if err != nil {
				log.Fatal("Commit() failed:", err)
			}

			didRun = true
		} else {
			fmt.Printf("Skipping migration: %d\n", element.Version)
		}
	}

	if !didRun {
		fmt.Println("No migrations to run.")
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

	fmt.Printf("goose: dbversion %v\n", current)
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

	fmt.Printf("goose: status for environment '%v'\n", conf.Env)
	fmt.Println("    Applied At                  Migration")
	fmt.Println("    =======================================")
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

	fmt.Printf("    %-24s -- %v\n", appliedAt, script)
}

func usage() {
	fmt.Print(usagePrefix)
	flag.PrintDefaults()
}

var usagePrefix = `
stratos-ui db migration cli
`
