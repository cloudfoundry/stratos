package main

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gorilla/sessions"
)

// SessionStorer - TBD
type SessionStorer interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error
}

type portalProxy struct {
	Config                 portalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           SessionStorer
	LoginHook              LoginHookFunc
	UAAAdminIdentifier     string
	HCFAdminIdentifier     string
	HTTPS                  bool
	CloudFoundry           *CFInfo
}

// CFInfo - Cloud Foundry info when deployed as a Cloud Foundry application
type CFInfo struct {
	EndpointGUID string
	SpaceGUID    string
	AppGUID      string
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}
