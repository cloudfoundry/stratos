package main

import (
	"database/sql"
	"net/http"

	"github.com/gorilla/sessions"
)

type SessionStorer interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error
}

type portalProxy struct {
	Config                 portalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           SessionStorer
}
