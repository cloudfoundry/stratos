package main

import (
	"crypto/tls"
	"database/sql"
	"encoding/gob"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/antonlindstrom/pgstore"
	"github.com/hpcloud/portal-proxy/config"
	"github.com/hpcloud/portal-proxy/datastore"
	"github.com/hpcloud/portal-proxy/repository/crypto"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
	"github.com/nwmac/sqlitestore"
)

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary  = 10
	DEBUG            = "debug"
	INFO             = "info"
	WARN             = "warn"
	ERROR            = "error"
	FATAL            = "fatal"
	SessionExpiry    = 20 * 60 // Session cookies expire after 20 minutes
	VCapApplication  = "VCAP_APPLICATION"
	CFApiURLOverride = "CF_API_URL"
	CFApiForceSecure = "CF_API_FORCE_SECURE"
)

// VCapApplicationData - Cloud Fundry VCAP APPLICATION JSON structure that we need access to
type VCapApplicationData struct {
	API           string `json:"cf_api"`
	ApplicationID string `json:"application_id"`
	SpaceID       string `json:"space_id"`
}

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
	var portalConfig portalConfig
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

	// Establish a Postgresql connection pool
	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = initConnPool()
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		log.Info(`--- Closing databaseConnectionPool`)
		databaseConnectionPool.Close()
	}()
	log.Info("Proxy database connection pool created.")

	// Initialize the Postgres backed session store for Gorilla sessions
	sessionStore, err := initSessionStore(databaseConnectionPool, portalConfig, SessionExpiry)
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

	// If needed, migrate VCSes from connected Code Engines
	go migrateVcsFromCodeEngine(portalProxy)

	// Intiialize appropriately if we are running in Cloud Foundry
	initForCloudFoundryHosting(portalProxy)

	// Start the proxy
	// Start the back-end
	if err := start(portalProxy); err != nil {
		log.Fatalf("Unable to start: %v", err)
	}

}

func getEncryptionKey(pc portalConfig) ([]byte, error) {
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

func initConnPool() (*sql.DB, error) {
	log.Debug("initConnPool")

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

func initSessionStore(db *sql.DB, pc portalConfig, sessionExpiry int) (HttpSessionStore, error) {
	log.Debug("initSessionStore")

	// load up postgresql database configuration
	var dc datastore.DatabaseConfig
	dc, err := loadDatabaseConfig(dc)
	if err != nil {
		return nil, err
	}

	// Store depends on the DB Type
	if dc.DatabaseProvider == "pgsql" {
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

func loadPortalConfig(pc portalConfig) (portalConfig, error) {
	log.Debug("loadPortalConfig")

	config.LoadConfigFile("./config.properties")

	if err := config.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load portal configuration. %v", err)
	}
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

func createTempCertFiles(pc portalConfig) (string, string, error) {
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

func newPortalProxy(pc portalConfig, dcp *sql.DB, ss HttpSessionStore) *portalProxy {
	log.Debug("newPortalProxy")
	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
		UAAAdminIdentifier:     UAAAdminIdentifier,
		HCFAdminIdentifier:     HCFAdminIdentifier,
		HTTPS:                  true,
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

	if p.HTTPS {
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

// Determine if we are running CF by presence of env var "VCAP_APPLICATION" and configure appropriately
func initForCloudFoundryHosting(p *portalProxy) {

	if config.IsSet(VCapApplication) {
		log.Info("Detected that Console is deployed as a Cloud Foundry Application")

		p.Config.IsCloudFoundry = true

		// We are using the CF UAA - so the Console must use the same Client and Secret as CF
		p.Config.ConsoleClient = p.Config.HCFClient
		p.Config.ConsoleClientSecret = p.Config.HCFClientSecret

		// Ensure that the identifier for an admin is the standard Cloud Foundry one
		p.UAAAdminIdentifier = HCFAdminIdentifier

		// Need to run as HTTP on the port we were told to use
		p.HTTPS = false

		if config.IsSet("PORT") {
			p.Config.TLSAddress = ":" + config.GetString("PORT")
			log.Infof("Updated Console address to: %s", p.Config.TLSAddress)
		}
		// Get the cf_api value from the JSON
		var appData VCapApplicationData
		data := []byte(config.GetString(VCapApplication))
		err := json.Unmarshal(data, &appData)
		if err != nil {
			log.Fatal("Could not get the Cloud Foundry API URL", err)
			return
		}

		log.Infof("CF API URL: %s", appData.API)

		// Store the space and id of the Console application - we can use these to prevent stop/delete in the front-end
		p.CloudFoundry = &CFInfo{
			SpaceGUID: appData.SpaceID,
			AppGUID:   appData.ApplicationID,
		}

		// Allow the URL to be overridden by an application environment variable
		if config.IsSet(CFApiURLOverride) {
			appData.API = config.GetString(CFApiURLOverride)
			log.Infof("Overrriden CF API URL from environment variable %s", CFApiURLOverride)
		}

		if config.IsSet(CFApiForceSecure) {
			// Force the API URL protocol to be https
			appData.API = strings.Replace(appData.API, "http://", "https://", 1)
			log.Infof("Ensuring that CF API URL is accessed over HTTPS")
		} else {
			log.Info("No forced override to HTTPS")
		}

		log.Infof("Using Cloud Foundry API URL: %s", appData.API)
		newCNSI, err := GetHCFv2Info(appData.API, true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return
		}

		// Override the configuration to set the authorization endpoint
		p.Config.UAAEndpoint = newCNSI.AuthorizationEndpoint

		log.Infof("Cloud Foundry UAA is: %s", p.Config.UAAEndpoint)

		// Auto-register the Cloud Foundry
		cfCnsi, regErr := p.doRegisterEndpoint("Cloud Foundry", appData.API, true, GetHCFv2Info)
		if regErr != nil {
			log.Fatal("Could not auto-register the Cloud Foundry endpoint", err)
			return
		}

		p.CloudFoundry.EndpointGUID = cfCnsi.GUID

		// Add login hook to automatically conneect to the Cloud Foundry when the user logs in
		p.LoginHook = p.cfLoginHook

		log.Info("All done for Cloud Foundry deployment")
	}
}

func (p *portalProxy) cfLoginHook(c echo.Context) error {
	log.Debug("Auto connecting to the Cloud Foundry instance")
	_, err := p.doLoginToCNSI(c, p.CloudFoundry.EndpointGUID)
	return err
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

func (p *portalProxy) registerRoutes(e *echo.Echo) {
	log.Debug("registerRoutes")

	if p.Config.IsCloudFoundry {
		// Add middleware to ensure we are running over HTTPS
		e.Use(p.cloudFoundryMiddleware)
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

	// Add Cloud Foundry session middleware if required
	if p.Config.IsCloudFoundry {
		sessionGroup.Use(p.cloudFoundrySessionMiddleware)
	}

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

	// Firehose Stream
	sessionGroup.GET("/:cnsiGuid/firehose", p.firehose)

	// Applications Log Streams
	sessionGroup.GET("/:cnsiGuid/apps/:appGuid/stream", p.appStream)

	// Stackato info
	sessionGroup.GET("/stackato/info", p.stackatoInfo)

	// VCS Requests
	vcsGroup := sessionGroup.Group("/vcs")

	// List VCS clients
	vcsGroup.GET("/clients", p.listVCSClients)

	// Delete a VCS client
	vcsGroup.DELETE("/clients/:vcsGuid", p.deleteVCSClient)

	// Register a new personal access token
	vcsGroup.POST("/pat", p.registerVcsToken)

	// Rename a personal access token
	vcsGroup.PUT("/pat/:tokenGuid", p.renameVcsToken)

	// Delete a personal access token
	vcsGroup.DELETE("/pat/:tokenGuid", p.deleteVcsToken)

	// List all personal access tokens registered by the user
	vcsGroup.GET("/pat", p.listVcsTokens)

	// Check if a VCS token is working
	vcsGroup.GET("/pat/:tokenGuid/check", p.checkVcsToken)

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
	adminGroup.POST("/register/hsm", p.registerHSMEndpoint)

	// TODO(wchrisjohnson): revisit the API and fix these wonky calls.  https://jira.hpcloud.net/browse/TEAMFOUR-620
	adminGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)

	if err == nil {
		e.Static("/", staticDir)
		log.Info("Serving static UI resources")
	}

}
