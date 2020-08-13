package interfaces

import (
	"database/sql"
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"
)

type PortalProxy interface {
	GetHttpClient(skipSSLValidation bool) http.Client
	GetHttpClientForRequest(req *http.Request, skipSSLValidation bool) http.Client
	RegisterEndpoint(c echo.Context, fetchInfo InfoFunc) error
	DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, ssoAllowed bool, subType string, fetchInfo InfoFunc) (CNSIRecord, error)
	GetEndpointTypeSpec(typeName string) (EndpointPlugin, error)

	// Auth
	GetStratosAuthService() StratosAuth
	ConnectOAuth2(c echo.Context, cnsiRecord CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	// Session
	GetSession(c echo.Context) (*sessions.Session, error)
	GetSessionValue(c echo.Context, key string) (interface{}, error)
	GetSessionInt64Value(c echo.Context, key string) (int64, error)
	GetSessionStringValue(c echo.Context, key string) (string, error)
	SaveSession(c echo.Context, session *sessions.Session) error
	GetSessionDataStore() SessionDataStore

	RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error)
	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord CNSIRecord) error

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
	UpdateEndpointMetadata(guid string, metadata string) error

	// UAA Token
	GetUAATokenRecord(userGUID string) (TokenRecord, error)
	RefreshUAAToken(userGUID string) (TokenRecord, error)
	RefreshUAALogin(username, password string, store bool) error
	GetUserTokenInfo(tok string) (u *JWTUserTokenInfo, err error)

	// Proxy API requests
	ProxyRequest(c echo.Context, uri *url.URL) (map[string]*CNSIRequest, error)
	DoProxyRequest(requests []ProxyRequestInfo) (map[string]*CNSIRequest, error)
	DoProxySingleRequest(cnsiGUID, userGUID, method, requestUrl string, headers http.Header, body []byte) (*CNSIRequest, error)
	SendProxiedResponse(c echo.Context, responses map[string]*CNSIRequest) error

	// Database Connection
	GetDatabaseConnection() *sql.DB

	AddAuthProvider(name string, provider AuthProvider)
	GetAuthProvider(name string) AuthProvider
	HasAuthProvider(name string) bool
	DoAuthFlowRequest(cnsiRequest *CNSIRequest, req *http.Request, authHandler AuthHandlerFunc) (*http.Response, error)
	OAuthHandlerFunc(cnsiRequest *CNSIRequest, req *http.Request, refreshOAuthTokenFunc RefreshOAuthTokenFunc) AuthHandlerFunc
	DoOAuthFlowRequest(cnsiRequest *CNSIRequest, req *http.Request) (*http.Response, error)
	DoOidcFlowRequest(cnsiRequest *CNSIRequest, req *http.Request) (*http.Response, error)
	GetCNSIUserFromOAuthToken(cnsiGUID string, cfTokenRecord *TokenRecord) (*ConnectedUser, bool)

	// Tokens - lower-level access
	SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord TokenRecord) error
	DeleteEndpointToken(cnsiGUID string, userGUID string) error
	AddLoginHook(priority int, function LoginHookFunc) error
	ExecuteLoginHooks(c echo.Context) error

	// Plugins
	GetPlugin(name string) interface{}
}
