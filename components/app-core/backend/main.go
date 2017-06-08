package main

import (
	"crypto/tls"
	"database/sql"
	"encoding/gob"
	"encoding/hex"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/antonlindstrom/pgstore"
	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/datastore"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/cnsis"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/crypto"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/tokens"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
	"github.com/nwmac/sqlitestore"
)

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary = 10
	SessionExpiry   = 20 * 60 // Session cookies expire after 20 minutes
)

var appVersion string

var (
	httpClient        = http.Client{}
	httpClientSkipSSL = http.Client{}
)

func cleanup(dbc *sql.DB, ss HttpSessionStore) {
	log.Info("Attempting to shut down gracefully...")
	log.Info(`--- Closing databaseConnectionPool`)
	dbc.Close()
	log.Info(`--- Closing sessionStore`)
	ss.Close()
	log.Info(`--- Stopping sessionStore cleanup`)
	ss.StopCleanup(ss.Cleanup(time.Minute * 5))
	log.Info("Graceful shut down complete")
}

func main() {
	log.SetFormatter(&log.TextFormatter{ForceColors: true, FullTimestamp: true, TimestampFormat: time.UnixDate})
	log.SetOutput(os.Stdout)
	log.Info("Initialization started.")

	// Register time.Time in gob
	gob.Register(time.Time{})

	// Load the portal configuration from env vars
	var portalConfig interfaces.PortalConfig
	portalConfig, err := loadPortalConfig(portalConfig)
	if err != nil {
		log.Fatal(err) // calls os.Exit(1) after logging
	}
	log.Info("Configuration loaded.")

	// Grab the Console Version from the executable
	portalConfig.ConsoleVersion = appVersion
	log.Infof("Console Version loaded: %s", portalConfig.ConsoleVersion)

	// Initialize the HTTP client
	initializeHTTPClients(portalConfig.HTTPClientTimeoutInSecs, portalConfig.HTTPConnectionTimeoutInSecs)
	log.Info("HTTP client initialized.")

	// Get the encryption key we need for tokens in the database
	portalConfig.EncryptionKeyInBytes, err = getEncryptionKey(portalConfig)
	if err != nil {
		log.Fatal(err)
	}
	log.Info("Encryption key set.")

	// Load database configuration
	var dc datastore.DatabaseConfig
	dc, err = loadDatabaseConfig(dc)
	if err != nil {
		log.Fatal(err)
	}

	cnsis.InitRepositoryProvider(dc.DatabaseProvider)
	tokens.InitRepositoryProvider(dc.DatabaseProvider)

	// Establish a Postgresql connection pool
	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = initConnPool(dc)
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		log.Info(`--- Closing databaseConnectionPool`)
		databaseConnectionPool.Close()
	}()
	log.Info("Proxy database connection pool created.")

	// Initialize the Postgres backed session store for Gorilla sessions
	sessionStore, err := initSessionStore(databaseConnectionPool, dc.DatabaseProvider, portalConfig, SessionExpiry)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		log.Info(`--- Closing sessionStore`)
		sessionStore.Close()
	}()

	// Ensure the cleanup tick starts now (this will delete expired sessions from the DB)
	quitCleanup, doneCleanup := sessionStore.Cleanup(time.Minute * 3)
	defer func() {
		log.Info(`--- Setting up sessionStore cleanup`)
		sessionStore.StopCleanup(quitCleanup, doneCleanup)
	}()
	log.Info("Proxy session store initialized.")

	// Setup the global interface for the proxy
	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool, sessionStore)
	log.Info("Proxy initialization complete.")

	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		cleanup(databaseConnectionPool, sessionStore)
		os.Exit(1)
	}()

	// Initialise Plugins
	portalProxy.loadPlugins()

	// Initialise general plugins
	for _, generalPlugin := range portalProxy.GeneralPlugins {
		generalPlugin.Init()
	}

	log.Info("Initialised general plugins.")

	// Start the back-end
	if err := start(portalProxy); err != nil {
		log.Fatalf("Unable to start: %v", err)
	}
	log.Info("Unable to start proxy!")

}

func getEncryptionKey(pc interfaces.PortalConfig) ([]byte, error) {
	log.Debug("getEncryptionKey")

	// If it exists in "EncryptionKey" we must be in compose; use it.
	if len(pc.EncryptionKey) > 0 {
		key32bytes, err := hex.DecodeString(string(pc.EncryptionKey))
		if err != nil {
			log.Error(err)
		}

		return key32bytes, nil
	}

	// Read the key from the shared volume
	key, err := crypto.ReadEncryptionKey(pc.EncryptionKeyVolume, pc.EncryptionKeyFilename)
	if err != nil {
		log.Errorf("Unable to read the encryption key from the shared volume: %v", err)
		return nil, err
	}

	return key, nil
}

func initConnPool(dc datastore.DatabaseConfig) (*sql.DB, error) {
	log.Debug("initConnPool")

	// initialize the database connection pool
	pool, err := datastore.GetConnection(dc)
	if err != nil {
		return nil, err
	}

	// Ensure that the database is responsive
	for {

		// establish an outer timeout boundary
		timeout := time.Now().Add(time.Minute * TimeoutBoundary)

		// Ping the database
		err = datastore.Ping(pool)
		if err == nil {
			log.Info("Database appears to now be available.")
			break
		}

		// If our timeout boundary has been exceeded, bail out
		if timeout.Sub(time.Now()) < 0 {
			return nil, fmt.Errorf("Timeout boundary of %d minutes has been exceeded. Exiting.", TimeoutBoundary)
		}

		// Circle back and try again
		log.Infof("Waiting for database to be responsive: %+v", err)
		time.Sleep(time.Second)
	}

	return pool, nil
}

func initSessionStore(db *sql.DB, databaseProvider string, pc interfaces.PortalConfig, sessionExpiry int) (HttpSessionStore, error) {
	log.Debug("initSessionStore")

	// Store depends on the DB Type
	if databaseProvider == "pgsql" {
		log.Info("Creating Postgres session store")
		sessionStore, err := pgstore.NewPGStoreFromPool(db, []byte(pc.SessionStoreSecret))
		// Setup cookie-store options
		sessionStore.Options.MaxAge = sessionExpiry
		sessionStore.Options.HttpOnly = true
		sessionStore.Options.Secure = true
		return sessionStore, err
	}

	log.Info("Creating SQLite session store")
	sessionStore, err := sqlitestore.NewSqliteStoreFromConnection(db, "sessions", "/", 3600, []byte(pc.SessionStoreSecret))
	// Setup cookie-store options
	sessionStore.Options.MaxAge = sessionExpiry
	sessionStore.Options.HttpOnly = true
	sessionStore.Options.Secure = true
	return sessionStore, err
}

func loadPortalConfig(pc interfaces.PortalConfig) (interfaces.PortalConfig, error) {
	log.Debug("loadPortalConfig")

	config.LoadConfigFile("./config.properties")

	if err := config.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load portal configuration. %v", err)
	}

	// Add custom properties
	pc.UAAAdminIdentifier = UAAAdminIdentifier
	pc.CFAdminIdentifier = CFAdminIdentifier
	pc.HTTPS = true

	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig) (datastore.DatabaseConfig, error) {
	log.Debug("loadDatabaseConfig")
	if err := config.Load(&dc); err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}

	dc, err := datastore.NewDatabaseConnectionParametersFromConfig(dc)
	if err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}

	// Determine database provider
	if len(dc.Host) > 0 {
		dc.DatabaseProvider = "pgsql"
	} else {
		dc.DatabaseProvider = "sqlite"
	}

	return dc, nil
}

func createTempCertFiles(pc interfaces.PortalConfig) (string, string, error) {
	log.Debug("createTempCertFiles")
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

func newPortalProxy(pc interfaces.PortalConfig, dcp *sql.DB, ss HttpSessionStore) *portalProxy {
	log.Debug("newPortalProxy")
	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
	}

	return pp
}

func initializeHTTPClients(timeout int64, connectionTimeout int64) {
	log.Debug("initializeHTTPClients")

	// Common KeepAlive dialer shared by both transports
	dial := (&net.Dialer{
		Timeout:   time.Duration(connectionTimeout) * time.Second,
		KeepAlive: 30 * time.Second, // should be less than any proxy connection timeout (typically 2-3 minutes)
	}).Dial

	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: false},
		MaxIdleConnsPerHost: 6, // (default is 2)
	}
	httpClient.Transport = tr
	httpClient.Timeout = time.Duration(timeout) * time.Second

	trSkipSSL := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost: 6, // (default is 2)
	}

	httpClientSkipSSL.Transport = trSkipSSL
	httpClientSkipSSL.Timeout = time.Duration(timeout) * time.Second

}

func start(p *portalProxy) error {
	log.Debug("start")
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

	if p.Config.HTTPS {
		certFile, certKeyFile, err := createTempCertFiles(p.Config)
		if err != nil {
			return err
		}

		engine := standard.WithTLS(p.Config.TLSAddress, certFile, certKeyFile)
		e.Run(engine)
	} else {
		address := p.Config.TLSAddress
		log.Infof("Starting HTTP Server at address: %s", address)
		engine := standard.New(address)
		e.Run(engine)
	}

	return nil
}

func (p *portalProxy) GetEndpointTypeSpec(typeName string) (interfaces.EndpointPlugin, error) {

	endpointSpec, ok := p.EndpointPlugins[typeName]

	if ok {
		return endpointSpec, nil
	}
	return nil, errors.New("Endpoint type plugin not loaded")
}

func (p *portalProxy) GetHttpClient(skipSSLValidation bool) http.Client {
	var client http.Client
	if skipSSLValidation {
		client = httpClientSkipSSL
	} else {
		client = httpClient
	}
	return client
}

func (p *portalProxy) registerRoutes(e *echo.Echo) {
	log.Debug("registerRoutes")

	for _, generalPlugin := range p.GeneralPlugins {
		e.Use(generalPlugin.EchoMiddleware)
	}

	// Allow the backend to run under /pp if running combined
	var pp *echo.Group
	staticDir, err := getStaticFiles()
	if err == nil {
		pp = e.Group("/pp")
	} else {
		pp = e.Group("")
	}

	pp.POST("/v1/auth/login/uaa", p.loginToUAA)
	pp.POST("/v1/auth/logout", p.logout)

	// Version info
	pp.GET("/v1/version", p.getVersions)

	// All routes in the session group need the user to be authenticated
	sessionGroup := pp.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)

	for _, generalPlugin := range p.GeneralPlugins {
		e.Use(generalPlugin.SessionEchoMiddleware)
	}

	// Connect to CF cluster
	sessionGroup.POST("/auth/login/cnsi", p.loginToCNSI)

	// Verify credentials for CF cluster
	sessionGroup.POST("/auth/login/cnsi/verify", p.verifyLoginToCNSI)

	// Disconnect CF cluster
	sessionGroup.POST("/auth/logout/cnsi", p.logoutOfCNSI)

	// Verify Session
	sessionGroup.GET("/auth/session/verify", p.verifySession)

	// CNSI operations
	sessionGroup.GET("/cnsis", p.listCNSIs)
	sessionGroup.GET("/cnsis/registered", p.listRegisteredCNSIs)

	// Info
	sessionGroup.GET("/info", p.info)

	for _, endpoint := range p.EndpointPlugins {
		endpoint.AddSessionGroupRoutes(sessionGroup)
	}

	// This is used for passthru of CF/HCE requests
	group := sessionGroup.Group("/proxy")
	group.Any("/*", p.proxy)

	// The admin-only routes need to be last as the admin middleware will be
	// applied to any routes below it's instantiation
	adminGroup := sessionGroup
	adminGroup.Use(p.adminMiddleware)

	for _, endpoint := range p.EndpointPlugins {
		endpointType := endpoint.GetType()
		adminGroup.POST("/register/" + endpointType, endpoint.Register)
		endpoint.AddAdminGroupRoutes(adminGroup)
		// Add Endpoint registration

	}

	// TODO): revisit the API and fix these wonky calls.
	adminGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)
	if err == nil {
		e.Static("/", staticDir)
		log.Info("Serving static UI resources")
	}

}

func getStaticFiles() (string, error) {
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err == nil {
		// Look for a folder named 'ui'
		_, err := os.Stat(dir + "/ui")
		if err == nil || !os.IsNotExist(err) {
			return dir + "/ui", nil
		}
	}
	return "", errors.New("UI folder not found")
}
