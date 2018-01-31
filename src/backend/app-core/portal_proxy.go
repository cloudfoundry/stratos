package main

import (
	"database/sql"
	"time"

	"github.com/SUSE/stratos-ui/app-core/repository/interfaces"
	"github.com/gorilla/sessions"
)

type portalProxy struct {
	Config                 interfaces.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           interfaces.SessionStorer
	Plugins                map[string]interfaces.StratosPlugin
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}
