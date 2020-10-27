package main

import (
	"database/sql"
	"regexp"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo/v4"
)

type portalProxy struct {
	Config                 interfaces.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           interfaces.SessionStorer
	SessionStoreOptions    *sessions.Options
	SessionDataStore       interfaces.SessionDataStore
	Plugins                map[string]interfaces.StratosPlugin
	PluginsStatus          map[string]bool
	Diagnostics            *interfaces.Diagnostics
	SessionCookieName      string
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	AuthProviders          map[string]interfaces.AuthProvider
	env                    *env.VarSet
	StratosAuthService     interfaces.StratosAuth
	APIKeysRepository      apikeys.Repository
	PluginRegisterRoutes   map[string]func(echo.Context) error
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}
