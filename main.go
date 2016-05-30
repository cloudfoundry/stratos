package main

import (
	"crypto/tls"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	"github.com/hpcloud/portal-proxy/datastore"
	"github.com/hpcloud/ucpconfig"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
)

var (
	httpClient = http.Client{}
)

func main() {
	log.SetOutput(os.Stdout)

	var portalConfig portalConfig
	portalConfig, err := loadPortalConfig(portalConfig)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	var databaseConfig datastore.DatabaseConfig
	databaseConfig, err = loadDatabaseConfig(databaseConfig)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = datastore.GetConnection(databaseConfig)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer databaseConnectionPool.Close()

	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool)

	initializeHTTPClient(portalConfig.SkipTLSVerification,
		time.Duration(portalConfig.HTTPClientTimeoutInSecs)*time.Second)

	if err := start(portalProxy); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func loadPortalConfig(pc portalConfig) (portalConfig, error) {
	if err := ucpconfig.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load portal configuration. %v", err)
	}
	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig) (datastore.DatabaseConfig, error) {
	if err := ucpconfig.Load(&dc); err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}

	dc, err := datastore.NewDatabaseConnectionParametersFromConfig(dc)
	if err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}
	return dc, nil
}

func createTempCertFiles(pc portalConfig) (string, string, error) {
	certFilename := "pproxy.crt"
	certKeyFilename := "pproxy.key"

	// If there's a developer cert/key, use that instead of using what's in the
	// config. This is to bypass an issue with docker-compose not being able to
	// handle multi-line variables in an env_file
	devCertsDir := "dev-certs/"
	_, err_devcert := os.Stat(devCertsDir + certFilename)
	_, err_devkey := os.Stat(devCertsDir + certKeyFilename)
	if err_devcert == nil && err_devkey == nil {
		return devCertsDir + certFilename, devCertsDir + certKeyFilename, nil
	}

	err := ioutil.WriteFile(certFilename, []byte(pc.TLSCert), 0600)
	if err != nil {
		return "", "", err
	}

	err = ioutil.WriteFile(certKeyFilename, []byte(pc.TLSCertKey), 0600)
	if err != nil {
		return "", "", err
	}
	return certFilename, certKeyFilename, nil
}

func newPortalProxy(pc portalConfig, dcp *sql.DB) *portalProxy {
	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
	}

	return pp
}

func initializeHTTPClient(skipCertVerification bool, timeoutInSeconds time.Duration) {
	tr := &http.Transport{}
	if skipCertVerification {
		tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	httpClient.Transport = tr
	httpClient.Timeout = time.Second * timeoutInSeconds
}

func start(p *portalProxy) error {
	e := echo.New()
	// Root level middleware
	e.Use(sessionCleanupMiddleware)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     p.Config.AllowedOrigins,
		AllowMethods:     []string{echo.GET, echo.PUT, echo.POST, echo.DELETE},
		AllowCredentials: true,
	}))
	e.Use(errorLoggingMiddleware)

	p.initCookieStore()
	p.registerRoutes(e)

	certFile, certKeyFile, err := createTempCertFiles(p.Config)
	if err != nil {
		return err
	}

	engine := standard.WithTLS(p.Config.TLSAddress, certFile, certKeyFile)
	e.Run(engine)

	return nil
}

func (p *portalProxy) initCookieStore() {
	p.CookieStore = sessions.NewCookieStore([]byte(p.Config.CookieStoreSecret))
}

func (p *portalProxy) registerRoutes(e *echo.Echo) {

	// TODO(wchrisjohnson): remove prior to shipping
	e.Static("/*", "demo")

	e.Post("/v1/auth/login/uaa", p.loginToUAA)
	e.Post("/v1/auth/logout", p.logout)

	sessionGroup := e.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)
	sessionGroup.Post("/auth/login/cnsi", p.loginToCNSI)
	sessionGroup.Post("/register/hcf", p.registerHCFCluster)
	sessionGroup.Get("/cnsis/:user_guid", p.listRegisteredClusters)
	sessionGroup.Get("/cnsis", p.listRegisteredCNSIs)
	group := sessionGroup.Group("/proxy")
	group.Get("/*", p.proxy)
}
