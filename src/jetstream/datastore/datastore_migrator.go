package datastore

import (
	"database/sql"
	"fmt"
	"log/slog"

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

	slog.Info("========================")
	slog.Info("= Stratos DB Migration =")
	slog.Info("========================")
	slog.Info("Starting DB migration", "provider", goose.GetDialect(), "currentVersion", current)

	// goose.Logger wants Print/Printf/Println/Fatal/Fatalf; a *log.Logger fed
	// from the slog handler satisfies it and keeps goose's output on-stream.
	goose.SetLogger(slog.NewLogLogger(slog.Default().Handler(), slog.LevelInfo))

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
				slog.Info("No migrations to run", "currentVersion", current)
				return nil
			}
			return err
		}

		if err = next.Up(db); err != nil {
			return err
		}
	}
}
