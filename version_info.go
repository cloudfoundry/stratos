package main

import (
	"github.com/labstack/echo"
	"net/http"
	"os"
)

// Allow us to mock out os.Getenv
var osGetEnv = os.Getenv

// GetVersions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion string `json:"proxy_version"`
	DatabaseVersion string `json:"database_version"`
}

func (p *portalProxy) getVersionsData() (*Versions) {
	proxy_version := osGetEnv("CONSOLE_VERSION")
	// Default CONSOLE_VERSION to be "dev"
	if proxy_version == "" {
		proxy_version = "dev"
	}

	database_version := osGetEnv("DATABASE_VERSION")
	// Default DATABASE_VERSION to be the same as proxy_version
	if database_version == "" {
		database_version = proxy_version
	}

	resp := &Versions{
		ProxyVersion: proxy_version,
		DatabaseVersion: database_version,
	}

	return resp
}

func (p *portalProxy) getVersions(c echo.Context) error {
	return c.JSON(http.StatusOK, p.getVersionsData())
}
