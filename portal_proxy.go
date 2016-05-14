package main

import (
	"github.com/gorilla/sessions"

	"github.com/hpcloud/portal-proxy/datastore"
)

type portalProxy struct {
	Config         portalConfig
	DatabaseConfig datastore.DatabaseConfig

	CookieStore *sessions.CookieStore
}
