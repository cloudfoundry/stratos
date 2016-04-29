package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/gorilla/sessions"
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

	// Load portal configuration
	if _, err := toml.DecodeFile("portal-config.toml", &portalConfig); err != nil {
		fmt.Println(err)
		return
	}
	portalProxy := newPortalProxy(portalConfig)

	if portalConfig.Dev {
		initializeHTTPClient(portalConfig.DevConfig.SkipTLSVerification, portalConfig.HTTPClientTimeout)
	} else {
		initializeHTTPClient(portalConfig.SkipTLSVerification, portalConfig.HTTPClientTimeout)
	}

	start(portalProxy)
}

func newPortalProxy(pc portalConfig) *portalProxy {
	pp := &portalProxy{
		UAATokenMap:  make(map[string]tokenRecord),
		CNSITokenMap: make(map[string]tokenRecord),
		CNSIs:        make(map[string]cnsiRecord),
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

func start(p *portalProxy) {
	e := echo.New()
	// Root level middleware
	e.Use(sessionCleanupMiddleware)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(errorLoggingMiddleware)

	p.initCookieStore()
	p.registerRoutes(e)

	engine := standard.WithTLS(p.Config.TLSAddress, p.Config.TLSCertFile, p.Config.TLSCertKey)
	//engine.Server.TLSNextProto = make(map[string]func(*http.Server, *tls.Conn, http.Handler))
	e.Run(engine)
}

func (p *portalProxy) initCookieStore() {
	p.CookieStore = sessions.NewCookieStore([]byte(p.Config.CookieStoreSecret))
}

func (p *portalProxy) registerRoutes(e *echo.Echo) {
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
