package main

import (
	"database/sql"
	"net/http"
	"net/url"
	"regexp"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"
)

type portalProxyImpl struct {
	Config                 interfaces.PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           interfaces.SessionStorer
	SessionStoreOptions    *sessions.Options
	Plugins                map[string]interfaces.StratosPlugin
	PluginsStatus          map[string]bool
	Diagnostics            *interfaces.Diagnostics
	SessionCookieName      string
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	env                    *env.VarSet
	AuthService            AuthInterface
}

type PortalProxyInterface interface {
	AuthInterface

	GetHttpClient(skipSSLValidation bool) http.Client
	GetHttpClientForRequest(req *http.Request, skipSSLValidation bool) http.Client
	RegisterEndpoint(c echo.Context, fetchInfo InfoFunc) error

	DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, ssoAllowed bool, subType string, fetchInfo InfoFunc) (CNSIRecord, error)

	GetEndpointTypeSpec(typeName string) (EndpointPlugin, error)

	// Auth
	ConnectOAuth2(c echo.Context, cnsiRecord CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	// Session
	GetSession(c echo.Context) (*sessions.Session, error)
	GetSessionValue(c echo.Context, key string) (interface{}, error)
	GetSessionInt64Value(c echo.Context, key string) (int64, error)
	GetSessionStringValue(c echo.Context, key string) (string, error)
	SaveSession(c echo.Context, session *sessions.Session) error

	// Expose internal portal proxy records to extensions
	GetCNSIRecord(guid string) (CNSIRecord, error)
	GetCNSIRecordByEndpoint(endpoint string) (CNSIRecord, error)
	GetCNSITokenRecord(cnsiGUID string, userGUID string) (TokenRecord, bool)
	GetCNSITokenRecordWithDisconnected(cnsiGUID string, userGUID string) (TokenRecord, bool)
	GetCNSIUser(cnsiGUID string, userGUID string) (*ConnectedUser, bool)
	GetConfig() *PortalConfig
	Env() *env.VarSet
	ListEndpointsByUser(userGUID string) ([]*ConnectedEndpoint, error)
	ListEndpoints() ([]*CNSIRecord, error)
	UpdateEndointMetadata(guid string, metadata string) error

	// Proxy API requests
	ProxyRequest(c echo.Context, uri *url.URL) (map[string]*CNSIRequest, error)
	DoProxyRequest(requests []ProxyRequestInfo) (map[string]*CNSIRequest, error)
	DoProxySingleRequest(cnsiGUID, userGUID, method, requestUrl string, headers http.Header, body []byte) (*CNSIRequest, error)
	SendProxiedResponse(c echo.Context, responses map[string]*CNSIRequest) error

	// Database Connection
	GetDatabaseConnection() *sql.DB
	AddAuthProvider(name string, provider AuthProvider)
	GetAuthProvider(name string) AuthProvider
	DoAuthFlowRequest(cnsiRequest *CNSIRequest, req *http.Request, authHandler AuthHandlerFunc) (*http.Response, error)
	OAuthHandlerFunc(cnsiRequest *CNSIRequest, req *http.Request, refreshOAuthTokenFunc RefreshOAuthTokenFunc) AuthHandlerFunc

	// Tokens - lower-level access
	SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord TokenRecord) error
	DeleteEndpointToken(cnsiGUID string, userGUID string) error

	AddLoginHook(priority int, function LoginHookFunc) error
	ExecuteLoginHooks(c echo.Context) error

	// Plugins
	GetPlugin(name string) interface{}

	// SetCanPerformMigrations updates the state that records if we can perform Database migrations
	SetCanPerformMigrations(bool)

	// CanPerformMigrations returns if we can perform Database migrations
	CanPerformMigrations() bool
}
