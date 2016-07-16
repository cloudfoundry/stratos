package main

import (
	"crypto/tls"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/antonlindstrom/pgstore"
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

	log.Println("Proxy initialization started.")

	var portalConfig portalConfig
	portalConfig, err := loadPortalConfig(portalConfig)
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}
	log.Println("Proxy configuration loaded.")

	initializeHTTPClient(portalConfig.SkipTLSVerification,
		time.Duration(portalConfig.HTTPClientTimeoutInSecs)*time.Second)
	log.Println("HTTP client initialized.")

	portalConfig.EncryptionKeyInBytes, err = setEncryptionKey(portalConfig)
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}
	log.Println("Encryption key set.")

	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = initConnPool()
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}
	defer databaseConnectionPool.Close()
	log.Println("Proxy database connection pool created.")

	sessionStore := initSessionStore(databaseConnectionPool, portalConfig)
	defer sessionStore.Close()
	defer sessionStore.StopCleanup(sessionStore.Cleanup(time.Minute * 5))
	log.Println("Proxy session store initialized.")

	portalProxy := newPortalProxy(portalConfig, databaseConnectionPool, sessionStore)
	log.Println("Proxy waiting for requests.")

	log.Println("Proxy config at startup")
	log.Printf("%+v\n", portalConfig)
	if err := start(portalProxy); err != nil {
		log.Printf("Unable to start the proxy: %v", err)
		os.Exit(1)
	}
}

// TODO (wchrisjohnson): This should be changed to pull in the encryption key from the env.
// For the time being, I am just generating a 256 bit / 32 byte / AES-256 encryption key
// here. By  the time I am done with this PR, this will come in via the env var.
func setEncryptionKey(pc portalConfig) ([]byte, error) {
	log.Println("setEncryptionKey")
	key := make([]byte, 32)
	_, err := rand.Read(key)

	if err != nil {
		return nil, err
	}

	// b64.StdEncoding.DecodeString(p.Config.EncryptionKey)
	// portalConfig.EncryptionKey = b64.StdEncoding.EncodeToString(key)

	return key, nil
}

func initConnPool() (*sql.DB, error) {
	log.Println("initConnPool")
	// load up postgresql database configuration
	var databaseConfig datastore.DatabaseConfig
	databaseConfig, err := loadDatabaseConfig(databaseConfig)
	if err != nil {
		return nil, err
	}

	// initialize the database connection pool
	var databaseConnectionPool *sql.DB
	databaseConnectionPool, err = datastore.GetConnection(databaseConfig)
	if err != nil {
		return nil, err
	}

	return databaseConnectionPool, nil
}

func initSessionStore(db *sql.DB, pc portalConfig) *pgstore.PGStore {
	log.Println("initSessionStore")
	store := pgstore.NewPGStoreFromPool(db, []byte(pc.SessionStoreSecret))

	return store
}

func loadPortalConfig(pc portalConfig) (portalConfig, error) {
	log.Println("loadPortalConfig")
	if err := ucpconfig.Load(&pc); err != nil {
		return pc, fmt.Errorf("Unable to load portal configuration. %v", err)
	}
	return pc, nil
}

func loadDatabaseConfig(dc datastore.DatabaseConfig) (datastore.DatabaseConfig, error) {
	log.Println("loadDatabaseConfig")
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
	log.Println("createTempCertFiles")
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
	log.Println("newPortalProxy")
	pp := &portalProxy{
		Config:                 pc,
		DatabaseConnectionPool: dcp,
		SessionStore:           ss,
	}

	return pp
}

func initializeHTTPClient(skipCertVerification bool, timeoutInSeconds time.Duration) {
	log.Println("initializeHTTPClient")
	tr := &http.Transport{Proxy: http.ProxyFromEnvironment}
	if skipCertVerification {
		tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	httpClient.Transport = tr
	httpClient.Timeout = time.Second * timeoutInSeconds
}

func start(p *portalProxy) error {
	log.Println("start")
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
	log.Println("registerRoutes")

	e.POST("/v1/auth/login/uaa", p.loginToUAA)
	e.POST("/v1/auth/logout", p.logout)

	sessionGroup := e.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)

	// Connect to HCF cluster
	sessionGroup.POST("/auth/login/cnsi", p.loginToCNSI)

	// Disconnect HCF cluster
	sessionGroup.POST("/auth/logout/cnsi", p.logoutOfCNSI)

	// Verify Session
	sessionGroup.GET("/auth/session/verify", p.verifySession)

	// These URLs should be prefixed with "/v1"
	sessionGroup.GET("/github/oauth/auth", p.handleGitHubAuth)
	sessionGroup.GET("/github/oauth/callback", p.handleGitHubCallback)

	// Register clusters
	sessionGroup.POST("/register/hcf", p.registerHCFCluster)
	sessionGroup.POST("/register/hce", p.registerHCECluster)

	// TODO(wchrisjohnson): revisit the API and fix these wonky calls.  https://jira.hpcloud.net/browse/TEAMFOUR-620
	sessionGroup.POST("/unregister", p.unregisterCluster)
	// sessionGroup.DELETE("/cnsis", p.removeCluster)

	// CNSI operations
	sessionGroup.GET("/cnsis", p.listCNSIs)
	sessionGroup.GET("/cnsis/registered", p.listRegisteredCNSIs)

	// Applications Log Streams
	sessionGroup.GET("/:cnsiGuid/apps/:appGuid/stream", p.appStream)

	// Stackato info
	sessionGroup.GET("/stackato/info", p.stackatoInfo)

	// Version info
	sessionGroup.GET("/version", p.getVersions)

	group := sessionGroup.Group("/proxy")
	group.Any("/*", p.proxy)
}
