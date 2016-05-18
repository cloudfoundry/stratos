package main

import (
	"database/sql"

	"github.com/gorilla/sessions"

	"github.com/hpcloud/portal-proxy/datastore"
)

type portalProxy struct {
	Config                 portalConfig
	DatabaseConfig         datastore.DatabaseConfig
	DatabaseConnectionPool *sql.DB

	CookieStore *sessions.CookieStore
}
