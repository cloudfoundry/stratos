package main

import (
	"context"
	"crypto/sha1"
	"database/sql"
	"encoding/gob"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/custombinder"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/sessionstore"
	//_ "github.com/cloudfoundry/stratos/src/jetstream/docs"

	cfenv "github.com/cloudfoundry-community/go-cfenv"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	log "github.com/sirupsen/logrus"
	echoSwagger "github.com/swaggo/echo-swagger/v2"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	"github.com/cloudfoundry/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/factory"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/apikeys"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/console_config"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/localusers"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/sessiondata"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/tokens"
)

// @title Stratos API
// @version 1.0
// @description Stratos backend API.

// @contact.name Stratos maintainers
// @contact.url https://github.com/cloudfoundry/stratos/issues

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @tag.name admin
// @tag.description Endpoints that require admin permissions

// @BasePath /api/v1
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authentication

// TimeoutBoundary represents the amount of time we'll wait for the database
// server to come online before we bail out.
const (
	TimeoutBoundary      = 10
	SessionExpiry        = 20 // Default value for session cookies expiration (20 minutes)
	UpgradeVolume        = "UPGRADE_VOLUME"
	UpgradeLockFileName  = "UPGRADE_LOCK_FILENAME"
	LogToJSON            = "LOG_TO_JSON"
	LogAPIRequests       = "LOG_API_REQUESTS" // Defaults to true
	VCapApplication      = "VCAP_APPLICATION"
	defaultSessionSecret = "wheeee!"
	// defaultEncryptionKey is the well-known key shipped in config.example and the
	// packaged config.properties. It is detected at startup so operators are warned
	// when the token store would be encrypted with a publicly-known value.
	defaultEncryptionKey = "B374A26A71490437AA024E4FADD5B497FDFF1A8EA6FF12F6FB65AF2720B59CCF"
)

// defaultCSPPolicy is the Content-Security-Policy applied unless CONSOLE_CSP
// opts out or supplies its own. It is scoped to what the Stratos SPA needs:
//
//   - default/connect from same origin ('self'); same-origin 'self'
//     also permits the backend log/stream WebSockets (wss:// on the HTTPS page)
//
//   - script-src carries the per-response nonce and 'strict-dynamic', which is
//     the CSP Level 3 mechanism for scripts: the nonce authorises the module
//     scripts the build appends to index.html (serveIndexHTML stamps them),
//     and 'strict-dynamic' propagates that trust to what they load — Angular's
//     lazy route chunks and Monaco's, which arrive by dynamic import() from an
//     already-trusted module. It carries no 'self' and no host source on
//     purpose: 'strict-dynamic' makes a browser ignore every one of them, so a
//     source left beside it reads as a grant that does not hold. That is the
//     directive's whole point — an injected <script src="/…"> is same-origin
//     and still refused, because origin no longer confers trust.
//
//   - 'report-sample' on both directives that can refuse inline content
//     (script-src, style-src-elem) — without it a browser reports a blocked
//     inline script or style as blocked-uri "inline" and nothing else, which
//     names no file and no content. It grants nothing, so it does not weaken
//     'strict-dynamic' beside it. style-src does not carry it: 'unsafe-inline'
//     means nothing ever violates it to sample.
//
//   - object-src 'none' — plugin content (<object>, <embed>) is a script
//     execution path that script-src does not govern. Stated explicitly
//     because falling back to default-src 'self' would still permit it from
//     this origin, and the console embeds no plugin content at all.
//
//   - style-src-elem carries a per-response nonce, so <style> elements are
//     enforced without 'unsafe-inline'. serveIndexHTML nonces the ones in
//     index.html; Angular nonces its own from ngCspNonce; installStyleNonce
//     (frontend polyfills) nonces the ones Monaco and xterm create, neither of
//     which accepts a nonce itself. A <style> arriving as markup carries none
//     and is refused, which is the point.
//
//   - style-src keeps 'unsafe-inline', but style-src-elem now overrides it for
//     elements, so what it still permits is inline style ATTRIBUTES (Monaco's
//     per-line positioning, xterm's truecolor cells). CSP has no nonce or hash
//     mechanism for dynamic attributes, so no policy change can tighten this.
//     It also remains the whole style policy on pre-CSP3 browsers.
//
//   - data: images/fonts (inlined icons) and Google Fonts font files
//
//   - worker-src 'self' — Monaco's language workers are same-origin module
//     workers built from `new Worker(new URL(…), {type: 'module'})`, hashed
//     chunks like the rest of the app (monaco-loader.ts). It granted blob: as
//     well until the AMD loader went away in #5561; a blob: worker inherits
//     the creating document's policy, so re-granting it is a way back to
//     running script the nonce never authorised.
//
//   - require-trusted-types-for 'script' closes the sinks script-src cannot
//     see. A nonce governs how script ARRIVES; it says nothing about a string
//     assigned to innerHTML by script that is already trusted, which is the
//     DOM-XSS half of the problem. Under this directive the browser refuses a
//     plain string at those sinks outright.
//
//     No trusted-types allowlist accompanies it, so any policy name is
//     permitted. Angular creates 'angular' and 'angular#unsafe-bypass', and
//     Monaco creates nine of its own; naming them would pin this policy to
//     the internals of two dependencies and break the console on the upgrade
//     that adds a tenth. The allowlist is what stops an attacker who already
//     runs script from minting their own policy — which, at that point, is no
//     longer the boundary that matters.
//
//   - frame-ancestors 'self' mirrors the existing X-Frame-Options: SAMEORIGIN
//
// Operators can instead set CONSOLE_CSP to a full policy string to use verbatim.
const defaultCSPPolicy = "default-src 'self'; " +
	"script-src " + cspNoncePlaceholder + " 'strict-dynamic' " + cspReportSample + "; " +
	"object-src 'none'; " +
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
	// style-src-elem overrides style-src for elements wholesale, so it has to
	// repeat every source style-src grants them or it silently withdraws one.
	"style-src-elem 'self' " + cspNoncePlaceholder + " " + cspReportSample + " https://fonts.googleapis.com; " +
	"font-src 'self' data: https://fonts.gstatic.com; " +
	"img-src 'self' data:; " +
	// 'self' also covers same-origin WebSocket (wss:// on an HTTPS page), so
	// the backend log/stream sockets connect without a bare ws:/wss: wildcard
	// (which scanners flag as overly permissive — it would allow any host).
	"connect-src 'self'; " +
	"worker-src 'self'; " +
	"frame-ancestors 'self'; " +
	"base-uri 'self'; " +
	"form-action 'self'; " +
	"require-trusted-types-for 'script'"

var appVersion string
var buildDate string
var gitCommit string
var gitBranch string

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

	log.SetOutput(os.Stdout)

	log.Info("========================================")
	log.Info("=== Stratos Jetstream Backend Server ===")
	log.Info("========================================")
	log.Info("")
	log.Info("Initialization started.")

	// Load the portal configuration from env vars
	var portalConfig api.PortalConfig
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
		if err := start(portalConfig, &portalProxy{env: envLookup}, false, true, envLookup); err != nil {
			log.Warnf("Unable to start upgrade web server instance: %v", err)
		}
	}
	// Grab the Console Version from the executable
	portalConfig.ConsoleVersion = appVersion
	log.Infof("Stratos Version: %s", portalConfig.ConsoleVersion)

	// Initialize an empty config for the console - initially not setup
	portalConfig.ConsoleConfig = new(api.ConsoleConfig)

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
	apikeys.InitRepositoryProvider(dc.DatabaseProvider)

	// Establish a Postgresql connection pool
	databaseConnectionPool, err := initConnPool(dc, envLookup)
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		log.Info(`... Closing database connection pool`)
		_ = databaseConnectionPool.Close()
	}()
	log.Info("Database connection pool created.")

	// Before any changes it, log that we detected a non-default session store secret, so we can tell it has been set from the log
	if portalConfig.SessionStoreSecret != defaultSessionSecret {
		log.Info("Session Store Secret detected okay")
	}

	for _, configPlugin := range api.JetstreamConfigPlugins {
		configPlugin(envLookup, &portalConfig)
	}

	if portalConfig.SessionStoreSecret == defaultSessionSecret {
		// The Session store secret needs to be set for secure cookies to work properly
		// We should not be using the default value - this indicates that it has not been set by the user
		// So for saftey, set a random value
		log.Warn("When running in production, ensure you set SESSION_STORE_SECRET to a secure value")
		portalConfig.SessionStoreSecret = uuid.New().String()
	}

	// Config plugins get to determine if we should run migrations on this instance
	if portalConfig.CanMigrateDatabaseSchema {
		// The API key hashing migration peppers secrets with the encryption key.
		datastore.SetAPIKeyHMACKey(portalConfig.EncryptionKeyInBytes)
		// Create the database schema otherwise wait for the datbase schema
		err = datastore.ApplyMigrations(databaseConnectionPool)
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

	sSessionExpiry := envLookup.String("SESSION_STORE_EXPIRY", strconv.Itoa(SessionExpiry))
	sessionExpiry, err := strconv.Atoi(sSessionExpiry)
	if err != nil {
		sessionExpiry = SessionExpiry
	}
	log.Infof("Session expiration (minutes): %d", sessionExpiry)
	// Convert to seconds
	sessionExpiry *= 60
	// Initialize session store for Gorilla sessions
	sessionStore, sessionStoreOptions, err := initSessionStore(databaseConnectionPool, dc.DatabaseProvider, portalConfig, sessionExpiry, envLookup)
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

	store := factory.NewDefaultStoreFactory(databaseConnectionPool)
	portalProxy.SetStoreFactory(store)

	log.Info("Initialization complete.")

	ctx, cancel := context.WithCancel(context.Background())
	portalProxy.SetRefreshRoutineContext(ctx, cancel)
	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		// Print a newline - if you pressed CTRL+C, the alighment will be slightly out, so start a new line first
		fmt.Println()
		log.Info("Attempting to shut down gracefully...")

		// Cancel portal proxy context
		cancel()

		// Database connection pool
		log.Info(`... Closing database connection pool`)
		_ = databaseConnectionPool.Close()

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
			if pCleanup, ok := plugin.(api.StratosPluginCleanup); ok {
				pCleanup.Destroy()
			}
		}
		// wait for any goroutines to shut down
		portalProxy.refreshRoutines.wg.Wait()

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
	err = portalProxy.InitStratosAuthService(api.AuthEndpointTypes[portalProxy.Config.AuthEndpointType])
	if err != nil {
		log.Warnf("Defaulting to UAA authentication: %v", err)
		err = portalProxy.InitStratosAuthService(api.Remote)
		if err != nil {
			log.Fatalf("Could not initialise auth service. %v", err)
		}
	}

	// Initialise Plugins
	portalProxy.loadPlugins()

	initedPlugins := make(map[string]api.StratosPlugin)
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
		showStratosConfig(portalProxy, portalProxy.Config.ConsoleConfig)
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
func (portalProxy *portalProxy) GetSessionDataStore() api.SessionDataStore {
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

func showStratosConfig(portalProxy *portalProxy, config *api.ConsoleConfig) {
	log.Infof("Stratos is initialized with the following setup:")
	log.Infof("... Auth Endpoint Type      : %s", config.AuthEndpointType)

	// Ask the auto provider to display their config
	portalProxy.StratosAuthService.ShowConfig(config)

	log.Infof("... Skip SSL Validation     : %t", config.SkipSSLValidation)
	log.Infof("... Setup Complete          : %t", config.IsSetupComplete())
}

func showSSOConfig(portalProxy *portalProxy) {
	// Show SSO Configuration
	log.Infof("SSO Configuration:")
	log.Infof("... SSO Enabled             : %t", portalProxy.Config.SSOLogin)
	log.Infof("... SSO Options             : %s", portalProxy.Config.SSOOptions)
	log.Infof("... SSO Redirect Allow-list : %s", portalProxy.Config.SSOAllowList)
}

func getEncryptionKey(pc api.PortalConfig) ([]byte, error) {
	log.Debug("getEncryptionKey")

	// If it exists in "EncryptionKey" we must be in compose; use it.
	if len(pc.EncryptionKey) > 0 {
		if strings.EqualFold(string(pc.EncryptionKey), defaultEncryptionKey) {
			log.Warn("ENCRYPTION_KEY is the well-known default from config.example; " +
				"the token store is encrypted with a publicly-known key. " +
				"Generate a unique key with: openssl rand -hex 32. " +
				"Changing ENCRYPTION_KEY once tokens have been stored makes all " +
				"existing encrypted data unreadable; affected endpoints must be " +
				"disconnected and re-connected after the key changes.")
		}
		key32bytes, err := hex.DecodeString(string(pc.EncryptionKey))
		if err != nil {
			log.Error(err)
		}

		return key32bytes, nil
	}

	// Check we have volume and filename
	if len(pc.EncryptionKeyVolume) == 0 && len(pc.EncryptionKeyFilename) == 0 {
		return nil, errors.New("you must configure either an Encryption key or the Encryption key filename")
	}

	// Read the key from the shared volume
	key, err := crypto.ReadEncryptionKey(pc.EncryptionKeyVolume, pc.EncryptionKeyFilename)
	if err != nil {
		log.Errorf("Unable to read the encryption key from the shared volume: %v", err)
		return nil, err
	}

	return key, nil
}

func initConnPool(dc datastore.DatabaseConfig, env *env.VarSet) (*sql.DB, error) {
	log.Debug("initConnPool")

	// initialize the database connection pool
	pool, err := datastore.GetConnection(dc, env)
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
		if time.Until(timeout) < 0 {
			return nil, fmt.Errorf("timeout boundary of %d minutes has been exceeded. Exiting", TimeoutBoundary)
		}

		// Circle back and try again
		log.Infof("Waiting for database to be responsive: %+v", err)
		time.Sleep(time.Second)
	}

	return pool, nil
}

func initSessionStore(db *sql.DB, databaseProvider string, pc api.PortalConfig, sessionExpiry int, env *env.VarSet) (HttpSessionStore, *sessions.Options, error) {
	log.Debug("initSessionStore")

	// Allow the cookie domain to be configured
	domain := pc.CookieDomain
	if domain == "-" {
		domain = ""
	}

	log.Infof("Session Cookie Domain: %s", domain)

	log.Infof("Creating %s session store", databaseProvider)
	sessionStore, err := sessionstore.New(db, databaseProvider, "/", 3600, []byte(pc.SessionStoreSecret))
	if err != nil {
		return nil, nil, err
	}
	// Setup cookie-store options
	sessionStore.Options.MaxAge = sessionExpiry
	sessionStore.Options.HttpOnly = true
	sessionStore.Options.Secure = true
	// Lax (not Strict) so the cookie still rides top-level navigations such as
	// the SSO login redirect, while withholding it from cross-site subresource
	// requests (defence-in-depth alongside the XSRF token).
	sessionStore.Options.SameSite = http.SameSiteLaxMode
	if len(domain) > 0 {
		sessionStore.Options.Domain = domain
	}
	return sessionStore, sessionStore.Options, nil
}

func loadPortalConfig(pc api.PortalConfig, env *env.VarSet) (api.PortalConfig, error) {
	log.Debug("loadPortalConfig")

	if err := config.Load(&pc, env.Lookup); err != nil {
		return pc, fmt.Errorf("unable to load configuration. %v", err)
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
		pc.AuthEndpointType = string(api.Remote)
	} else {
		val, endpointTypeSupported := api.AuthEndpointTypes[pc.AuthEndpointType]
		if endpointTypeSupported {
			pc.AuthEndpointType = string(val)
		} else {
			return pc, fmt.Errorf("AUTH_ENDPOINT_TYPE: '%v' is not valid. Must be set to local or remote (defaults to remote)", pc.AuthEndpointType)
		}
	}

	log.Debugf("Portal config auth endpoint type initialised to: %v", pc.AuthEndpointType)

	// Content Security Policy. Recognized values:
	//   - unset / "default" / "on" -> the built-in defaultCSPPolicy (scoped to
	//     what the Stratos SPA + Monaco editor need)
	//   - "off" / "none" / "false" / "disabled" -> no header
	//   - anything else -> treated as a full policy string, used verbatim
	// The explicit off-values are normalized to "" so a well-meaning
	// CONSOLE_CSP=off never leaks as a literal Content-Security-Policy value.
	switch {
	case pc.CSPPolicy == "",
		strings.EqualFold(pc.CSPPolicy, "default"),
		strings.EqualFold(pc.CSPPolicy, "on"):
		pc.CSPPolicy = defaultCSPPolicy
	case strings.EqualFold(pc.CSPPolicy, "off"),
		strings.EqualFold(pc.CSPPolicy, "none"),
		strings.EqualFold(pc.CSPPolicy, "false"),
		strings.EqualFold(pc.CSPPolicy, "disabled"):
		pc.CSPPolicy = ""
	}

	// Violation reporting. Resolved here rather than per response so that the
	// policy Jetstream holds is the policy it sends, and a custom policy
	// carries the directive too — see policyWithReporting for why that is
	// worth the exception to using a custom policy verbatim.
	pc.CSPPolicy = policyWithReporting(pc.CSPPolicy)

	// A report-only policy has no built-in value: it exists to carry a
	// candidate stricter than what is enforced, and Stratos has no opinion on
	// what an operator wants to trial. Unset means no header. It gets the same
	// reporting directive, since a policy nothing reports on measures nothing.
	switch {
	case strings.EqualFold(pc.CSPReportOnlyPolicy, "off"),
		strings.EqualFold(pc.CSPReportOnlyPolicy, "none"),
		strings.EqualFold(pc.CSPReportOnlyPolicy, "false"),
		strings.EqualFold(pc.CSPReportOnlyPolicy, "disabled"):
		pc.CSPReportOnlyPolicy = ""
	}
	pc.CSPReportOnlyPolicy = policyWithReporting(pc.CSPReportOnlyPolicy)

	// HSTS. The same vocabulary as CONSOLE_CSP above, with the opposite
	// default: unset means no header.
	//   - unset / "off" / "none" / "false" / "disabled" -> no header
	//   - "on" / "default" -> defaultHSTSPolicy
	//   - anything else -> a full directive string, used verbatim
	// Off by default because HSTS is a promise about a domain, not about
	// Stratos: once a browser has seen it, that domain is HTTPS-only for the
	// max-age whether or not Stratos is still there. Only the operator knows
	// if that is safe to say, so nothing is asserted on their behalf.
	switch {
	case strings.EqualFold(pc.HSTSPolicy, "on"),
		strings.EqualFold(pc.HSTSPolicy, "default"):
		pc.HSTSPolicy = defaultHSTSPolicy
	case strings.EqualFold(pc.HSTSPolicy, "off"),
		strings.EqualFold(pc.HSTSPolicy, "none"),
		strings.EqualFold(pc.HSTSPolicy, "false"),
		strings.EqualFold(pc.HSTSPolicy, "disabled"):
		pc.HSTSPolicy = ""
	}

	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig, env *env.VarSet) (datastore.DatabaseConfig, error) {
	log.Debug("loadDatabaseConfig")

	parsedDBConfig, err := datastore.ParseCFEnvs(&dc, env)
	if err != nil {
		return dc, errors.New("could not parse Cloud Foundry Services environment")
	}

	if parsedDBConfig {
		log.Info("Using Cloud Foundry DB service")
	} else if err := config.Load(&dc, env.Lookup); err != nil {
		return dc, fmt.Errorf("unable to load database configuration. %v", err)
	}

	dc, err = datastore.NewDatabaseConnectionParametersFromConfig(dc)
	if err != nil {
		return dc, fmt.Errorf("unable to load database configuration. %v", err)
	}

	return dc, nil
}

func detectTLSCert(pc api.PortalConfig) (string, string, error) {
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

	err := os.WriteFile(certFilename, []byte(pc.TLSCert), 0600)
	if err != nil {
		return "", "", err
	}

	err = os.WriteFile(certKeyFilename, []byte(pc.TLSCertKey), 0600)
	if err != nil {
		return "", "", err
	}
	return certFilename, certKeyFilename, nil
}

func newPortalProxy(pc api.PortalConfig, dcp *sql.DB, ss HttpSessionStore, sessionStoreOptions *sessions.Options, env *env.VarSet) *portalProxy {
	log.Debug("newPortalProxy")

	// Generate cookie name - avoids issues if the cookie domain is changed
	cookieName := jetstreamSessionName
	domain := pc.CookieDomain
	if len(domain) > 0 && domain != "-" {
		h := sha1.New()
		_, _ = io.WriteString(h, domain)
		hash := fmt.Sprintf("%x", h.Sum(nil))
		cookieName = fmt.Sprintf("%s-%s", jetstreamSessionName, hash[0:10])
	}

	log.Infof("Session Cookie name: %s", cookieName)

	// Setting default value for APIKeysEnabled
	if pc.APIKeysEnabled == "" {
		log.Info(`APIKeysEnabled not set, setting to "admin_only"`)
		pc.APIKeysEnabled = config.APIKeysConfigEnum.AdminOnly
	}

	// Setting default value for UserEndpointsEnabled
	if pc.UserEndpointsEnabled == "" {
		log.Info(`UserEndpointsEnabled not set, setting to "disabled"`)
		pc.UserEndpointsEnabled = config.UserEndpointsConfigEnum.Disabled
	}

	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
		SessionStoreOptions:    sessionStoreOptions,
		SessionCookieName:      cookieName,
		EmptyCookieMatcher:     regexp.MustCompile(cookieName + "=(?:;[ ]*|$)"),
		AuthProviders:          make(map[string]api.AuthProvider),
		env:                    env,
	}

	// Initialize built-in auth providers

	// Basic Auth
	pp.AddAuthProvider(api.AuthTypeHttpBasic, api.AuthProvider{
		Handler:  pp.doHttpBasicFlowRequest,
		UserInfo: pp.GetCNSIUserFromBasicToken,
	})

	// No authentication
	pp.AddAuthProvider(api.AuthConnectTypeNone, api.AuthProvider{
		Handler:  pp.doNoAuthFlowRequest,
		UserInfo: pp.getCNSIUserForNoAuth,
	})

	// Generic Bearer Auth (HTTP Authorization header with 'bearer' prefix)
	pp.AddAuthProvider(api.AuthTypeBearer, api.AuthProvider{
		Handler: pp.doBearerFlowRequest,
		UserInfo: func(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
			// don't fetch user info for the generic token auth
			return &api.ConnectedUser{
				Name: cfTokenRecord.RefreshToken,
				GUID: cfTokenRecord.RefreshToken,
			}, true
		},
	})

	// Generic Token Auth (HTTP Authorization header with 'token' prefix)
	pp.AddAuthProvider(api.AuthTypeToken, api.AuthProvider{
		Handler: pp.doTokenFlowRequest,
		UserInfo: func(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
			// don't fetch user info for the generic token auth
			return &api.ConnectedUser{
				Name: cfTokenRecord.RefreshToken,
				GUID: cfTokenRecord.RefreshToken,
			}, true
		},
	})

	// OIDC
	pp.AddAuthProvider(api.AuthTypeOIDC, api.AuthProvider{
		Handler: pp.DoOidcFlowRequest,
	})

	var err error
	pp.APIKeysRepository, err = apikeys.NewPgsqlAPIKeysRepository(pp.DatabaseConnectionPool, pp.Config.EncryptionKeyInBytes)
	if err != nil {
		panic(fmt.Errorf("can't initialize APIKeysRepository: %v", err))
	}

	return pp
}

func echoShouldNotLog(ec *echo.Context) bool {
	// Don't log readiness probes
	return ec.Request().RequestURI == "/pp/v1/ping"
}

func start(config api.PortalConfig, p *portalProxy, needSetupMiddleware bool, isUpgrade bool, envLookup *env.VarSet) error {
	log.Debug("start")
	e := echo.New()
	// Echo v5 logs through slog and defaults to JSON on stdout; route it into
	// the application logger so format and LOG_LEVEL are consistent.
	e.Logger = newEchoLogger()

	e.Binder = new(custombinder.CustomBinder)

	// Root level middleware
	if !isUpgrade {
		e.Use(sessionCleanupMiddleware)
	}

	logAPIRequests := "true"
	if envLogAPIRequests, ok := envLookup.Lookup(LogAPIRequests); ok {
		logAPIRequests = envLogAPIRequests
	}
	if logAPIRequests == "true" {
		e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
			Skipper:          echoShouldNotLog,
			LogRemoteIP:      true,
			LogMethod:        true,
			LogURIPath:       true,
			LogStatus:        true,
			LogLatency:       true,
			LogContentLength: true,
			LogResponseSize:  true,
			LogValuesFunc: func(c *echo.Context, v middleware.RequestLoggerValues) error {
				log.Infof(`Request: [%s] Remote-IP:"%s" Method:"%s" Path:"%s" `+
					`Status:%d Latency:%s Bytes-In:%s Bytes-Out:%d`,
					v.StartTime.Format(time.RFC3339), v.RemoteIP, v.Method, v.URIPath,
					v.Status, v.Latency, v.ContentLength, v.ResponseSize)
				return nil
			},
		}))
	} else {
		log.Warn("Disabled logging of API requests received by Jetstream")
	}

	e.Use(middleware.Recover())
	// WebSocket upgrades honour the same origin allow-list as CORS.
	api.SetWebSocketAllowedOrigins(config.AllowedOrigins)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     config.AllowedOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,
	}))
	// No ContentSecurityPolicy here: the policy carries a per-response nonce,
	// and this middleware can only emit one string fixed at startup, which
	// would stamp the literal placeholder — a publicly known nonce — on every
	// response. serveIndexHTML sets the header on the one response that needs
	// it; see loadPortalConfig for how CONSOLE_CSP resolves.
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XFrameOptions: "SAMEORIGIN",
		// Every response declares its own content type; nosniff stops a
		// browser second-guessing that and reading, say, a JSON error body as
		// markup. This is the control for that, not CSP, which now only
		// accompanies the console document.
		ContentTypeNosniff: "nosniff",
	}))

	// The headers Echo's Secure middleware has no setting for, plus HSTS,
	// which it can only express as a max-age. See security_headers.go.
	e.Use(p.securityHeaders)

	if !isUpgrade {
		e.Use(errorLoggingMiddleware)
	}
	e.Use(bindToEnv(retryAfterUpgradeMiddleware, p.Env()))

	if !isUpgrade {
		p.registerRoutes(e, needSetupMiddleware)
	}

	// The serve context governs server lifetime; the upgrade watcher cancels it.
	serveContext, shutdown := context.WithCancel(context.Background())
	defer shutdown()

	if isUpgrade {
		go stopEchoWhenUpgraded(shutdown, p.Env())
	}

	if !isUpgrade {
		p.reportDeadTokensAtBoot()
	}

	if p.Config.AutoRefreshCNSITokens {
		if err := p.startCNSITokenRefreshRoutines(); err != nil {
			return err
		}
	}

	var engineErr error
	address := config.TLSAddress
	startConfig := echo.StartConfig{
		Address:    address,
		HideBanner: true,
		HidePort:   true,
	}
	if config.HTTPS {
		certFile, certKeyFile, err := detectTLSCert(config)
		if err != nil {
			return err
		}
		log.Infof("Starting HTTPS Server at address: %s", address)
		engineErr = startConfig.StartTLS(serveContext, e, certFile, certKeyFile)
	} else {
		log.Infof("Starting HTTP Server at address: %s", address)
		engineErr = startConfig.Start(serveContext, e)
	}

	if engineErr != nil {
		engineErrStr := fmt.Sprintf("%s", engineErr)
		if !strings.Contains(engineErrStr, "Server closed") {
			log.Warnf("Failed to start HTTP/S server: %+v", engineErr)
		}
	}

	return nil
}

func (p *portalProxy) GetEndpointTypeSpec(typeName string) (api.EndpointPlugin, error) {

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

// routes endpoint registration requests to Register functions of respective plugins
// based on endpoint_type parameter

// pluginRegisterRouter godoc
// @Summary Register endpoint
// @Description
// @Tags admin
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Param endpoint_type formData string true "Endpoint type"
// @Param cnsi_name formData string true "Endpoint name"
// @Param api_endpoint formData string true "Endpoint URL"
// @Param skip_ssl_validation formData string false "Skip SSL validation" Enums(true, false)
// @Param sso_allowed formData string false "SSO allowed" Enums(true, false)
// @Param cnsi_client_id formData string false "Client ID"
// @Param cnsi_client_secret formData string false "Client secret"
// @Param sub_type formData string false "Endpoint subtype"
// @Success 200 {object} api.CNSIRecord "Endpoint object"
// @Failure 400 {object} api.ErrorResponseBody "Error response"
// @Failure 401 {object} api.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /endpoints [post]
func (p *portalProxy) pluginRegisterRouter(c *echo.Context) error {
	log.Debug("pluginRegisterRouter")

	params := new(api.RegisterEndpointParams)
	err := api.BindOnce(params, c)
	if err != nil {
		return err
	}

	if params.EndpointType == "" {
		return errors.New("endpoint_type parameter is missing")
	}

	if val, ok := p.PluginRegisterRoutes[params.EndpointType]; ok {
		log.Debugf("Routing to plugin: %s.Register", params.EndpointType)
		return val(c)
	}

	return fmt.Errorf("unknown endpoint_type %s", params.EndpointType)
}

func (p *portalProxy) registerRoutes(e *echo.Echo, needSetupMiddleware bool) {
	log.Debug("registerRoutes")

	e.GET("/swagger/*", echoSwagger.WrapHandler)

	for _, plugin := range p.Plugins {
		middlewarePlugin, err := plugin.GetMiddlewarePlugin()
		if err != nil {
			// Plugin doesn't implement an middleware Plugin interface, skip
			continue
		}
		e.Use(middlewarePlugin.EchoMiddleware)
	}

	staticDir, staticDirErr := getStaticFiles(p.Env().String("UI_PATH", "./ui"))

	api := e.Group("/api")
	api.Use(p.setSecureCacheContentMiddleware)

	// Verify Session
	api.GET("/v1/auth/verify", p.verifySession)

	// Retrieve UAA token for the current session (for operator tooling, e.g. cf CLI curl commands)
	api.GET("/v1/auth/token", p.retrieveToken)

	// Always serve the backend API from /pp
	pp := e.Group("/pp")

	pp.Use(p.setSecureCacheContentMiddleware)

	// WU 0 — Track 2 wire-transfer optimization. Gzip compresses JSON API
	// responses (~3-5x on typical tabular payloads). Skipper bypasses:
	//   - WebSocket upgrades (log-stream / firehose / cfapppush / cfappssh)
	//   - CF passthrough routes (/pp/v1/proxy/...) — historical issue #2925
	//     showed gzip on passthrough responses corrupted Content-Type for
	//     Firefox. Keep gzip scoped to Stratos-shape native endpoints only.
	// MinLength=1024 skips compression for small polling responses where the
	// CPU cost would outweigh the byte savings.
	pp.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Skipper:   ppMiddlewareSkipper,
		Level:     6,
		MinLength: 1024,
	}))

	// WU 0 — wire-size instrumentation. Emits X-Stratos-Wire-Sizes on JSON
	// responses (when DIAGNOSTICS_ENABLED) with raw bytes split into
	// keys / values / structural plus the resources array length and handler
	// duration_ms. Feeds empirical measurement for whether further format
	// optimization (MessagePack, columnar tiers) would help beyond gzip.
	// Must come AFTER Gzip so it buffers the uncompressed body before gzip
	// compresses the outbound bytes. Shares the same skipper as gzip —
	// passthrough responses aren't Stratos-shape so aren't the target of
	// this instrumentation, and skipping also avoids the extra memory
	// allocation per passthrough request.
	pp.Use(p.wireSizeMiddleware)

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

	// Content-Security-Policy violation reports. Unauthenticated of necessity:
	// the login page carries the policy too, so a violation has to be
	// reportable before anyone has signed in. Registered outside sessionGroup,
	// so it takes neither the session nor the XSRF middleware — a browser
	// posting a violation report sends no XSRF token and cannot be made to.
	pp.POST("/v1/csp-report", p.receiveCSPReport, middleware.BodyLimit(cspReportBodyLimit))

	// All routes in the session group need the user to be authenticated
	sessionGroup := pp.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware())
	sessionGroup.Use(p.xsrfMiddleware())

	sessionGroup.POST("/api_keys", p.addAPIKey)
	sessionGroup.GET("/api_keys", p.listAPIKeys)
	sessionGroup.DELETE("/api_keys", p.deleteAPIKey)

	for _, plugin := range p.Plugins {
		middlewarePlugin, err := plugin.GetMiddlewarePlugin()
		if err != nil {
			// Plugin doesn't implement an middleware Plugin interface, skip
			continue
		}
		e.Use(middlewarePlugin.SessionEchoMiddleware)
	}

	apiKeyGroupConfig := MiddlewareConfig{Skipper: p.apiKeySkipper}

	// API endpoints with Swagger documentation and accessible with an API key
	stableAPIGroup := api.Group("/v1")
	stableAPIGroup.Use(p.apiKeyMiddleware)
	stableAPIGroup.Use(p.sessionMiddlewareWithConfig(apiKeyGroupConfig))
	stableAPIGroup.Use(p.xsrfMiddlewareWithConfig(apiKeyGroupConfig))

	// Connect to endpoint
	stableAPIGroup.POST("/tokens", p.loginToCNSI)

	// Disconnect endpoint
	stableAPIGroup.DELETE("/tokens/:cnsi_guid", p.logoutOfCNSI)

	// Connect to Endpoint (SSO)
	stableAPIGroup.GET("/tokens", p.ssoLoginToCNSI)

	// CNSI operations
	stableAPIGroup.GET("/endpoints", p.listCNSIs)

	// Proxy single request
	stableAPIGroup.GET("/proxy/:uuid/*", p.ProxySingleRequest)

	sessionAuthGroup := sessionGroup.Group("/auth")

	// Connect to Endpoint (SSO)
	sessionAuthGroup.GET("/tokens", p.ssoLoginToCNSI)

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

	p.PluginRegisterRoutes = make(map[string]func(*echo.Context) error)

	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err == nil {
			// Plugin supports endpoint plugin
			p.PluginRegisterRoutes[endpointPlugin.GetType()] = endpointPlugin.Register
		}

		routePlugin, err := plugin.GetRoutePlugin()
		if err == nil {
			routePlugin.AddAdminGroupRoutes(adminGroup)
		}
	}

	// API endpoints with Swagger documentation and accessible with an API key that require admin permissions
	stableAdminAPIGroup := stableAPIGroup

	// If path "/endpoints" is used, then stableAPIGroup.GET("/endpoints", p.listCNSIs) won't be executed anymore
	// static html will be returned instead. That's why we use the path ""
	stableEndpointAdminAPIGroup := stableAdminAPIGroup.Group("")

	if p.GetConfig().UserEndpointsEnabled == config.UserEndpointsConfigEnum.Enabled {
		stableEndpointAdminAPIGroup.Use(p.endpointAdminMiddleware)
		stableEndpointAdminAPIGroup.POST("/endpoints", p.pluginRegisterRouter)
		// Use middleware in route directly, because documentation is faulty
		// Apply middleware to group with .Use() when this issue is resolved:
		// https://github.com/labstack/echo/issues/1519
		stableEndpointAdminAPIGroup.POST("/endpoints/:id", p.updateEndpoint, p.endpointUpdateDeleteMiddleware)
		stableEndpointAdminAPIGroup.DELETE("/endpoints/:id", p.unregisterCluster, p.endpointUpdateDeleteMiddleware)
	} else {
		stableEndpointAdminAPIGroup.Use(p.adminMiddleware)
		stableEndpointAdminAPIGroup.POST("/endpoints", p.pluginRegisterRouter)
		stableEndpointAdminAPIGroup.POST("/endpoints/:id", p.updateEndpoint)
		stableEndpointAdminAPIGroup.DELETE("/endpoints/:id", p.unregisterCluster)
	}

	// Serve up static resources
	if staticDirErr == nil {
		e.Use(p.setStaticCacheContentMiddleware)
		log.Debug("Add URL Check Middleware")
		e.Use(p.urlCheckMiddleware)
		staticGroup := e.Group("", middleware.Gzip())
		// The SPA document is served by hand so each response can carry its own
		// CSP nonce; everything else stays on the plain static handler, which
		// 'self' already covers. A UI folder without an index.html is a
		// supported state (getStaticFiles only checks the folder), so failing
		// to read it degrades to the un-nonced static path rather than serving
		// an empty document.
		if indexHTML, readErr := os.ReadFile(path.Join(staticDir, "index.html")); readErr == nil {
			p.indexHTMLTemplate = string(indexHTML)
			// The script tags are appended by the frontend build, so no test
			// reading the source index.html can pin their form. If the build
			// ever emits a shape injectNonce cannot match, those scripts ship
			// un-nonced and a policy without 'unsafe-inline' blocks the app —
			// say so at startup rather than let it fail silently in a browser.
			if scriptNonceGap(p.indexHTMLTemplate) {
				log.Warn("index.html carries script tags injectNonce cannot match; they will be served without a CSP nonce")
			}
			staticGroup.GET("/", p.serveIndexHTML)
		} else {
			log.Warnf("Unable to read index.html; serving the UI without a CSP nonce: %v", readErr)
		}
		staticGroup.Static("/", staticDir)
		e.HTTPErrorHandler = p.getUICustomHTTPErrorHandler(staticDir, echo.DefaultHTTPErrorHandler(false))
		log.Info("Serving static UI resources")
	} else {
		// Not serving UI - use V2 Error compatability error handler
		e.HTTPErrorHandler = echoV2DefaultHTTPErrorHandler
	}
}

func (p *portalProxy) AddLoginHook(priority int, function api.LoginHookFunc) error {
	p.GetConfig().LoginHooks = append(p.GetConfig().LoginHooks, api.LoginHook{
		Priority: priority,
		Function: function,
	})
	return nil
}

func (p *portalProxy) ExecuteLoginHooks(c *echo.Context) error {
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
		return fmt.Errorf("failed to execute one or more login hooks")
	}
	return nil
}

// Custom error handler to let Angular app handle application URLs (catches non-backend 404 errors)
func (p *portalProxy) getUICustomHTTPErrorHandler(staticDir string, defaultHandler echo.HTTPErrorHandler) echo.HTTPErrorHandler {
	return func(c *echo.Context, err error) {
		// echo.StatusCode handles both *echo.HTTPError and the router's
		// predefined errors (echo.ErrNotFound and friends), which are no longer
		// *HTTPError in v5. A plain type assertion would miss them and turn
		// every deep-link 404 into a 500, breaking SPA routing.
		code := echo.StatusCode(err)
		if code == 0 {
			code = http.StatusInternalServerError
		}

		// If this was not a back-end request and the error code is 404, serve the app and let it route
		if strings.Index(c.Request().RequestURI, "/pp") != 0 && code == 404 {
			// Deep links reach the SPA through here, not through GET "/", so
			// this path needs the same nonce treatment. The header has to be
			// set before the first write, as the default handler below writes
			// again.
			var fileErr error
			if p.indexHTMLTemplate != "" {
				fileErr = p.serveIndexHTML(c)
			} else {
				fileErr = c.File(path.Join(staticDir, "index.html"))
			}
			if fileErr != nil {
				log.Warnf("Unable to serve index.html: %v", fileErr)
			}
			// Let the default handler handle it
			defaultHandler(c, err)
		} else {
			// Use V2 Error compatability error handler
			echoV2DefaultHTTPErrorHandler(c, err)
		}
	}
}

// EchoV2DefaultHTTPErrorHandler ensures we get V2 error behaviour
// i.e. no wrapping in 'message' JSON object
func echoV2DefaultHTTPErrorHandler(c *echo.Context, err error) {

	// See the note in getUICustomHTTPErrorHandler: v5's predefined router
	// errors do not satisfy *echo.HTTPError, so ask for the status code.
	code := echo.StatusCode(err)
	if code == 0 {
		code = http.StatusInternalServerError
	}
	msg := http.StatusText(code)
	if he, ok := err.(*echo.HTTPError); ok && he.Message != "" {
		msg = he.Message
	}

	// Send response
	response, unwrapErr := echo.UnwrapResponse(c.Response())
	if unwrapErr != nil || !response.Committed {
		var writeErr error
		if c.Request().Method == http.MethodHead { // Issue #608
			writeErr = c.NoContent(code)
		} else {
			writeErr = c.String(code, msg)
		}
		if writeErr != nil {
			c.Logger().Error("could not write error response", "error", writeErr)
		}
	}

	// Always log error
	if err != nil {
		c.Logger().Error("request failed", "error", err)
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

func stopEchoWhenUpgraded(shutdown context.CancelFunc, env *env.VarSet) {
	for isConsoleUpgrading(env) {
		time.Sleep(1 * time.Second)
	}
	log.Info("Upgrade has completed! Shutting down Upgrade web server instance")
	// v5 drives server lifetime from the context handed to StartConfig, so
	// cancelling it is what shuts the upgrade listener down.
	shutdown()
}

// GetStoreFactory gets the store factory
func (portalProxy *portalProxy) GetStoreFactory() api.StoreFactory {
	return portalProxy.StoreFactory
}

// SetStoreFactory sets the store factory
func (portalProxy *portalProxy) SetStoreFactory(f api.StoreFactory) api.StoreFactory {
	old := portalProxy.StoreFactory
	portalProxy.StoreFactory = f
	return old
}

// SetContext sets the context
func (portalProxy *portalProxy) SetRefreshRoutineContext(ctx context.Context, cancel context.CancelFunc) {
	portalProxy.refreshRoutines.context = ctx
	portalProxy.refreshRoutines.cancel = cancel
}
