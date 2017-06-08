package main

import (
	"errors"
	"net/http"

	log "github.com/Sirupsen/logrus"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/goose-db-version"
	"github.com/labstack/echo"
)

// Versions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion int64  `json:"database_version"`
}

func (p *portalProxy) getVersionsData() (*Versions, error) {
	proxyVersion := p.Config.ConsoleVersion
	if proxyVersion == "" {
		proxyVersion = "dev"
	}

	dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
	databaseVersionRec, err := dbVersionRepo.GetCurrentVersion()
	if err != nil {
		return &Versions{}, errors.New("Error trying to get current database version")
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
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusServiceUnavailable, err.Error())
	}
	return c.JSON(http.StatusOK, v)
}
