package main

import (
	"database/sql"
	"regexp"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/apikeys"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo/v4"
)

type portalProxy struct {
	Config                 api.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           api.SessionStorer
	SessionStoreOptions    *sessions.Options
	SessionDataStore       api.SessionDataStore
	Plugins                map[string]api.StratosPlugin
	PluginsStatus          map[string]bool
	Diagnostics            *api.Diagnostics
	SessionCookieName      string
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	AuthProviders          map[string]api.AuthProvider
	env                    *env.VarSet
	StratosAuthService     api.StratosAuth
	APIKeysRepository      apikeys.Repository
	PluginRegisterRoutes   map[string]func(echo.Context) error
	StoreFactory           api.StoreFactory
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}
