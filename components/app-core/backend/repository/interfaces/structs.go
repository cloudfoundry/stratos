package interfaces

import (
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
)

type V2Info struct {
	AuthorizationEndpoint  string `json:"authorization_endpoint"`
	TokenEndpoint          string `json:"token_endpoint"`
	DopplerLoggingEndpoint string `json:"doppler_logging_endpoint"`
}

type InfoFunc func(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, error)

//TODO this could be moved back to cnsis subpackage, and extensions could import it?
type CNSIRecord struct {
	GUID                   string   `json:"guid"`
	Name                   string   `json:"name"`
	CNSIType               string   `json:"cnsi_type"`
	APIEndpoint            *url.URL `json:"api_endpoint"`
	AuthorizationEndpoint  string   `json:"authorization_endpoint"`
	TokenEndpoint          string   `json:"token_endpoint"`
	DopplerLoggingEndpoint string   `json:"doppler_logging_endpoint"`
	SkipSSLValidation      bool     `json:"skip_ssl_validation"`
}

//TODO this could be moved back to tokens subpackage, and extensions could import it?
type TokenRecord struct {
	AuthToken    string
	RefreshToken string
	TokenExpiry  int64
}

type CFInfo struct {
	EndpointGUID string
	SpaceGUID    string
	AppGUID      string
}

type VCapApplicationData struct {
	API           string `json:"cf_api"`
	ApplicationID string `json:"application_id"`
	SpaceID       string `json:"space_id"`
}

type LoginRes struct {
	Account     string   `json:"account"`
	TokenExpiry int64    `json:"token_expiry"`
	APIEndpoint *url.URL `json:"api_endpoint"`
	Admin       bool     `json:"admin"`
}

type LoginHookFunc func(c echo.Context) error

type SessionStorer interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error
}

// ConnectedUser - details about the user connected to a specific service or UAA
type ConnectedUser struct {
	GUID  string `json:"guid"`
	Name  string `json:"name"`
	Admin bool   `json:"admin"`
}

type PortalConfig struct {
	HTTPClientTimeoutInSecs     int64    `configName:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	HTTPConnectionTimeoutInSecs int64    `configName:"HTTP_CONNECTION_TIMEOUT_IN_SECS"`
	SkipTLSVerification         bool     `configName:"SKIP_TLS_VERIFICATION"`
	TLSAddress                  string   `configName:"CONSOLE_PROXY_TLS_ADDRESS"`
	TLSCert                     string   `configName:"CONSOLE_PROXY_CERT"`
	TLSCertKey                  string   `configName:"CONSOLE_PROXY_CERT_KEY"`
	ConsoleClient               string   `configName:"CONSOLE_CLIENT"`
	ConsoleClientSecret         string   `configName:"CONSOLE_CLIENT_SECRET"`
	CFClient                    string   `configName:"CF_CLIENT"`
	CFClientSecret              string   `configName:"CF_CLIENT_SECRET"`
	UAAEndpoint                 string   `configName:"UAA_ENDPOINT"`
	AllowedOrigins              []string `configName:"ALLOWED_ORIGINS"`
	SessionStoreSecret          string   `configName:"SESSION_STORE_SECRET"`
	EncryptionKeyVolume         string   `configName:"ENCRYPTION_KEY_VOLUME"`
	EncryptionKeyFilename       string   `configName:"ENCRYPTION_KEY_FILENAME"`
	EncryptionKey               string   `configName:"ENCRYPTION_KEY"`
	UAAAdminIdentifier          string
	CFAdminIdentifier           string
	CloudFoundryInfo            *CFInfo
	HTTPS                       bool
	EncryptionKeyInBytes        []byte
	ConsoleVersion              string
	IsCloudFoundry              bool
	LoginHook                   LoginHookFunc
	SessionStore                SessionStorer
}
