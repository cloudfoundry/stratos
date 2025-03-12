package datastore

import (
	"database/sql"
	"fmt"

	log "github.com/sirupsen/logrus"

	"github.com/pressly/goose"
)

var (
	minVersion = int64(0)
	maxVersion = int64((1 << 63) - 1)
)

// ApplyMigrations will perform the migrations
func ApplyMigrations(db *sql.DB) error {
	current, err := goose.EnsureDBVersion(db)
	if err != nil {
		return fmt.Errorf("failed to get database version: %s", err.Error())
	}

	log.Println("========================")
	log.Println("= Stratos DB Migration =")
	log.Println("========================")
	log.Printf("Database provider: %v", goose.GetDialect())
	log.Printf("Current %d", current)

	goose.SetLogger(log.StandardLogger())

	migrations, err := goose.CollectMigrations(".", minVersion, maxVersion)
	if err != nil {
		return err
	}

	if len(migrations) == 0 {
		return fmt.Errorf("no Database Migrations found")
	}

	for {
		current, err := goose.GetDBVersion(db)
		if err != nil {
			return err
		}

		next, err := migrations.Next(current)
		if err != nil {
			if err == goose.ErrNoNextVersion {
				log.Printf("No migrations to run. current version: %d\n", current)
				return nil
			}
			return err
		}

		if err = next.Up(db); err != nil {
			return err
		}
	}
}
