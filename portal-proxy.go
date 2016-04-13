package main

import (
	"sync"

	"github.com/gorilla/sessions"
)

type portalProxy struct {
	Config      portalConfig
	CookieStore *sessions.CookieStore

	TokenMapMut sync.Mutex
	TokenMap    map[string]tokenRecord

	CNSIMut sync.Mutex
	CNSIs   map[string]cnsiRecord
}

type tokenRecord struct {
	UserGUID     string
	CNSIID       string
	AuthToken    string
	RefreshToken string
	TokenExpiry  int
}

type cnsiRecord struct {
	APIEndpoint           string
	AuthorizationEndpoint string
	TokenEndpoint         string
	CNSIType              cnsiType
}

type cnsiType string

const (
	cnsiHCF cnsiType = "hcf"
	cnsiHCE cnsiType = "hce"
)
