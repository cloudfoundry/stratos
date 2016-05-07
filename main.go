package main

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	"github.com/hpcloud/ucpconfig"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"

	mysql "portal-proxy/mysql"
)

var (
	httpClient = http.Client{}
)

func main() {
	log.SetOutput(os.Stdout)

	var portalConfig portalConfig

	// Load portal configuration
	if err := ucpconfig.Load(&portalConfig); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	portalProxy := newPortalProxy(portalConfig)

	initializeHTTPClient(portalConfig.SkipTLSVerification, time.Duration(portalConfig.HTTPClientTimeout))

	if err := start(portalProxy); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func createTempCertFiles(pc portalConfig) (string, string, error) {
	certFilename := "pproxy.crt"
	certKeyFilename := "pproxy.key"
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

func newPortalProxy(pc portalConfig) *portalProxy {
	pp := &portalProxy{
		// UAATokenMap:  make(map[string]tokenRecord),
		// CNSITokenMap: make(map[string]tokens.TokenRecord),
		// CNSIs:        make(map[string]cnsiRecord),
		Config:       pc,
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

	p.initMysqlStore()
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

func (p *portalProxy) initMysqlStore() {
	var dbconfig mysql.MysqlConnectionParameters
	var err error
	dbconfig, err = mysql.NewMySQLConnectionParametersFromEnvironment()
	if err != nil {
		panic("Unable to load database configuration.")
	} else {
		p.DatabaseConfig = dbconfig
	}
}

func (p *portalProxy) initCookieStore() {
	p.CookieStore = sessions.NewCookieStore([]byte(p.Config.CookieStoreSecret))
}

func (p *portalProxy) registerRoutes(e *echo.Echo) {

	// TODO: remove prior to shipping
	if p.Config.Dev {
		e.Static("/*", "demo")
	}

	e.Post("/v1/auth/login/uaa", p.loginToUAA)
	e.Post("/v1/auth/logout", p.logout)

	sessionGroup := e.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)
	sessionGroup.Post("/auth/login/cnsi", p.loginToCNSI)
	sessionGroup.Post("/register/hcf", p.registerHCFCluster)
	sessionGroup.Get("/cnsis", p.listRegisteredCNSIs)
	group := sessionGroup.Group("/proxy")
	group.Get("/*", p.proxy)
}
