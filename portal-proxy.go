package main

import "github.com/gorilla/sessions"

type portalProxy struct {
	Config      portalConfig
	CookieStore *sessions.CookieStore
	TokenMap    map[string]tokenRecord
}

type tokenRecord struct {
	UserGUID     string
	CNSIID       string
	AuthToken    string
	RefreshToken string
	TokenExpiry  int
}
