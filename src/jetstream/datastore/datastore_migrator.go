package datastore

import (
	"database/sql"
	"fmt"
	"sort"

	log "github.com/sirupsen/logrus"

	"bitbucket.org/liamstask/goose/lib/goose"
)

// StratosMigration applies a migration step. Use with RegisterMigration()
type StratosMigration func(txn *sql.Tx, conf *goose.DBConf) error

// RegisterMigration registers a migration step. This should be called from an init() function
func RegisterMigration(version int64, name string, f StratosMigration) {
	migrationSteps = append(migrationSteps, StratosMigrationStep{
		Version: version,
		Name:    name,
		Apply:   f,
	})
}

// StratosMigrationStep represents a migaration step
type StratosMigrationStep struct {
	Version int64
	Name    string
	Apply   StratosMigration
}

var migrationSteps []StratosMigrationStep

// GetOrderedMigrations returns an order list of migrations to run
func GetOrderedMigrations() []StratosMigrationStep {
	sort.Slice(migrationSteps, func(i, j int) bool {
		return migrationSteps[i].Version < migrationSteps[j].Version
	})
	return migrationSteps
}

// SetMigrations replces the current list of migrations - used only by tests internally
func SetMigrations(steps []StratosMigrationStep) {
	migrationSteps = steps
}

// ApplyMigrations will perform the migrations
func ApplyMigrations(conf *goose.DBConf, db *sql.DB) error {
	current, err := goose.EnsureDBVersion(conf, db)
	if err != nil {
		return fmt.Errorf("Failed to get database version: %s", err.Error())
	}

	log.Println("========================")
	log.Println("= Stratos DB Migration =")
	log.Println("========================")
	log.Printf("Database provider: %s", conf.Driver.Name)
	log.Printf("Current %d", current)

	stratosMigrations := GetOrderedMigrations()

	if len(stratosMigrations) == 0 {
		return fmt.Errorf("No Database Migrations found")
	}

	// Target is always the last migration
	target := stratosMigrations[len(stratosMigrations)-1].Version
	log.Printf("Target: %d", target)

	log.Println("Running migrations ....")
	didRun := false
	for _, step := range stratosMigrations {
		if step.Version > current {
			log.Printf("Running migration: %d_%s", step.Version, step.Name)

			txn, err := db.Begin()
			if err != nil {
				log.Error("db.Begin:", err)
				return err
			}

			err = step.Apply(txn, conf)
			if err != nil {
				log.Error("Apply() failed:", err)
				return err
			}

			err = goose.FinalizeMigration(conf, txn, true, step.Version)
			if err != nil {
				log.Error("Commit() failed:", err)
				return err
			}

			didRun = true
		} else {
			log.Printf("Skipping migration: %d", step.Version)
		}
	}

	if !didRun {
		log.Println("No migrations to run.")
	}

	return nil
}
