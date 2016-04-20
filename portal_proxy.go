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

	UAATokenMapMut sync.RWMutex
	UAATokenMap    map[string]tokenRecord

	CNSITokenMapMut sync.RWMutex
	CNSITokenMap    map[string]tokenRecord

	CNSIMut sync.RWMutex
	CNSIs   map[string]cnsiRecord
}
