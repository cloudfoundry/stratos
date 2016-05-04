package main

import (
	"sync"

	"github.com/gorilla/sessions"

	mysql "portal-proxy/mysql"
	// tokens "portal-proxy/repository/tokens"
)

type cnsiType string

const (
	cnsiHCF cnsiType = "hcf"
	cnsiHCE cnsiType = "hce"
)

type tokenType string

const (
	tokenUAA tokenType = "uaa"
	tokenCNSI	tokenType = "cnsi"
)

type portalProxy struct {
	Config      		portalConfig
	DatabaseConfig	mysql.MysqlConnectionParameters

	CookieStore 		*sessions.CookieStore

	// UAATokenMapMut sync.RWMutex
	// UAATokenMap    map[string]tokenRecord

	// CNSITokenMapMut sync.RWMutex
	// CNSITokenMap    map[string]tokens.TokenRecord

	CNSIMut sync.RWMutex
	CNSIs   map[string]cnsiRecord
}
