package main

import (
	"github.com/gorilla/sessions"

	"github.com/hpcloud/portal-proxy/datastore"
)

type portalProxy struct {
	Config         portalConfig
	DatabaseConfig datastore.MysqlConnectionParameters

	CookieStore *sessions.CookieStore
}
