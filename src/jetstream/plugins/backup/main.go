package backup

import (
	"database/sql"
	"errors"
	"net/http"

	goosedbversion "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/goose-db-version"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

// BackupRestore - Backup or restore endpoints and tokens
type BackupRestore struct {
	portalProxy interfaces.PortalProxy
}

// Init creates a new Autoscaler
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &BackupRestore{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (br *BackupRestore) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (br *BackupRestore) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (br *BackupRestore) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return br, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (br *BackupRestore) AddAdminGroupRoutes(echoGroup *echo.Group) {
	echoGroup.POST("/endpoints/backup", br.backupEndpoints)
	echoGroup.POST("/endpoints/restore", br.restoreEndpoints)
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (br *BackupRestore) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// Init performs plugin initialization
func (br *BackupRestore) Init() error {
	return nil
}

func (br *BackupRestore) backupEndpoints(c echo.Context) error {
	log.Debug("backupEndpoints")

	userID, err := br.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	version, err := getDBVersion(br.portalProxy.GetDatabaseConnection())
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadGateway, "Could not find database version", "Could not find database version: %+v", err)
	}

	ctb := &cnsiTokenBackup{
		databaseConnectionPool: br.portalProxy.GetDatabaseConnection(),
		encryptionKey:          br.portalProxy.GetConfig().EncryptionKeyInBytes,
		userID:                 userID,
		dbVersion:              version,
		p:                      br.portalProxy,
	}

	return ctb.BackupEndpoints(c)
}

func (br *BackupRestore) restoreEndpoints(c echo.Context) error {
	log.Debug("restoreEndpoints")

	userID, err := br.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	version, err := getDBVersion(br.portalProxy.GetDatabaseConnection())
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadGateway, "Could not find database version", "Could not find database version: %+v", err)
	}

	ctb := &cnsiTokenBackup{
		databaseConnectionPool: br.portalProxy.GetDatabaseConnection(),
		encryptionKey:          br.portalProxy.GetConfig().EncryptionKeyInBytes,
		userID:                 userID,
		dbVersion:              version,
		p:                      br.portalProxy,
	}

	return ctb.RestoreEndpoints(c)
}

func getDBVersion(databaseConnectionPool *sql.DB) (int64, error) {
	dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(databaseConnectionPool)
	databaseVersionRec, err := dbVersionRepo.GetCurrentVersion()
	if err != nil {
		return 0, errors.New("Error trying to get current database version")
	}

	return databaseVersionRec.VersionID, nil
}
