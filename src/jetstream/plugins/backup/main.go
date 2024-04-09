package backup

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	goosedbversion "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/goose-db-version"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// Module init will register plugin
func init() {
	api.AddPlugin("backup", nil, Init)
}

// BackupRestore - Backup or restore endpoints and tokens
type BackupRestore struct {
	portalProxy api.PortalProxy
}

// Init creates a new backup/restore plugin
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &BackupRestore{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (br *BackupRestore) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (br *BackupRestore) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (br *BackupRestore) GetRoutePlugin() (api.RoutePlugin, error) {
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
	enabledStr := br.portalProxy.Env().String("FEATURE_ALLOW_BACKUP", "true")
	if enabled, err := strconv.ParseBool(enabledStr); err == nil && !enabled {
		return errors.New("Backup/restore feature disabled via configuration")
	}

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
		return api.NewHTTPShadowError(http.StatusBadGateway, "Could not find database version", "Could not find database version: %+v", err)
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
		return api.NewHTTPShadowError(http.StatusBadGateway, "Could not find database version", "Could not find database version: %+v", err)
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
