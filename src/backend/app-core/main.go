package main

import (
	"crypto/sha1"
	"crypto/tls"
	"database/sql"
	"encoding/gob"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/antonlindstrom/pgstore"
	"github.com/gorilla/sessions"
	"github.com/irfanhabib/mysqlstore"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
	"github.com/nwmac/sqlitestore"

	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/datastore"
	"github.com/SUSE/stratos-ui/repository/cnsis"
	"github.com/SUSE/stratos-ui/repository/console_config"
	"github.com/SUSE/stratos-ui/repository/crypto"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/SUSE/stratos-ui/repository/tokens"
)

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary     = 10
	SessionExpiry       = 20 * 60 // Session cookies expire after 20 minutes
	UpgradeVolume       = "UPGRADE_VOLUME"
	UpgradeLockFileName = "UPGRADE_LOCK_FILENAME"
	VCapApplication     = "VCAP_APPLICATION"
)

var appVersion string

var (
	// Standard clients
	httpClient        = http.Client{}
	httpClientSkipSSL = http.Client{}
	// Clients to use typically for mutating operations - typically allow a longer request timeout
	httpClientMutating        = http.Client{}
	httpClientMutatingSkipSSL = http.Client{}
)

func cleanup(dbc *sql.DB, ss HttpSessionStore) {
	// Print a newline - if you pressed CTRL+C, the alighment will be slightly out, so start a new line first
	fmt.Println()
	log.Info("Attempting to shut down gracefully...")
	log.Info(`... Closing databaseConnectionPool`)
	dbc.Close()
	log.Info(`... Closing sessionStore`)
	ss.Close()
	log.Info(`.. Stopping sessionStore cleanup`)
	ss.StopCleanup(ss.Cleanup(time.Minute * 5))
	log.Info("Graceful shut down complete")
}

func main() {
	log.SetFormatter(&log.TextFormatter{ForceColors: true, FullTimestamp: true, TimestampFormat: time.UnixDate})
	log.SetOutput(os.Stdout)

	log.Info("========================================")
	log.Info("=== Stratos Jetstream Backend Server ===")
	log.Info("========================================")
	log.Info("")
	log.Info("Initialization started.")

	// Register time.Time in gob
	gob.Register(time.Time{})

	// Check to see if we are running as the database migrator
	if migrateDatabase() {
		// End execution
		return
	}

	// Load the portal configuration from env vars
	var portalConfig interfaces.PortalConfig
	portalConfig, err := loadPortalConfig(portalConfig)
	if err != nil {
		log.Fatal(err) // calls os.Exit(1) after logging
	}
	if portalConfig.LogLevel != "" {
		log.Infof("Setting log level to: %s", portalConfig.LogLevel)
		level, _ := log.ParseLevel(portalConfig.LogLevel)
		log.SetLevel(level)
	}

	log.Info("Configuration loaded.")
	isUpgrading := isConsoleUpgrading()

	if isUpgrading {
		start(portalConfig, &portalProxy{}, &setupMiddleware{}, true)
	}
	// Grab the Console Version from the executable
	portalConfig.ConsoleVersion = appVersion
	log.Infof("Stratos Version: %s", portalConfig.ConsoleVersion)

	// Initialize the HTTP client
	initializeHTTPClients(portalConfig.HTTPClientTimeoutInSecs, portalConfig.HTTPClientTimeoutMutatingInSecs, portalConfig.HTTPConnectionTimeoutInSecs)
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
	console_config.InitRepositoryProvider(dc.DatabaseProvider)

	// Establish a Postgresql connection pool
	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = initConnPool(dc)
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		log.Info(`... Closing database connection pool`)
		databaseConnectionPool.Close()
	}()
	log.Info("Database connection pool created.")

	// Initialize session store for Gorilla sessions
	sessionStore, sessionStoreOptions, err := initSessionStore(databaseConnectionPool, dc.DatabaseProvider, portalConfig, SessionExpiry)
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		log.Info(`... Closing session store`)
		sessionStore.Close()
	}()

	// Ensure the cleanup tick starts now (this will delete expired sessions from the DB)
	quitCleanup, doneCleanup := sessionStore.Cleanup(time.Minute * 3)
	defer func() {
		log.Info(`... Cleaning up session store`)
		sessionStore.StopCleanup(quitCleanup, doneCleanup)
	}()
	log.Info("Session store initialized.")

	// Setup the global interface for the proxy
	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool, sessionStore, sessionStoreOptions)
	log.Info("Initialization complete.")

	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		cleanup(databaseConnectionPool, sessionStore)
		os.Exit(1)
	}()

	// Initialise configuration
	addSetupMiddleware, err := initialiseConsoleConfiguration(portalProxy)
	if err != nil {
		log.Infof("Failed to initialise console config due to: %s", err)
		return
	}

	// Initialise Plugins
	portalProxy.loadPlugins()

	// Initialise general plugins
	for _, plugin := range portalProxy.Plugins {
		plugin.Init()
	}

	log.Info("Plugins initialized")

	// Start the back-end
	if err := start(portalProxy.Config, portalProxy, addSetupMiddleware, false); err != nil {
		log.Fatalf("Unable to start: %v", err)
	}
	log.Info("Unable to start Stratos JetStream backend")

}
func initialiseConsoleConfiguration(portalProxy *portalProxy) (*setupMiddleware, error) {

	addSetupMiddleware := new(setupMiddleware)
	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(portalProxy.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Unable to intialise Stratos backend config due to: %+v", err)
		return addSetupMiddleware, err
	}
	isInitialised, err := consoleRepo.IsInitialised()

	if err != nil || !isInitialised {
		// Exception occurred when trying to determine
		// if its initialised or instance isn't initialised,
		// will attempt to initialise it from the env vars.

		consoleConfig, err := portalProxy.initialiseConsoleConfig(consoleRepo)
		if err != nil {
			log.Warnf("Failed to initialise Stratos config due to: %+v", err)

			addSetupMiddleware.addSetup = true
			addSetupMiddleware.consoleRepo = consoleRepo
			log.Info("Will add `setup` route and middleware")

		} else {
			showStratosConfig(consoleConfig)
			portalProxy.Config.ConsoleConfig = consoleConfig
		}

	} else if err == nil && isInitialised {
		consoleConfig, err := consoleRepo.GetConsoleConfig()
		if err != nil {
			log.Infof("Instance is initialised, but console_config table may contain junk data! %+v", err)
		}
		showStratosConfig(consoleConfig)
		portalProxy.Config.ConsoleConfig = consoleConfig
	}

	return addSetupMiddleware, nil
}

func showStratosConfig(config *interfaces.ConsoleConfig) {
	log.Infof("Stratos is intialised with the following setup:")
	log.Infof("... UAA Endpoint        : %s", config.UAAEndpoint)
	log.Infof("... Console Client      : %s", config.ConsoleClient)
	log.Infof("... Skip SSL Validation : %t", config.SkipSSLValidation)
	log.Infof("... Setup Complete      : %t", config.IsSetupComplete)
	log.Infof("... Admin Scope         : %s", config.ConsoleAdminScope)
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
			return nil, fmt.Errorf("timeout boundary of %d minutes has been exceeded. Exiting", TimeoutBoundary)
		}

		// Circle back and try again
		log.Infof("Waiting for database to be responsive: %+v", err)
		time.Sleep(time.Second)
	}

	return pool, nil
}

func initSessionStore(db *sql.DB, databaseProvider string, pc interfaces.PortalConfig, sessionExpiry int) (HttpSessionStore, *sessions.Options, error) {
	log.Debug("initSessionStore")

	sessionsTable := "sessions"
	setSecureCookie := true

	if config.IsSet(VCapApplication) {
		setSecureCookie = false
	}

	// Allow the cookie domain to be configured
	domain := pc.CookieDomain
	if domain == "-" {
		domain = ""
	}

	log.Infof("Session Cookie Domain: %s", domain)

	// Store depends on the DB Type
	if databaseProvider == datastore.PGSQL {
		log.Info("Creating Postgres session store")
		sessionStore, err := pgstore.NewPGStoreFromPool(db, []byte(pc.SessionStoreSecret))
		// Setup cookie-store options
		sessionStore.Options.MaxAge = sessionExpiry
		sessionStore.Options.HttpOnly = true
		sessionStore.Options.Secure = setSecureCookie
		if len(domain) > 0 {
			sessionStore.Options.Domain = domain
		}
		return sessionStore, sessionStore.Options, err
	}
	// Store depends on the DB Type
	if databaseProvider == datastore.MYSQL {
		log.Info("Creating MySQL session store")
		sessionStore, err := mysqlstore.NewMySQLStoreFromConnection(db, sessionsTable, "/", 3600, []byte(pc.SessionStoreSecret))
		// Setup cookie-store options
		sessionStore.Options.MaxAge = sessionExpiry
		sessionStore.Options.HttpOnly = true
		sessionStore.Options.Secure = setSecureCookie
		if len(domain) > 0 {
			sessionStore.Options.Domain = domain
		}
		return sessionStore, sessionStore.Options, err
	}

	log.Info("Creating SQLite session store")
	sessionStore, err := sqlitestore.NewSqliteStoreFromConnection(db, sessionsTable, "/", 3600, []byte(pc.SessionStoreSecret))
	// Setup cookie-store options
	sessionStore.Options.MaxAge = sessionExpiry
	sessionStore.Options.HttpOnly = true
	sessionStore.Options.Secure = setSecureCookie
	if len(domain) > 0 {
		sessionStore.Options.Domain = domain
	}
	return sessionStore, sessionStore.Options, err
}

func loadPortalConfig(pc interfaces.PortalConfig) (interfaces.PortalConfig, error) {
	log.Debug("loadPortalConfig")

	config.LoadConfigFile("./config.properties")

	if err := config.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load configuration. %v", err)
	}

	// Add custom properties
	pc.CFAdminIdentifier = CFAdminIdentifier
	pc.HTTPS = true
	pc.PluginConfig = make(map[string]string)

	// Default to standard timeout if the mutating one is not configured
	if pc.HTTPClientTimeoutMutatingInSecs == 0 {
		pc.HTTPClientTimeoutMutatingInSecs = pc.HTTPClientTimeoutInSecs
	}

	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig) (datastore.DatabaseConfig, error) {
	log.Debug("loadDatabaseConfig")

	parsedDBConfig, err := datastore.ParseCFEnvs(&dc)
	if err != nil {
		return dc, errors.New("Could not parse Cloud Foundry Services environment")
	}

	if parsedDBConfig {
		log.Info("Using Cloud Foundry DB service")
	} else if err := config.Load(&dc); err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}

	dc, err = datastore.NewDatabaseConnectionParametersFromConfig(dc)
	if err != nil {
		return dc, fmt.Errorf("Unable to load database configuration. %v", err)
	}

	return dc, nil
}

func detectTLSCert(pc interfaces.PortalConfig) (string, string, error) {
	log.Debug("detectTLSCert")
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

	// Check if certificate have been provided as files (as is the case in kubernetes)
	if pc.TLSCertPath != "" && pc.TLSCertKeyPath != "" {
		log.Infof("Using TLS cert: %s, %s", pc.TLSCertPath, pc.TLSCertKeyPath)
		_, errCertMissing := os.Stat(pc.TLSCertPath)
		_, errCertKeyMissing := os.Stat(pc.TLSCertKeyPath)
		if errCertMissing != nil || errCertKeyMissing != nil {
			return "", "", fmt.Errorf("unable to find certificate %s or certificate key %s", pc.TLSCertPath, pc.TLSCertKeyPath)
		}
		return pc.TLSCertPath, pc.TLSCertKeyPath, nil
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

func newPortalProxy(pc interfaces.PortalConfig, dcp *sql.DB, ss HttpSessionStore, sessionStoreOptions *sessions.Options) *portalProxy {
	log.Debug("newPortalProxy")

	// Generate cookie name - avoids issues if the cookie domain is changed
	cookieName := jetstreamSessionName
	domain := pc.CookieDomain
	if len(domain) > 0 && domain != "-" {
		h := sha1.New()
		io.WriteString(h, domain)
		hash := fmt.Sprintf("%x", h.Sum(nil))
		cookieName = fmt.Sprintf("%s-%s", jetstreamSessionName, hash[0:10])
	}

	log.Infof("Session Cookie name: %s", cookieName)

	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
		SessionStoreOptions:    sessionStoreOptions,
		SessionCookieName:      cookieName,
		EmptyCookieMatcher:     regexp.MustCompile(cookieName + "=(?:;[ ]*|$)"),
	}

	// Get Diagnostics and store them once
	pp.StoreDiagnostics()

	return pp
}

func initializeHTTPClients(timeout int64, timeoutMutating int64, connectionTimeout int64) {
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

	// Clients with longer timeouts (use for mutating operations)
	httpClientMutating.Transport = tr
	httpClientMutating.Timeout = time.Duration(timeoutMutating) * time.Second
	httpClientMutatingSkipSSL.Transport = trSkipSSL
	httpClientMutatingSkipSSL.Timeout = time.Duration(timeoutMutating) * time.Second
}

func start(config interfaces.PortalConfig, p *portalProxy, addSetupMiddleware *setupMiddleware, isUpgrade bool) error {
	log.Debug("start")
	e := echo.New()

	// Root level middleware
	if !isUpgrade {
		e.Use(sessionCleanupMiddleware)
	}
	customLoggerConfig := middleware.LoggerConfig{
		Format: `Request: [${time_rfc3339}] Remote-IP:"${remote_ip}" ` +
			`Method:"${method}" Path:"${path}" Status:${status} Latency:${latency_human} ` +
			`Bytes-In:${bytes_in} Bytes-Out:${bytes_out}` + "\n",
	}
	e.Use(middleware.LoggerWithConfig(customLoggerConfig))
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     config.AllowedOrigins,
		AllowMethods:     []string{echo.GET, echo.PUT, echo.POST, echo.DELETE},
		AllowCredentials: true,
	}))
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XFrameOptions: "DENY",
	}))

	if !isUpgrade {
		e.Use(errorLoggingMiddleware)
	}
	e.Use(retryAfterUpgradeMiddleware)

	if !isUpgrade {
		p.registerRoutes(e, addSetupMiddleware)
	}

	var engine *standard.Server
	address := config.TLSAddress
	if config.HTTPS {
		certFile, certKeyFile, err := detectTLSCert(config)
		if err != nil {
			return err
		}
		log.Infof("Starting HTTPS Server at address: %s", address)
		engine = standard.WithTLS(address, certFile, certKeyFile)

	} else {
		log.Infof("Starting HTTP Server at address: %s", address)
		engine = standard.New(address)
	}

	if isUpgrade {
		go stopEchoWhenUpgraded(engine)
	}

	engineErr := e.Run(engine)
	if engineErr != nil {
		engineErrStr := fmt.Sprintf("%s", engineErr)
		if !strings.Contains(engineErrStr, "Server closed") {
			log.Warnf("Failed to start HTTP/S server", engineErr)
		}
	}

	return nil
}

func (p *portalProxy) GetEndpointTypeSpec(typeName string) (interfaces.EndpointPlugin, error) {

	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}
		endpointType := endpointPlugin.GetType()

		if endpointType == typeName {
			return endpointPlugin, nil
		}
	}

	return nil, errors.New("Endpoint type plugin not loaded")
}

func (p *portalProxy) GetHttpClient(skipSSLValidation bool) http.Client {
	return p.getHttpClient(skipSSLValidation, false)
}

func (p *portalProxy) GetHttpClientForRequest(req *http.Request, skipSSLValidation bool) http.Client {
	isMutating := req.Method != "GET" && req.Method != "HEAD"
	return p.getHttpClient(skipSSLValidation, isMutating)
}

func (p *portalProxy) getHttpClient(skipSSLValidation bool, mutating bool) http.Client {
	var client http.Client
	if !mutating {
		if skipSSLValidation {
			client = httpClientSkipSSL
		} else {
			client = httpClient
		}
	} else {
		if skipSSLValidation {
			client = httpClientMutatingSkipSSL
		} else {
			client = httpClientMutating
		}
	}
	return client
}

func (p *portalProxy) registerRoutes(e *echo.Echo, addSetupMiddleware *setupMiddleware) {
	log.Debug("registerRoutes")

	for _, plugin := range p.Plugins {
		middlewarePlugin, err := plugin.GetMiddlewarePlugin()
		if err != nil {
			// Plugin doesn't implement an middleware Plugin interface, skip
			continue
		}
		e.Use(middlewarePlugin.EchoMiddleware)
	}

	// Allow the backend to run under /pp if running combined
	var pp *echo.Group
	staticDir, err := getStaticFiles()
	if err == nil {
		pp = e.Group("/pp")
	} else {
		pp = e.Group("")
	}

	// Add middleware to block requests if unconfigured
	if addSetupMiddleware.addSetup {
		go p.SetupPoller(addSetupMiddleware)
		e.Use(p.SetupMiddleware(addSetupMiddleware))
		pp.POST("/v1/setup", p.setupConsole)
		pp.POST("/v1/setup/update", p.setupConsoleUpdate)
	}

	pp.POST("/v1/auth/login/uaa", p.loginToUAA)
	pp.POST("/v1/auth/logout", p.logout)

	pp.GET("/v1/auth/sso_login", p.initSSOlogin)
	pp.GET("/v1/auth/sso_login_callback", p.loginToUAA)

	// Version info
	pp.GET("/v1/version", p.getVersions)

	// All routes in the session group need the user to be authenticated
	sessionGroup := pp.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)
	sessionGroup.Use(p.xsrfMiddleware)

	for _, plugin := range p.Plugins {
		middlewarePlugin, err := plugin.GetMiddlewarePlugin()
		if err != nil {
			// Plugin doesn't implement an middleware Plugin interface, skip
			continue
		}
		e.Use(middlewarePlugin.SessionEchoMiddleware)
	}

	// Connect to CF cluster
	sessionGroup.POST("/auth/login/cnsi", p.loginToCNSI)

	// Disconnect CF cluster
	sessionGroup.POST("/auth/logout/cnsi", p.logoutOfCNSI)

	// Verify Session
	sessionGroup.GET("/auth/session/verify", p.verifySession)

	// CNSI operations
	sessionGroup.GET("/cnsis", p.listCNSIs)
	sessionGroup.GET("/cnsis/registered", p.listRegisteredCNSIs)

	// Info
	sessionGroup.GET("/info", p.info)

	for _, plugin := range p.Plugins {
		routePlugin, err := plugin.GetRoutePlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}
		routePlugin.AddSessionGroupRoutes(sessionGroup)
	}

	// This is used for passthru of requests
	group := sessionGroup.Group("/proxy")
	group.Any("/*", p.proxy)

	// The admin-only routes need to be last as the admin middleware will be
	// applied to any routes below it's instantiation
	adminGroup := sessionGroup
	adminGroup.Use(p.adminMiddleware)

	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		endpointType := endpointPlugin.GetType()
		adminGroup.POST("/register/"+endpointType, endpointPlugin.Register)

		routePlugin, err := plugin.GetRoutePlugin()
		if err == nil {
			routePlugin.AddAdminGroupRoutes(adminGroup)
		}

	}

	adminGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)

	// Serve up static resources
	if err == nil {
		log.Debug("Add URL Check Middleware")
		e.Use(p.urlCheckMiddleware)
		e.Static("/", staticDir)
		e.SetHTTPErrorHandler(getUICustomHTTPErrorHandler(staticDir, e.DefaultHTTPErrorHandler))
		log.Info("Serving static UI resources")
	}

}

// Custom error handler to let Angular app handle application URLs (catches non-backend 404 errors)
func getUICustomHTTPErrorHandler(staticDir string, defaultHandler echo.HTTPErrorHandler) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
		}

		// If this was not a back-end request and the error code is 404, serve the app and let it route
		if strings.Index(c.Request().URI(), "/pp") != 0 && code == 404 {
			c.File(path.Join(staticDir, "index.html"))
		}

		// Let the default handler handle it
		defaultHandler(err, c)
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

func isConsoleUpgrading() bool {

	upgradeVolume, noUpgradeVolumeErr := config.GetValue(UpgradeVolume)
	upgradeLockFile, noUpgradeLockFileNameErr := config.GetValue(UpgradeLockFileName)

	// If any of those properties are not set, consider Console is running in a non-upgradeable environment
	if noUpgradeVolumeErr != nil || noUpgradeLockFileNameErr != nil {
		return false
	}

	upgradeLockPath := fmt.Sprintf("/%s/%s", upgradeVolume, upgradeLockFile)
	if string(upgradeVolume[0]) == "/" {
		upgradeLockPath = fmt.Sprintf("%s/%s", upgradeVolume, upgradeLockFile)
	}

	if _, err := os.Stat(upgradeLockPath); err == nil {
		return true
	}
	return false
}

func stopEchoWhenUpgraded(e *standard.Server) {
	for isConsoleUpgrading() {
		time.Sleep(1 * time.Second)
	}
	log.Info("Stratos upgrade has completed! Shutting down Upgrade web server instance")
	e.Close()
}
