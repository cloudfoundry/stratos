package main

import (
	"database/sql"

	"github.com/antonlindstrom/pgstore"
)

type portalProxy struct {
	Config                 portalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           *pgstore.PGStore
}
