package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	goosedbversion "github.com/cloudfoundry/stratos/src/jetstream/repository/goose-db-version"
	"github.com/labstack/echo/v5"
)

func (p *portalProxy) getVersionsData() (*api.Versions, error) {
	proxyVersion := p.Config.ConsoleVersion
	if proxyVersion == "" {
		proxyVersion = "dev"
	}

	dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
	databaseVersionRec, err := dbVersionRepo.GetCurrentVersion()
	if err != nil {
		return &api.Versions{}, errors.New("Error trying to get current database version")
	}

	databaseVersion := databaseVersionRec.VersionID

	resp := &api.Versions{
		ProxyVersion:    proxyVersion,
		DatabaseVersion: databaseVersion,
		BuildDate:       buildDate,
		GitCommit:       gitCommit,
		GitBranch:       gitBranch,
	}

	return resp, nil
}

func (p *portalProxy) getVersions(c *echo.Context) error {
	v, err := p.getVersionsData()
	if err != nil {
		slog.Error("could not build the version response", "error", err)
		return echo.NewHTTPError(http.StatusServiceUnavailable, err.Error())
	}
	return c.JSON(http.StatusOK, v)
}
