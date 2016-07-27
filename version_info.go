package main

import (
	"net/http"
	"os"

	"github.com/labstack/echo"
)

// Allow us to mock out os.Getenv
var osGetEnv = os.Getenv

// Versions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion string `json:"database_version"`
}

func (p *portalProxy) getVersionsData() *Versions {
	proxyVersion := osGetEnv("CONSOLE_VERSION")
	// Default CONSOLE_VERSION to be "dev"
	if proxyVersion == "" {
		proxyVersion = "dev"
	}

	databaseVersion := osGetEnv("DATABASE_VERSION")
	// Default DATABASE_VERSION to be the same as proxy_version
	if databaseVersion == "" {
		databaseVersion = proxyVersion
	}

	resp := &Versions{
		ProxyVersion:    proxyVersion,
		DatabaseVersion: databaseVersion,
	}

	return resp
}

func (p *portalProxy) getVersions(c echo.Context) error {
	return c.JSON(http.StatusOK, p.getVersionsData())
}
