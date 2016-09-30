package main

import (
	"crypto/tls"
	"database/sql"
	"encoding/gob"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"log/syslog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/Sirupsen/logrus/hooks/syslog"

	"github.com/antonlindstrom/pgstore"
	"github.com/hpcloud/portal-proxy/datastore"
	"github.com/hpcloud/portal-proxy/repository/tokens"
	"github.com/hpcloud/ucpconfig"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
)

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary = 10
	DEBUG           = "debug"
	INFO            = "info"
	WARN            = "warn"
	ERROR           = "error"
	FATAL           = "fatal"
	SessionExpiry   = 20 * 60 // Session cookies expire after 20 minutes
)

var appVersion string

var (
	httpClient        = http.Client{}
	httpClientSkipSSL = http.Client{}
	logger            = logrus.New()
)

func cleanup(dbc *sql.DB, ss *pgstore.PGStore) {
	logger.Info("Attempting to shut down gracefully...")
	logger.Info(`--- Closing databaseConnectionPool`)
	dbc.Close()
	logger.Info(`--- Closing sessionStore`)
	ss.Close()
	logger.Info(`--- Stopping sessionStore cleanup`)
	ss.StopCleanup(ss.Cleanup(time.Minute * 5))
	logger.Info("Graceful shut down complete")
}

func main() {
	// initially set log output to stdout to capture errors with loading portalconfig
	logger.Out = os.Stdout
	logger.Info("Proxy initialization started.")

	// Register time.Time  in gob
	gob.Register(time.Time{})

	// Load the portal configuration from env vars via ucpconfig
	var portalConfig portalConfig
	portalConfig, err := loadPortalConfig(portalConfig)
	if err != nil {
		logger.Fatal(err) // calls os.Exit(1) after logging
	}
	logger.Info("Proxy configuration loaded.")

	// Grab the Console Version from the executable
	portalConfig.ConsoleVersion = appVersion
	logger.Infof("Console Version loaded: %s", portalConfig.ConsoleVersion)

	// Initialize the HTTP client
	initializeHTTPClients(time.Duration(portalConfig.HTTPClientTimeoutInSecs) * time.Second)
	logger.Info("HTTP client initialized.")

	// Get the encryption key we need for tokens in the database
	portalConfig.EncryptionKeyInBytes, err = getEncryptionKey(portalConfig)
	if err != nil {
		logger.Fatal(err)
	}
	logger.Info("Encryption key set.")

	if portalConfig.HCPFlightRecorderHost != "" && portalConfig.HCPFlightRecorderPort != "" {
		hook, err := logrus_syslog.NewSyslogHook("tcp", portalConfig.HCPFlightRecorderHost+":"+portalConfig.HCPFlightRecorderPort, syslog.LOG_INFO, "portal-proxy")
		if err != nil {
			logger.Error("Unable to connect to Flight Recorder")
		} else {
			logger.Hooks.Add(hook)
			logger.Info("Connected to Flight Recorder")
		}
	} else {
		logger.Info("Flight recorder endpoint not set.")
	}

	portalConfig.VCSClientMap, portalConfig.VCSClientSkipSSLMap, err = getVCSClients(portalConfig)
	if err != nil {
		logger.Error("Error parsing VCS clients")
	} else {
		logger.Info("VCS Clients loaded.")
	}

	// Establish a Postgresql connection pool
	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = initConnPool()
	if err != nil {
		logger.Fatal(err.Error())
	}
	defer func() {
		logger.Info(`--- Closing databaseConnectionPool`)
		databaseConnectionPool.Close()
	}()
	logger.Info("Proxy database connection pool created.")

	// Initialize the Postgres backed session store for Gorilla sessions
	sessionStore, err := initSessionStore(databaseConnectionPool, portalConfig)
	if err != nil {
		logger.Fatal(err)
	}

	sessionStore.Options.MaxAge = SessionExpiry

	defer func() {
		logger.Info(`--- Closing sessionStore`)
		sessionStore.Close()
	}()

	// Ensure the cleanup tick starts now (this will delete expired sessions from the DB)
	quitCleanup, doneCleanup := sessionStore.Cleanup(time.Minute * 3)
	defer func() {
		logger.Info(`--- Setting up sessionStore cleanup`)
		sessionStore.StopCleanup(quitCleanup, doneCleanup)
	}()
	logger.Info("Proxy session store initialized.")

	// Setup the global interface for the proxy
	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool, sessionStore)
	logger.Info("Proxy initialization complete.")

	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		cleanup(databaseConnectionPool, sessionStore)
		os.Exit(1)
	}()

	// Start the proxy
	if err := start(portalProxy); err != nil {
		logger.Fatalf("Unable to start the proxy: %v", err)
	}
}

func getEncryptionKey(pc portalConfig) ([]byte, error) {
	logger.Debug("getEncryptionKey")

	// If it exists in "EncryptionKey" we must be in compose; use it.
	if len(pc.EncryptionKey) > 0 {
		key32bytes, err := hex.DecodeString(string(pc.EncryptionKey))
		if err != nil {
			logger.Error(err)
		}

		return key32bytes, nil
	}

	// Read the key from the shared volume
	key, err := tokens.ReadKey(pc.EncryptionKeyVolume, pc.EncryptionKeyFilename)
	if err != nil {
		logger.Errorf("Unable to read the encryption key from the shared volume: %v", err)
		return nil, err
	}

	return key, nil
}

func initConnPool() (*sql.DB, error) {
	logger.Debug("initConnPool")

	// load up postgresql database configuration
	var dc datastore.DatabaseConfig
	dc, err := loadDatabaseConfig(dc)
	if err != nil {
		return nil, err
	}

	// initialize the database connection pool
	var pool *sql.DB
	pool, err = datastore.GetConnection(dc)
	if err != nil {
		return nil, err
	}

	// Ensure Postgres is responsive
	for {

		// establish an outer timeout boundary
		timeout := time.Now().Add(time.Minute * TimeoutBoundary)

		// Ping Postgres
		err = datastore.Ping(pool)
		if err == nil {
			logger.Info("Database appears to now be available.")
			break
		}

		// If our timeout boundary has been exceeded, bail out
		if timeout.Sub(time.Now()) < 0 {
			return nil, fmt.Errorf("Timeout boundary of %d minutes has been exceeded. Exiting.", TimeoutBoundary)
		}

		// Circle back and try again
		logger.Infof("Waiting for Postgres to be responsive: %+v\n", err)
		time.Sleep(time.Second)
	}

	return pool, nil
}

func initSessionStore(db *sql.DB, pc portalConfig) (*pgstore.PGStore, error) {
	logger.Debug("initSessionStore")
	store, err := pgstore.NewPGStoreFromPool(db, []byte(pc.SessionStoreSecret))
	if err != nil {
		return nil, err
	}

	return store, nil
}

func loadPortalConfig(pc portalConfig) (portalConfig, error) {
	logger.Debug("loadPortalConfig")
	if err := ucpconfig.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load portal configuration. %v", err)
	}
	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig) (datastore.DatabaseConfig, error) {
	logger.Debug("loadDatabaseConfig")
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
	logger.Debug("createTempCertFiles")
	certFilename := "pproxy.crt"
	certKeyFilename := "pproxy.key"

	// If there's a developer cert/key, use that instead of using what's in the
	// config. This is to bypass an issue with docker-compose not being able to
	// handle multi-line variables in an env_file
	devCertsDir := "dev-certs/"
	_, errDevcert := os.Stat(devCertsDir + certFilename)
	_, errDevkey := os.Stat(devCertsDir + certKeyFilename)
	if errDevcert == nil && errDevkey == nil {
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

func newPortalProxy(pc portalConfig, dcp *sql.DB, ss *pgstore.PGStore) *portalProxy {
	logger.Debug("newPortalProxy")
	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
	}

	return pp
}

func initializeHTTPClients(timeoutInSeconds time.Duration) {
	logger.Debug("initializeHTTPClients")
	tr := &http.Transport{Proxy: http.ProxyFromEnvironment}
	tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: false}
	httpClient.Transport = tr
	httpClient.Timeout = time.Second * timeoutInSeconds

	trSkipSSL := &http.Transport{Proxy: http.ProxyFromEnvironment}
	trSkipSSL.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	httpClientSkipSSL.Transport = trSkipSSL
	httpClientSkipSSL.Timeout = time.Second * timeoutInSeconds

}

func start(p *portalProxy) error {
	logger.Debug("start")
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
	e.Use(retryAfterUpgradeMiddleware)

	p.registerRoutes(e)

	certFile, certKeyFile, err := createTempCertFiles(p.Config)
	if err != nil {
		return err
	}

	engine := standard.WithTLS(p.Config.TLSAddress, certFile, certKeyFile)
	e.Run(engine)

	return nil
}

func (p *portalProxy) registerRoutes(e *echo.Echo) {
	logger.Debug("registerRoutes")

	e.POST("/v1/auth/login/uaa", p.loginToUAA)
	e.POST("/v1/auth/logout", p.logout)

	// Version info
	e.GET("/v1/version", p.getVersions)

	// All routes in the session group need the user to be authenticated
	sessionGroup := e.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)

	// Connect to HCF cluster
	sessionGroup.POST("/auth/login/cnsi", p.loginToCNSI)

	// Verify credentials for HCF cluster
	sessionGroup.POST("/auth/login/cnsi/verify", p.verifyLoginToCNSI)

	// Disconnect HCF cluster
	sessionGroup.POST("/auth/logout/cnsi", p.logoutOfCNSI)

	// Verify Session
	sessionGroup.GET("/auth/session/verify", p.verifySession)

	// CNSI operations
	sessionGroup.GET("/cnsis", p.listCNSIs)
	sessionGroup.GET("/cnsis/registered", p.listRegisteredCNSIs)

	// Applications Log Streams
	sessionGroup.GET("/:cnsiGuid/apps/:appGuid/stream", p.appStream)

	// Stackato info
	sessionGroup.GET("/stackato/info", p.stackatoInfo)

	// VCS Requests
	vcsGroup := sessionGroup.Group("/vcs")

	// Initiate OAuth flow against VCS on behalf of a user
	vcsGroup.GET("/oauth/auth", p.handleVCSAuth)

	// VCS OAuth callback/response
	vcsGroup.GET("/oauth/callback", p.handleVCSAuthCallback)

	// List VCS clients
	vcsGroup.GET("/clients", p.listVCSClients)

	// Verify existence of VCS token in Session
	vcsGroup.GET("/oauth/verify", p.verifyVCSOAuthToken)

	// Proxy the rest to VCS API
	vcsGroup.Any("/*", p.vcsProxy)

	// This is used for passthru of HCF/HCE requests
	group := sessionGroup.Group("/proxy")
	group.Any("/*", p.proxy)

	// The admin-only routes need to be last as the admin middleware will be
	// applied to any routes below it's instantiation
	adminGroup := sessionGroup
	adminGroup.Use(p.stackatoAdminMiddleware)
	// Register clusters
	adminGroup.POST("/register/hcf", p.registerHCFCluster)
	adminGroup.POST("/register/hce", p.registerHCECluster)

	// TODO(wchrisjohnson): revisit the API and fix these wonky calls.  https://jira.hpcloud.net/browse/TEAMFOUR-620
	adminGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)
}
