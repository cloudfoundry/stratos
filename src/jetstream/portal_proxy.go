package main

import (
	"database/sql"
	"regexp"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
)

type portalProxy struct {
	Config                 interfaces.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           interfaces.SessionStorer
	SessionStoreOptions    *sessions.Options
	Plugins                map[string]interfaces.StratosPlugin
	PluginsStatus          map[string]bool
	Diagnostics            *interfaces.Diagnostics
	SessionCookieName      string
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	AuthProviders          map[string]interfaces.AuthProvider
	env                    *env.VarSet
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}

// canPerformMigrations indicates if we can safely perform migrations
// This depends on the deployment mechanism and the database config
// e.g. if running in Cloud Foundry with a shared DB, then only the 0-index application instance
// can perform migrations
var canPerformMigrations = true

// SetCanPerformMigrations updates the state that records if we can perform Database migrations
func (p *portalProxy) SetCanPerformMigrations(value bool) {
	canPerformMigrations = canPerformMigrations && value
}

// CanPerformMigrations returns if we can perform Database migrations
func (p *portalProxy) CanPerformMigrations() bool {
	return canPerformMigrations
}