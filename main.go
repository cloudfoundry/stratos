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

	var (
		portalConfig portalConfig
		portalProxy  portalProxy
	)

	// Load portal configuration
	if _, err := toml.DecodeFile("portal-config.toml", &portalConfig); err != nil {
		fmt.Println(err)
		return
	}
	portalProxy.Config = portalConfig

	// initialize temporary data maps
	portalProxy.TokenMap = make(map[string]tokenRecord)
	portalProxy.CNSIs = make(map[string]cnsiRecord)

	tr := &http.Transport{}
	if portalConfig.Dev {
		tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: portalConfig.DevConfig.SkipTLSVerification}
	} else {
		tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: portalConfig.SkipTLSVerification}
	}

	httpClient.Transport = tr
	httpClient.Timeout = time.Second * portalConfig.HTTPClientTimeout

	start(&portalProxy)

}

func start(p *portalProxy) {
	e := echo.New()
	// Root level middleware
	e.Use(sessionCleanupMiddleware)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	initCookieStore(p)
	registerRoutes(e, p)

	e.Run(standard.NewFromTLS(p.Config.TLSAddress, p.Config.TLSCertFile, p.Config.TLSCertKey))
}

// sync.RWMutex

func initCookieStore(p *portalProxy) {
	p.CookieStore = sessions.NewCookieStore([]byte(p.Config.CookieStoreSecret))
}

func registerRoutes(e *echo.Echo, p *portalProxy) {
	e.Post("/v1/auth/login", p.login)
	e.Post("/v1/auth/logout", p.logout)

	sessionGroup := e.Group("/v1")
	sessionGroup.Use(p.sessionMiddleware)
	sessionGroup.Post("/register/hcf", p.registerHCFCluster)
	group := e.Group("/proxy")
	group.Get("/hcf", hcf)
	group.Get("/hce", hce)
}
