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
	"math/rand"	
	"net"
	"net/http"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"syscall"
	"time"

	"bitbucket.org/liamstask/goose/lib/goose"
	"github.com/antonlindstrom/pgstore"
	"github.com/cf-stratos/mysqlstore"
	cfenv "github.com/cloudfoundry-community/go-cfenv"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/nwmac/sqlitestore"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/sessiondata"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
)

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary      = 10
	SessionExpiry        = 20 * 60 // Session cookies expire after 20 minutes
	UpgradeVolume        = "UPGRADE_VOLUME"
	UpgradeLockFileName  = "UPGRADE_LOCK_FILENAME"
	LogToJSON            = "LOG_TO_JSON"
	LogAPIRequests       = "LOG_API_REQUESTS" // Defaults to true
	VCapApplication      = "VCAP_APPLICATION"
	defaultSessionSecret = "wheeee!"
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

// getEnvironmentLookup return a search path for configuration settings
func getEnvironmentLookup() *env.VarSet {
	// Make environment lookup
	envLookup := env.NewVarSet()

	// Config database store topmost priority
	envLookup.AppendSource(console_config.ConfigLookup)

	// Environment variables
	envLookup.AppendSource(os.LookupEnv)

	// If running in CloudFoundry, fallback to a user provided service (if set)
	cfApp, err := cfenv.Current()
	if err == nil {
		envLookup.AppendSource(env.NewLookupFromUPS(cfApp, os.Getenv("CF_UPS_NAME")))
	}

	// Fallback to a "config.properties" files in our directory
	envLookup.AppendSource(config.NewConfigFileLookup("./config.properties"))

	// Fall back to "default.config.properties" in our directory
	envLookup.AppendSource(config.NewConfigFileLookup("./default.config.properties"))

	// Fallback to individual files in the "/etc/secrets" directory
	envLookup.AppendSource(config.NewSecretsDirLookup("/etc/secrets"))

	return envLookup
}

func main() {

	// Register time.Time in gob
	gob.Register(time.Time{})

	// Create common method for looking up config
	envLookup := getEnvironmentLookup()

	log.SetFormatter(&log.TextFormatter{ForceColors: true, FullTimestamp: true, TimestampFormat: time.UnixDate})

	// Change to JSON logging if configured
	if logToJSON, ok := envLookup.Lookup(LogToJSON); ok {
		if logToJSON == "true" {
			log.SetFormatter(&log.JSONFormatter{TimestampFormat: time.UnixDate})
		}
	}

	rand.Seed(time.Now().UnixNano())

	log.SetOutput(os.Stdout)

	log.Info("========================================")
	log.Info("=== Stratos Jetstream Backend Server ===")
	log.Info("========================================")
	log.Info("")
	log.Info("Initialization started.")

	// Load the portal configuration from env vars
	var portalConfig interfaces.PortalConfig
	portalConfig, err := loadPortalConfig(portalConfig, envLookup)
	if err != nil {
		log.Fatal(err) // calls os.Exit(1) after logging
	}
	if portalConfig.LogLevel != "" {
		log.Infof("Setting log level to: %s", portalConfig.LogLevel)
		level, _ := log.ParseLevel(portalConfig.LogLevel)
		log.SetLevel(level)
	}

	// Initially, default state is that DB Migrations can be performed
	portalConfig.CanMigrateDatabaseSchema = true

	log.Info("Configuration loaded.")
	isUpgrading := isConsoleUpgrading(envLookup)

	if isUpgrading {
		log.Info("Upgrade in progress (lock file detected) ... waiting for lock file to be removed ...")
		start(portalConfig, &portalProxy{env: envLookup}, false, true, envLookup)
	}
	// Grab the Console Version from the executable
	portalConfig.ConsoleVersion = appVersion
	log.Infof("Stratos Version: %s", portalConfig.ConsoleVersion)

	// Initialize an empty config for the console - initially not setup
	portalConfig.ConsoleConfig = new(interfaces.ConsoleConfig)

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
	dc, err = loadDatabaseConfig(dc, envLookup)
	if err != nil {
		log.Fatal(err)
	}

	// Store database provider name for diagnostics
	portalConfig.DatabaseProviderName = dc.DatabaseProvider

	cnsis.InitRepositoryProvider(dc.DatabaseProvider)
	tokens.InitRepositoryProvider(dc.DatabaseProvider)
	console_config.InitRepositoryProvider(dc.DatabaseProvider)
	localusers.InitRepositoryProvider(dc.DatabaseProvider)
	sessiondata.InitRepositoryProvider(dc.DatabaseProvider)

	// Establish a Postgresql connection pool
	databaseConnectionPool, migratorConf, err := initConnPool(dc, envLookup)
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		log.Info(`... Closing database connection pool`)
		databaseConnectionPool.Close()
	}()
	log.Info("Database connection pool created.")

	// Before any changes it, log that we detected a non-default session store secret, so we can tell it has been set from the log
	if portalConfig.SessionStoreSecret != defaultSessionSecret {
		log.Info("Session Store Secret detected okay")
	}

	for _, configPlugin := range interfaces.JetstreamConfigPlugins {
		configPlugin(envLookup, &portalConfig)
	}

	if portalConfig.SessionStoreSecret == defaultSessionSecret {
		// The Session store secret needs to be set for secure cookies to work properly
		// We should not be using the default value - this indicates that it has not been set by the user
		// So for saftey, set a random value
		log.Warn("When running in production, ensure you set SESSION_STORE_SECRET to a secure value")
		portalConfig.SessionStoreSecret = uuid.NewV4().String()
	}

	// Config plugins get to determine if we should run migrations on this instance
	if portalConfig.CanMigrateDatabaseSchema {
		// Create the database schema otherwise wait for the datbase schema
		err = datastore.ApplyMigrations(migratorConf, databaseConnectionPool)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		log.Warn("Waiting for migrations ...")
		// Wait for Database Schema to be initialized (or exit if this times out)
		if err = datastore.WaitForMigrations(databaseConnectionPool); err != nil {
			log.Fatal(err)
		}
	}

	// Initialize session store for Gorilla sessions
	sessionStore, sessionStoreOptions, err := initSessionStore(databaseConnectionPool, dc.DatabaseProvider, portalConfig, SessionExpiry, envLookup)
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

	// Create session data store
	sessionDataStore, err := sessiondata.NewPostgresSessionDataRepository(databaseConnectionPool)
	if err != nil {
		log.Fatal(err)
	}

	// Session Data Store: Ensure the cleanup tick starts now (this will delete expired session data from the DB)
	dataQuitCleanup, dataDoneCleanup := sessionDataStore.Cleanup(time.Minute * 3)
	defer func() {
		log.Info(`... Cleaning up session data store`)
		sessionDataStore.StopCleanup(dataQuitCleanup, dataDoneCleanup)
	}()
	log.Info("Session data store initialized.")

	// Setup the global interface for the proxy
	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool, sessionStore, sessionStoreOptions, envLookup)
	portalProxy.SessionDataStore = sessionDataStore
	log.Info("Initialization complete.")

	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		// Print a newline - if you pressed CTRL+C, the alighment will be slightly out, so start a new line first
		fmt.Println()
		log.Info("Attempting to shut down gracefully...")

		// Database connection pool
		log.Info(`... Closing database connection pool`)
		databaseConnectionPool.Close()

		// Session store
		log.Info(`... Closing session store`)
		sessionStore.Close()
		log.Info(`... Stopping sessionStore cleanup`)
		sessionStore.StopCleanup(quitCleanup, doneCleanup)

		// Session Data Store
		log.Info(`... Stopping sessiondata store cleanup`)
		sessionDataStore.StopCleanup(dataQuitCleanup, dataDoneCleanup)

		// Plugin cleanup
		for _, plugin := range portalProxy.Plugins {
			if pCleanup, ok := plugin.(interfaces.StratosPluginCleanup); ok {
				pCleanup.Destroy()
			}
		}

		log.Info("Graceful shut down complete")
		os.Exit(1)
	}()

	// Initialise configuration
	err = initialiseConsoleConfiguration(portalProxy)
	if err != nil {
		log.Infof("Failed to initialise console config due to: %s", err)
		return
	}

	// Init auth service
	err = portalProxy.InitStratosAuthService(interfaces.AuthEndpointTypes[portalProxy.Config.AuthEndpointType])
	if err != nil {
		log.Warnf("Defaulting to UAA authentication: %v", err)
		err = portalProxy.InitStratosAuthService(interfaces.Remote)
		if err != nil {
			log.Fatalf("Could not initialise auth service. %v", err)
		}
	}

	// Initialise Plugins
	portalProxy.loadPlugins()

	initedPlugins := make(map[string]interfaces.StratosPlugin)
	portalProxy.PluginsStatus = make(map[string]bool)

	// Initialise general plugins
	for name, plugin := range portalProxy.Plugins {
		if err = plugin.Init(); err == nil {
			initedPlugins[name] = plugin
			portalProxy.PluginsStatus[name] = true
		} else {
			log.Infof("Plugin %s is disabled: %s", name, err.Error())
			portalProxy.PluginsStatus[name] = false
		}
	}

	portalProxy.Plugins = initedPlugins
	log.Info("Plugins initialized")

	var needSetupMiddleware bool

	// At this stage, all plugins have had a chance to modify configurtion based on hosting environment
	// Check to see if we are setup or not
	if !portalProxy.Config.ConsoleConfig.IsSetupComplete() {
		needSetupMiddleware = true
		log.Info("Console does not have a complete configuration - going to enter setup mode (adding `setup` route and middleware)")
	} else {
		needSetupMiddleware = false
		showStratosConfig(portalProxy.Config.ConsoleConfig)
		showSSOConfig(portalProxy)
	}

	// Get Diagnostics and store them once - ensure this is done after plugins are loaded
	portalProxy.StoreDiagnostics()

	// Start the back-end
	if err := start(portalProxy.Config, portalProxy, needSetupMiddleware, false, envLookup); err != nil {
		log.Fatalf("Unable to start: %v", err)
	}
	log.Info("Unable to start Stratos JetStream backend")

}

// GetDatabaseConnection makes db connection available to plugins
func (portalProxy *portalProxy) GetDatabaseConnection() *sql.DB {
	return portalProxy.DatabaseConnectionPool
}

// GetSessionDataStore returns the store that can be used for extra session data
func (portalProxy *portalProxy) GetSessionDataStore() interfaces.SessionDataStore {
	return portalProxy.SessionDataStore
}

func (portalProxy *portalProxy) GetPlugin(name string) interface{} {
	plugin := portalProxy.Plugins[name]
	return plugin
}

func initialiseConsoleConfiguration(portalProxy *portalProxy) error {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(portalProxy.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Unable to initialize Stratos backend config due to: %+v", err)
		return err
	}

	// Do this BEFORE we load the config from the database, so env var lookup at this stage
	// looks at environment variables etc but NOT the database
	// Migrate data from old setup table to new config table (if needed)
	err = console_config.MigrateSetupData(portalProxy, consoleRepo)
	if err != nil {
		log.Warnf("Unable to initialize config environment provider: %+v", err)
	}

	// Load config stored in the database
	err = console_config.InitializeConfEnvProvider(consoleRepo)
	if err != nil {
		log.Warnf("Unable to load configuration from database: %+v", err)
	}

	// Now that the config DB is an env provider, we can just use the env to fetch the setup values
	consoleConfig, err := portalProxy.initialiseConsoleConfig(portalProxy.Env())
	if err != nil {
		// Could not read config - this should not happen - so abort if it does
		log.Fatalf("Unable to load console config; %+v", err)
	}

	if consoleConfig.IsSetupComplete() {
		portalProxy.Config.ConsoleConfig = consoleConfig
		portalProxy.Config.SSOLogin = consoleConfig.UseSSO
		portalProxy.Config.AuthEndpointType = consoleConfig.AuthEndpointType
	}

	return nil
}

func showStratosConfig(config *interfaces.ConsoleConfig) {
	log.Infof("Stratos is initialized with the following setup:")
	log.Infof("... Auth Endpoint Type      : %s", config.AuthEndpointType)
	if val, found := interfaces.AuthEndpointTypes[config.AuthEndpointType]; found {
		if val == interfaces.Local {
			log.Infof("... Local User              : %s", config.LocalUser)
			log.Infof("... Local User Scope        : %s", config.LocalUserScope)
		} else { //Auth type is set to remote
			log.Infof("... UAA Endpoint            : %s", config.UAAEndpoint)
			log.Infof("... Authorization Endpoint  : %s", config.AuthorizationEndpoint)
			log.Infof("... Console Client          : %s", config.ConsoleClient)
			log.Infof("... Admin Scope             : %s", config.ConsoleAdminScope)
			log.Infof("... Use SSO Login           : %t", config.UseSSO)
		}
	}
	log.Infof("... Skip SSL Validation     : %t", config.SkipSSLValidation)
	log.Infof("... Setup Complete          : %t", config.IsSetupComplete())
}

func showSSOConfig(portalProxy *portalProxy) {
	// Show SSO Configuration
	log.Infof("SSO Configuration:")
	log.Infof("... SSO Enabled             : %t", portalProxy.Config.SSOLogin)
	log.Infof("... SSO Options             : %s", portalProxy.Config.SSOOptions)
	log.Infof("... SSO Redirect Whitelist  : %s", portalProxy.Config.SSOWhiteList)
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

	// Check we have volume and filename
	if len(pc.EncryptionKeyVolume) == 0 && len(pc.EncryptionKeyFilename) == 0 {
		return nil, errors.New("You must configure either an Encryption key or the Encryption key filename")
	}

	// Read the key from the shared volume
	key, err := crypto.ReadEncryptionKey(pc.EncryptionKeyVolume, pc.EncryptionKeyFilename)
	if err != nil {
		log.Errorf("Unable to read the encryption key from the shared volume: %v", err)
		return nil, err
	}

	return key, nil
}

func initConnPool(dc datastore.DatabaseConfig, env *env.VarSet) (*sql.DB, *goose.DBConf, error) {
	log.Debug("initConnPool")

	// initialize the database connection pool
	pool, conf, err := datastore.GetConnection(dc, env)
	if err != nil {
		return nil, nil, err
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
			return nil, nil, fmt.Errorf("timeout boundary of %d minutes has been exceeded. Exiting", TimeoutBoundary)
		}

		// Circle back and try again
		log.Infof("Waiting for database to be responsive: %+v", err)
		time.Sleep(time.Second)
	}

	return pool, conf, nil
}

func initSessionStore(db *sql.DB, databaseProvider string, pc interfaces.PortalConfig, sessionExpiry int, env *env.VarSet) (HttpSessionStore, *sessions.Options, error) {
	log.Debug("initSessionStore")

	sessionsTable := "sessions"

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
		sessionStore.Options.Secure = true
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
		sessionStore.Options.Secure = true
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
	sessionStore.Options.Secure = true
	if len(domain) > 0 {
		sessionStore.Options.Domain = domain
	}
	return sessionStore, sessionStore.Options, err
}

func loadPortalConfig(pc interfaces.PortalConfig, env *env.VarSet) (interfaces.PortalConfig, error) {
	log.Debug("loadPortalConfig")

	if err := config.Load(&pc, env.Lookup); err != nil {
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

	if len(pc.AuthEndpointType) == 0 {
		//Default to "remote" if AUTH_ENDPOINT_TYPE is not set
		pc.AuthEndpointType = string(interfaces.Remote)
	} else {
		val, endpointTypeSupported := interfaces.AuthEndpointTypes[pc.AuthEndpointType]
		if endpointTypeSupported {
			pc.AuthEndpointType = string(val)
		} else {
			return pc, fmt.Errorf("AUTH_ENDPOINT_TYPE: %v is not valid. Must be set to local or remote (defaults to remote)", val)
		}
	}

	log.Debugf("Portal config auth endpoint type initialised to: %v", pc.AuthEndpointType)
	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig, env *env.VarSet) (datastore.DatabaseConfig, error) {
	log.Debug("loadDatabaseConfig")

	parsedDBConfig, err := datastore.ParseCFEnvs(&dc, env)
	if err != nil {
		return dc, errors.New("Could not parse Cloud Foundry Services environment")
	}

	if parsedDBConfig {
		log.Info("Using Cloud Foundry DB service")
	} else if err := config.Load(&dc, env.Lookup); err != nil {
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

func newPortalProxy(pc interfaces.PortalConfig, dcp *sql.DB, ss HttpSessionStore, sessionStoreOptions *sessions.Options, env *env.VarSet) *portalProxy {
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
		AuthProviders:          make(map[string]interfaces.AuthProvider),
		env:                    env,
	}

	// Initialize built-in auth providers

	// Basic Auth
	pp.AddAuthProvider(interfaces.AuthTypeHttpBasic, interfaces.AuthProvider{
		Handler:  pp.doHttpBasicFlowRequest,
		UserInfo: pp.GetCNSIUserFromBasicToken,
	})

	// OIDC
	pp.AddAuthProvider(interfaces.AuthTypeOIDC, interfaces.AuthProvider{
		Handler: pp.DoOidcFlowRequest,
	})

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

func echoShouldNotLog(ec echo.Context) bool {
	// Don't log readiness probes
	if ec.Request().RequestURI == "/pp/v1/ping" {
		return true
	}
	return false
}

func start(config interfaces.PortalConfig, p *portalProxy, needSetupMiddleware bool, isUpgrade bool, envLookup *env.VarSet) error {
	log.Debug("start")
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Root level middleware
	if !isUpgrade {
		e.Use(sessionCleanupMiddleware)
	}

	logAPIRequests := "true"
	if envLogAPIRequests, ok := envLookup.Lookup(LogAPIRequests); ok {
		logAPIRequests = envLogAPIRequests
	}
	if logAPIRequests == "true" {
		customLoggerConfig := middleware.LoggerConfig{
			Format: `Request: [${time_rfc3339}] Remote-IP:"${remote_ip}" ` +
				`Method:"${method}" Path:"${path}" Status:${status} Latency:${latency_human} ` +
				`Bytes-In:${bytes_in} Bytes-Out:${bytes_out}` + "\n",
		}
		customLoggerConfig.Skipper = echoShouldNotLog

		e.Use(middleware.LoggerWithConfig(customLoggerConfig))
	} else {
		log.Warn("Disabled logging of API requests received by Jetstream")
	}

	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     config.AllowedOrigins,
		AllowMethods:     []string{echo.GET, echo.PUT, echo.POST, echo.DELETE},
		AllowCredentials: true,
	}))
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XFrameOptions: "SAMEORIGIN",
	}))

	if !isUpgrade {
		e.Use(errorLoggingMiddleware)
	}
	e.Use(bindToEnv(retryAfterUpgradeMiddleware, p.Env()))

	if !isUpgrade {
		p.registerRoutes(e, needSetupMiddleware)
	}

	if isUpgrade {
		go stopEchoWhenUpgraded(e, p.Env())
	}

	var engineErr error
	address := config.TLSAddress
	if config.HTTPS {
		certFile, certKeyFile, err := detectTLSCert(config)
		if err != nil {
			return err
		}
		log.Infof("Starting HTTPS Server at address: %s", address)
		engineErr = e.StartTLS(address, certFile, certKeyFile)
	} else {
		log.Infof("Starting HTTP Server at address: %s", address)
		engineErr = e.Start(address)
	}

	if engineErr != nil {
		engineErrStr := fmt.Sprintf("%s", engineErr)
		if !strings.Contains(engineErrStr, "Server closed") {
			log.Warnf("Failed to start HTTP/S server: %+v", engineErr)
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

// GetHttpClientForRequest returns an Http Client for the giving request
func (p *portalProxy) GetHttpClientForRequest(req *http.Request, skipSSLValidation bool) http.Client {
	isMutating := req.Method != "GET" && req.Method != "HEAD"
	client := p.getHttpClient(skipSSLValidation, isMutating)

	// Is this is a long-running request, then use a different timeout
	if req.Header.Get(longRunningTimeoutHeader) == "true" {
		longRunningClient := http.Client{}
		longRunningClient.Transport = client.Transport
		longRunningClient.Timeout = time.Duration(p.GetConfig().HTTPClientTimeoutLongRunningInSecs) * time.Second
		return longRunningClient
	}

	return client
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

func (p *portalProxy) registerRoutes(e *echo.Echo, needSetupMiddleware bool) {
	log.Debug("registerRoutes")

	for _, plugin := range p.Plugins {
		middlewarePlugin, err := plugin.GetMiddlewarePlugin()
		if err != nil {
			// Plugin doesn't implement an middleware Plugin interface, skip
			continue
		}
		e.Use(middlewarePlugin.EchoMiddleware)
	}

	staticDir, staticDirErr := getStaticFiles(p.Env().String("UI_PATH", "./ui"))

	// Always serve the backend API from /pp
	pp := e.Group("/pp")

	pp.Use(p.setSecureCacheContentMiddleware)

	// Add middleware to block requests if unconfigured
	if needSetupMiddleware {
		e.Use(p.SetupMiddleware())
		pp.POST("/v1/setup/check", p.setupGetAvailableScopes)
		pp.POST("/v1/setup/save", p.setupSaveConfig)
	}

	loginAuthGroup := pp.Group("/v1/auth")
	loginAuthGroup.POST("/login/uaa", p.consoleLogin)
	loginAuthGroup.POST("/logout", p.consoleLogout)

	// SSO Routes will only respond if SSO is enabled
	loginAuthGroup.GET("/sso_login", p.initSSOlogin)
	loginAuthGroup.GET("/sso_logout", p.ssoLogoutOfUAA)

	// Callback is used by both login to Stratos and login to an Endpoint
	loginAuthGroup.GET("/sso_login_callback", p.ssoLoginToUAA)

	// Version info
	pp.GET("/v1/version", p.getVersions)

	// Ping - returns version (but is not logged)
	pp.GET("/v1/ping", p.getVersions)

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

	sessionAuthGroup := sessionGroup.Group("/auth")

	// Connect to endpoint
	sessionAuthGroup.POST("/login/cnsi", p.loginToCNSI)

	// Connect to Enpoint (SSO)
	sessionAuthGroup.GET("/login/cnsi", p.ssoLoginToCNSI)

	// Disconnect endpoint
	sessionAuthGroup.POST("/logout/cnsi", p.logoutOfCNSI)

	// Verify Session
	sessionAuthGroup.GET("/session/verify", p.verifySession)

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
		if err == nil {
			// Plugin supports endpoint plugin
			endpointType := endpointPlugin.GetType()
			adminGroup.POST("/register/"+endpointType, endpointPlugin.Register)
		}

		routePlugin, err := plugin.GetRoutePlugin()
		if err == nil {
			routePlugin.AddAdminGroupRoutes(adminGroup)
		}
	}

	// Apply edits for the given endpoint
	adminGroup.POST("/endpoint/:id", p.updateEndpoint)

	adminGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)

	// Serve up static resources
	if staticDirErr == nil {
		e.Use(p.setStaticCacheContentMiddleware)
		log.Debug("Add URL Check Middleware")
		e.Use(p.urlCheckMiddleware)
		e.Group("", middleware.Gzip()).Static("/", staticDir)
		e.HTTPErrorHandler = getUICustomHTTPErrorHandler(staticDir, e.DefaultHTTPErrorHandler)
		log.Info("Serving static UI resources")
	} else {
		// Not serving UI - use V2 Error compatability error handler
		e.HTTPErrorHandler = echoV2DefaultHTTPErrorHandler
	}
}

func (p *portalProxy) AddLoginHook(priority int, function interfaces.LoginHookFunc) error {
	p.GetConfig().LoginHooks = append(p.GetConfig().LoginHooks, interfaces.LoginHook{
		Priority: priority,
		Function: function,
	})
	return nil
}

func (p *portalProxy) ExecuteLoginHooks(c echo.Context) error {
	hooks := p.GetConfig().LoginHooks
	sort.SliceStable(hooks, func(i, j int) bool {
		return hooks[i].Priority < hooks[j].Priority
	})

	erred := false
	for _, hook := range hooks {
		err := hook.Function(c)
		if err != nil {
			erred = true
			log.Errorf("Failed to execute log in hook: %v", err)
		}
	}

	if erred {
		return fmt.Errorf("Failed to execute one or more login hooks")
	}
	return nil
}

// Custom error handler to let Angular app handle application URLs (catches non-backend 404 errors)
func getUICustomHTTPErrorHandler(staticDir string, defaultHandler echo.HTTPErrorHandler) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
		}

		// If this was not a back-end request and the error code is 404, serve the app and let it route
		if strings.Index(c.Request().RequestURI, "/pp") != 0 && code == 404 {
			c.File(path.Join(staticDir, "index.html"))
			// Let the default handler handle it
			defaultHandler(err, c)
		} else {
			// Use V2 Error compatability error handler
			echoV2DefaultHTTPErrorHandler(err, c)
		}
	}
}

// EchoV2DefaultHTTPErrorHandler ensures we get V2 error behaviour
// i.e. no wrapping in 'message' JSON object
func echoV2DefaultHTTPErrorHandler(err error, c echo.Context) {

	code := http.StatusInternalServerError
	msg := http.StatusText(code)
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		if msgStr, ok := he.Message.(string); ok {
			msg = msgStr
		} else {
			msg = he.Error()
		}
		if he.Internal != nil {
			err = fmt.Errorf("%v, %v", err, he.Internal)
		}
	}

	// Send response
	if !c.Response().Committed {
		if c.Request().Method == http.MethodHead { // Issue #608
			c.NoContent(code)
		} else {
			c.String(code, msg)
		}
	}

	// Always log error
	if err != nil {
		c.Logger().Error(err)
	}
}

func getStaticFiles(uiFolder string) (string, error) {
	dir, err := filepath.Abs(uiFolder)
	if err == nil {
		// Check if folder exists
		_, err := os.Stat(dir)
		if err == nil || !os.IsNotExist(err) {
			return dir, nil
		}
	}
	return "", errors.New("UI folder not found")
}

func isConsoleUpgrading(env *env.VarSet) bool {

	upgradeVolume, noUpgradeVolumeOK := env.Lookup(UpgradeVolume)
	upgradeLockFile, noUpgradeLockFileNameOK := env.Lookup(UpgradeLockFileName)

	// If any of those properties are not set, consider Console is running in a non-upgradeable environment
	if !noUpgradeVolumeOK || !noUpgradeLockFileNameOK {
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

func stopEchoWhenUpgraded(e *echo.Echo, env *env.VarSet) {
	for isConsoleUpgrading(env) {
		time.Sleep(1 * time.Second)
	}
	log.Info("Upgrade has completed! Shutting down Upgrade web server instance")
	e.Close()
}
