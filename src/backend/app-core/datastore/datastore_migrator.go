package datastore

import (
	"database/sql"
	"reflect"
	"sort"
	"strconv"

	log "github.com/Sirupsen/logrus"

	"bitbucket.org/liamstask/goose/lib/goose"
)

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

func ApplyMigrations(conf *goose.DBConf, db *sql.DB) {

	current, err := goose.EnsureDBVersion(conf, db)
	if err != nil {
		log.Fatal("Failed to get database version")
	}

	log.Println("========================")
	log.Println("Stratos DB Migration")
	log.Println("========================")
	log.Printf("Current %d", current)

	stratosMigrations := findMigrartions()

	if len(stratosMigrations) == 0 {
		log.Fatal("No Database Migrations found")
	}

	// Target is always the last migration
	target := stratosMigrations[len(stratosMigrations)-1].Version
	log.Printf("Target: %d", target)

	log.Println("Running migrations ....")
	didRun := false
	for _, element := range stratosMigrations {
		if element.Version > current && element.Version <= target {
			log.Printf("Running migration: %d", element.Version)

			txn, err := db.Begin()
			if err != nil {
				log.Fatal("db.Begin:", err)
			}

			sMigrationMethods := &StratosMigrations{}
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
			log.Printf("Skipping migration: %d", element.Version)
		}
	}

	if !didRun {
		log.Println("No migrations to run.")
	}
}

func findMigrartions() []StratosMigrationMehod {
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

	return stratosMigrations
}
