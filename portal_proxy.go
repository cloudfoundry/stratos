package main

import (
	"github.com/gorilla/sessions"

	"github.com/hpcloud/portal-proxy/datastore"
)

type portalProxy struct {
	Config         portalConfig
	DatabaseConfig datastore.PostgresConnectionParameters

	CookieStore *sessions.CookieStore
}
