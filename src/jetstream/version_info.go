package main

import (
	"errors"
	"net/http"

	goosedbversion "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/goose-db-version"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

func (p *portalProxy) getVersionsData() (*interfaces.Versions, error) {
	proxyVersion := p.Config.ConsoleVersion
	if proxyVersion == "" {
		proxyVersion = "dev"
	}

	dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
	databaseVersionRec, err := dbVersionRepo.GetCurrentVersion()
	if err != nil {
		return &interfaces.Versions{}, errors.New("Error trying to get current database version")
	}

	databaseVersion := databaseVersionRec.VersionID

	resp := &interfaces.Versions{
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
