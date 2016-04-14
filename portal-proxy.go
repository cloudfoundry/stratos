package main

import (
	"sync"

	"github.com/gorilla/sessions"
)

type cnsiType string

const (
	cnsiHCF cnsiType = "hcf"
	cnsiHCE cnsiType = "hce"
)

type portalProxy struct {
	Config      portalConfig
	CookieStore *sessions.CookieStore

	UAATokenMapMut sync.Mutex
	UAATokenMap    map[string]tokenRecord

	CNSITokenMapMut sync.Mutex
	CNSITokenMap    map[string]tokenRecord

	CNSIMut sync.Mutex
	CNSIs   map[string]cnsiRecord
}

type tokenRecord struct {
	AuthToken    string
	RefreshToken string
	TokenExpiry  int
}

type cnsiRecord struct {
	Name                  string
	APIEndpoint           string
	AuthorizationEndpoint string
	TokenEndpoint         string
	CNSIType              cnsiType
}
