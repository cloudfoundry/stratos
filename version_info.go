package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/labstack/echo"

	"github.com/hpcloud/portal-proxy/repository/goose-db-version"
)

// Allow us to mock out os.Getenv
var osGetEnv = os.Getenv

// Versions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion int64  `json:"database_version"`
}

func (p *portalProxy) getVersionsData() (*Versions, error) {
	proxyVersion := osGetEnv("CONSOLE_VERSION")
	// Default CONSOLE_VERSION to be "dev"
	if proxyVersion == "" {
		proxyVersion = "dev"
	}

	dbVersionRepo, err := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
	if err != nil {
		return &Versions{}, fmt.Errorf("getVersionsData: %s", err)
	}

	databaseVersionRec, _ := dbVersionRepo.GetCurrentVersion()
	if err != nil {
		return &Versions{}, fmt.Errorf("getVersionsData: %s", err)
	}

	databaseVersion := databaseVersionRec.VersionID

	resp := &Versions{
		ProxyVersion:    proxyVersion,
		DatabaseVersion: databaseVersion,
	}

	return resp, nil
}

func (p *portalProxy) getVersions(c echo.Context) error {
	v, err := p.getVersionsData()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, v)
}
