package interfaces

import (
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
)

type AuthHandlerFunc func(tokenRec TokenRecord, cnsi CNSIRecord) (*http.Response, error)
type RefreshOAuthTokenFunc func(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error)

type GetUserInfoFromToken func(cnsiGUID string, cfTokenRecord *TokenRecord) (*ConnectedUser, bool)

type AuthFlowHandlerFunc func(cnsiRequest *CNSIRequest, req *http.Request) (*http.Response, error)

type AuthProvider struct {
	Handler  AuthFlowHandlerFunc
	UserInfo GetUserInfoFromToken
}

// V2Info is the response for the Cloud Foundry /v2/info API
type V2Info struct {
	AuthorizationEndpoint    string `json:"authorization_endpoint"`
	TokenEndpoint            string `json:"token_endpoint"`
	DopplerLoggingEndpoint   string `json:"doppler_logging_endpoint"`
	AppSSHEndpoint           string `json:"app_ssh_endpoint"`
	AppSSHHostKeyFingerprint string `json:"app_ssh_host_key_fingerprint"`
	AppSSHOauthCLient        string `json:"app_ssh_oauth_client"`
	APIVersion               string `json:"api_version"`
	RoutingEndpoint          string `json:"routing_endpoint"`
	MinCLIVersion            string `json:"min_cli_version"`
	MinRecommendedCLIVersion string `json:"min_recommended_cli_version"`
}

type InfoFunc func(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, interface{}, error)

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
	ClientId               string   `json:"client_id"`
	ClientSecret           string   `json:"-"`
	SSOAllowed             bool     `json:"sso_allowed"`
	SubType                string   `json:"sub_type"`
	Metadata               string   `json:"metadata"`
}

// ConnectedEndpoint
type ConnectedEndpoint struct {
	GUID                   string   `json:"guid"`
	Name                   string   `json:"name"`
	CNSIType               string   `json:"cnsi_type"`
	APIEndpoint            *url.URL `json:"api_endpoint"`
	Account                string   `json:"account"`
	TokenExpiry            int64    `json:"token_expiry"`
	DopplerLoggingEndpoint string   `json:"-"`
	AuthorizationEndpoint  string   `json:"-"`
	SkipSSLValidation      bool     `json:"skip_ssl_validation"`
	TokenMetadata          string   `json:"-"`
	SubType                string   `json:"sub_type"`
	EndpointMetadata       string   `json:"metadata"`
}

const (
	// AuthTypeOAuth2 means OAuth2
	AuthTypeOAuth2 = "OAuth2"
	// AuthTypeOIDC means OIDC
	AuthTypeOIDC = "OIDC"
	// AuthTypeHttpBasic means HTTP Basic auth
	AuthTypeHttpBasic = "HttpBasic"
)

const (
	// AuthConnectTypeCreds means authenticate with username/password credentials
	AuthConnectTypeCreds = "creds"
	// AuthConnectTypeNone means no authentication
	AuthConnectTypeNone = "none"
)

// // Token record for an endpoint (includes the Endpoint GUID)
// type EndpointTokenRecord struct {
// 	*TokenRecord
// 	EndpointGUID    string
// 	EndpointType    string
// 	APIEndpint      string
// 	LoggingEndpoint string
// }

// BackupTokenRecord used when backing up tokens
type BackupTokenRecord struct {
	TokenRecord  TokenRecord
	UserGUID     string
	EndpointGUID string
	TokenType    string
}

// TokenRecord repsrents and endpoint or uaa token
type TokenRecord struct {
	TokenGUID      string
	AuthToken      string
	RefreshToken   string
	TokenExpiry    int64
	Disconnected   bool
	AuthType       string
	Metadata       string
	SystemShared   bool
	LinkedGUID     string // Indicates the GUID of the token that this token is linked to (if any)
	Certificate    string
	CertificateKey string
}

type CFInfo struct {
	EndpointGUID string
	SpaceGUID    string
	AppGUID      string
}

// Structure for optional metadata for an OAuth2 Token
type OAuth2Metadata struct {
	ClientID     string
	ClientSecret string
	IssuerURL    string
}

type VCapApplicationData struct {
	API           string `json:"cf_api"`
	ApplicationID string `json:"application_id"`
	SpaceID       string `json:"space_id"`
}

type LoginRes struct {
	Account     string         `json:"account"`
	TokenExpiry int64          `json:"token_expiry"`
	APIEndpoint *url.URL       `json:"api_endpoint"`
	Admin       bool           `json:"admin"`
	User        *ConnectedUser `json:"user"`
}

type LocalLoginRes struct {
	User *ConnectedUser `json:"user"`
}

type LoginHookFunc func(c echo.Context) error
type LoginHook struct {
	Priority int
	Function LoginHookFunc
}

type ProxyRequestInfo struct {
	EndpointGUID string
	URI          *url.URL
	UserGUID     string
	ResultGUID   string
	Headers      http.Header
	Body         []byte
	Method       string
}

type SessionStorer interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error
}

// ConnectedUser - details about the user connected to a specific service or UAA
type ConnectedUser struct {
	GUID   string   `json:"guid"`
	Name   string   `json:"name"`
	Admin  bool     `json:"admin"`
	Scopes []string `json:"scopes"`
}

type JWTUserTokenInfo struct {
	UserGUID    string   `json:"user_id"`
	UserName    string   `json:"user_name"`
	TokenExpiry int64    `json:"exp"`
	Scope       []string `json:"scope"`
}

// Diagnostics - Diagnostic metadata
type Diagnostics struct {
	DeploymentType   string                  `json:"deploymentType"`
	GitClientVersion string                  `json:"gitClientVersion"`
	DBMigrations     []*GooseDBVersionRecord `json:"databaseMigrations"`
	DatabaseBackend  string                  `json:"databaseBackend"`
	HelmName         string                  `json:"helmName,omitempty"`
	HelmRevision     string                  `json:"helmRevision,omitempty"`
	HelmChartVersion string                  `json:"helmChartVersion,omitempty"`
	HelmLastModified string                  `json:"helmLastModified,omitempty"`
}

// GooseDBVersionRecord - the version record in the database that Goose reads/writes
type GooseDBVersionRecord struct {
	ID        int64  `json:"id"`
	VersionID int64  `json:"version_id"`
	IsApplied bool   `json:"is_applied"`
	Timestamp string `json:"timestamp"`
}

// Info - this represents user specific info
type Info struct {
	Versions      *Versions                             `json:"version"`
	User          *ConnectedUser                        `json:"user"`
	Endpoints     map[string]map[string]*EndpointDetail `json:"endpoints"`
	CloudFoundry  *CFInfo                               `json:"cloud-foundry,omitempty"`
	Plugins       map[string]bool                       `json:"plugins"`
	PluginConfig  map[string]string                     `json:"plugin-config,omitempty"`
	Diagnostics   *Diagnostics                          `json:"diagnostics,omitempty"`
	Configuration struct {
		TechPreview        bool  `json:"enableTechPreview"`
		ListMaxSize        int64 `json:"listMaxSize,omitempty"`
		ListAllowLoadMaxed bool  `json:"listAllowLoadMaxed,omitempty"`
	} `json:"config"`
}

// EndpointDetail extends CNSI Record and adds the user
type EndpointDetail struct {
	*CNSIRecord
	EndpointMetadata  interface{}       `json:"endpoint_metadata,omitempty"`
	User              *ConnectedUser    `json:"user"`
	Metadata          map[string]string `json:"metadata,omitempty"`
	TokenMetadata     string            `json:"-"`
	SystemSharedToken bool              `json:"system_shared_token"`
}

// Versions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion int64  `json:"database_version"`
}

//AuthEndpointType - Restrict the possible values of the configured
type AuthEndpointType string

const (
	//Remote - String representation of remote auth endpoint type
	Remote AuthEndpointType = "remote"
	//Local - String representation of remote auth endpoint type
	Local AuthEndpointType = "local"
)

//AuthEndpointTypes - Allows lookup of internal string representation by the
//value of the AUTH_ENDPOINT_TYPE env variable
var AuthEndpointTypes = map[string]AuthEndpointType{
	"remote": Remote,
	"local":  Local,
}

// ConsoleConfig is essential configuration settings
type ConsoleConfig struct {
	UAAEndpoint           *url.URL `json:"uaa_endpoint" configName:"UAA_ENDPOINT"`
	AuthorizationEndpoint *url.URL `json:"authorization_endpoint" configName:"AUTHORIZATION_ENDPOINT"`
	ConsoleAdminScope     string   `json:"console_admin_scope" configName:"CONSOLE_ADMIN_SCOPE"`
	ConsoleClient         string   `json:"console_client" configName:"CONSOLE_CLIENT"`
	ConsoleClientSecret   string   `json:"console_client_secret" configName:"CONSOLE_CLIENT_SECRET"`
	LocalUser             string   `json:"local_user"`
	LocalUserPassword     string   `json:"local_user_password"`
	LocalUserScope        string   `json:"local_user_scope"`
	AuthEndpointType      string   `json:"auth_endpoint_type" configName:"AUTH_ENDPOINT_TYPE"`
	SkipSSLValidation     bool     `json:"skip_ssl_validation" configName:"SKIP_SSL_VALIDATION"`
	UseSSO                bool     `json:"use_sso" configName:"SSO_LOGIN"`
}

const defaultAdminScope = "stratos.admin"

// IsSetupComplete indicates if we have enough config
func (consoleConfig *ConsoleConfig) IsSetupComplete() bool {

	// Local user - check setup complete
	if AuthEndpointTypes[consoleConfig.AuthEndpointType] == Local {

		// Need LocalUser and LocalUserPassword
		if len(consoleConfig.LocalUser) == 0 || len(consoleConfig.LocalUserPassword) == 0 {
			return false
		}

		// Also, we will make sure that admin scopes are set up for admin, if not specified
		if len(consoleConfig.LocalUserScope) == 0 {
			if len(consoleConfig.ConsoleAdminScope) == 0 {
				// Neither set, so use default for both
				consoleConfig.LocalUserScope = defaultAdminScope
				consoleConfig.ConsoleAdminScope = defaultAdminScope
			} else {
				// admin scope set, so just use that
				consoleConfig.LocalUserScope = consoleConfig.ConsoleAdminScope
			}
		} else {
			if len(consoleConfig.ConsoleAdminScope) == 0 {
				// Console admin scope not set, so use local user scope
				consoleConfig.ConsoleAdminScope = consoleConfig.LocalUserScope
			}
		}

		// Setup is complete if we have LocalUser and LocalUserPassword set
		return true
	}

	// UAA - check setup complete for UAA
	if consoleConfig.UAAEndpoint == nil {
		return false
	}

	return len(consoleConfig.UAAEndpoint.String()) > 0 && len(consoleConfig.ConsoleAdminScope) > 0
}

// CNSIRequest
type CNSIRequest struct {
	GUID     string `json:"-"`
	UserGUID string `json:"-"`

	Method      string      `json:"-"`
	Body        []byte      `json:"-"`
	Header      http.Header `json:"-"`
	URL         *url.URL    `json:"-"`
	StatusCode  int         `json:"statusCode"`
	Status      string      `json:"status"`
	PassThrough bool        `json:"-"`
	LongRunning bool        `json:"-"`

	Response     []byte `json:"-"`
	Error        error  `json:"-"`
	ResponseGUID string `json:"-"`
}

type PortalConfig struct {
	HTTPClientTimeoutInSecs            int64    `configName:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	HTTPClientTimeoutMutatingInSecs    int64    `configName:"HTTP_CLIENT_TIMEOUT_MUTATING_IN_SECS"`
	HTTPClientTimeoutLongRunningInSecs int64    `configName:"HTTP_CLIENT_TIMEOUT_LONGRUNNING_IN_SECS"`
	HTTPConnectionTimeoutInSecs        int64    `configName:"HTTP_CONNECTION_TIMEOUT_IN_SECS"`
	TLSAddress                         string   `configName:"CONSOLE_PROXY_TLS_ADDRESS"`
	TLSCert                            string   `configName:"CONSOLE_PROXY_CERT"`
	TLSCertKey                         string   `configName:"CONSOLE_PROXY_CERT_KEY"`
	TLSCertPath                        string   `configName:"CONSOLE_PROXY_CERT_PATH"`
	TLSCertKeyPath                     string   `configName:"CONSOLE_PROXY_CERT_KEY_PATH"`
	CFClient                           string   `configName:"CF_CLIENT"`
	CFClientSecret                     string   `configName:"CF_CLIENT_SECRET"`
	AllowedOrigins                     []string `configName:"ALLOWED_ORIGINS"`
	SessionStoreSecret                 string   `configName:"SESSION_STORE_SECRET"`
	EncryptionKeyVolume                string   `configName:"ENCRYPTION_KEY_VOLUME"`
	EncryptionKeyFilename              string   `configName:"ENCRYPTION_KEY_FILENAME"`
	EncryptionKey                      string   `configName:"ENCRYPTION_KEY"`
	AutoRegisterCFUrl                  string   `configName:"AUTO_REG_CF_URL"`
	AutoRegisterCFName                 string   `configName:"AUTO_REG_CF_NAME"`
	SSOLogin                           bool     `configName:"SSO_LOGIN"`
	SSOOptions                         string   `configName:"SSO_OPTIONS"`
	SSOWhiteList                       string   `configName:"SSO_WHITELIST"`
	AuthEndpointType                   string   `configName:"AUTH_ENDPOINT_TYPE"`
	CookieDomain                       string   `configName:"COOKIE_DOMAIN"`
	LogLevel                           string   `configName:"LOG_LEVEL"`
	UIListMaxSize                      int64    `configName:"UI_LIST_MAX_SIZE"`
	UIListAllowLoadMaxed               bool     `configName:"UI_LIST_ALLOW_LOAD_MAXED"`
	CFAdminIdentifier                  string
	CloudFoundryInfo                   *CFInfo
	HTTPS                              bool
	EncryptionKeyInBytes               []byte
	ConsoleVersion                     string
	IsCloudFoundry                     bool
	LoginHooks                         []LoginHook
	SessionStore                       SessionStorer
	ConsoleConfig                      *ConsoleConfig
	PluginConfig                       map[string]string
	DatabaseProviderName               string
	EnableTechPreview                  bool `configName:"ENABLE_TECH_PREVIEW"`
	CanMigrateDatabaseSchema           bool
	// CanMigrateDatabaseSchema indicates if we can safely perform migrations
	// This depends on the deployment mechanism and the database config
	// e.g. if running in Cloud Foundry with a shared DB, then only the 0-index application instance
	// can perform migrations
}

// SetCanPerformMigrations updates the state that records if we can perform Database migrations
func (c *PortalConfig) SetCanPerformMigrations(value bool) {
	c.CanMigrateDatabaseSchema = c.CanMigrateDatabaseSchema && value
}
