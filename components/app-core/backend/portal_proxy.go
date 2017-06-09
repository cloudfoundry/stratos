package main

import (
	"database/sql"
	"time"

	"github.com/gorilla/sessions"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

type portalProxy struct {
	Config                 interfaces.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           interfaces.SessionStorer
	EndpointPlugins              map[string]interfaces.EndpointPlugin
	GeneralPlugins         map[string]interfaces.GeneralPlugin
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}
