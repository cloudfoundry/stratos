package main

import (
	"flag"
	"fmt"
	"log"
	"reflect"
	"sort"
	"strconv"

	"bitbucket.org/liamstask/goose/lib/goose"
)

// global options. available to any subcommands.
var flagPath = flag.String("path", "db", "folder containing db info")
var flagEnv = flag.String("env", "development", "which DB environment to use")
var flagPgSchema = flag.String("pgschema", "", "which postgres-schema to migrate (default = none)")

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

	// TODO: Check command is up
	fmt.Println(args[0])

	err := upRun(args[1:])
	if err != nil {
		fmt.Println("ERROR")
		fmt.Printf("%v\n", err)
		log.Fatal("Failed to perform database migration")
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

func upRun(args []string) error {

	conf, err := dbConfFromFlags()
	if err != nil {
		log.Fatal(err)
	}

	migrationsDir := conf.MigrationsDir

	db, err := goose.OpenDBFromDBConf(conf)
	if err != nil {
		fmt.Println("Failed to open database connection")
		return err
	}
	defer db.Close()

	current, err := goose.EnsureDBVersion(conf, db)
	if err != nil {
		return err
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
				return err
			}

			didRun = true
		} else {
			fmt.Printf("Skipping migration: %d\n", element.Version)
		}
	}

	if !didRun {
		fmt.Println("No migrations to run.")
	}

	return nil
}

func usage() {
	fmt.Print(usagePrefix)
	flag.PrintDefaults()
}

var usagePrefix = `
stratos-ui db migration cli
`
