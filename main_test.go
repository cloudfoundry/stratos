package main

import (
	"os"
	"testing"

	"github.com/hpcloud/portal-proxy/datastore"
)

// DO NOT DELETE - this is necessary for thr HTTP Client used during unit tests
func init() {
	initializeHTTPClients(10)
}

/* type echoContextMock struct{}

func (e *echoContextMock) Deadline() (deadline time.Time, ok bool)             { return time.Time{}, false }
func (e *echoContextMock) Done() <-chan struct{}                               { return nil }
func (e *echoContextMock) Err() error                                          { return nil }
func (e *echoContextMock) Value(key interface{}) interface{}                   { return nil }
func (e *echoContextMock) NetContext() netContext.Context                      { return nil }
func (e *echoContextMock) SetNetContext(netContext.Context)                    {}
func (e *echoContextMock) Request() engine.Request                             { return nil }
func (e *echoContextMock) Response() engine.Response                           { return nil }
func (e *echoContextMock) Path() string                                        { return "" }
func (e *echoContextMock) P(int) string                                        { return "" }
func (e *echoContextMock) Param(string) string                                 { return "" }
func (e *echoContextMock) ParamNames() []string                                { return nil }
func (e *echoContextMock) QueryParam(string) string                            { return "" }
func (e *echoContextMock) QueryParams() map[string][]string                    { return nil }
func (e *echoContextMock) FormValue(string) string                             { return "" }
func (e *echoContextMock) FormParams() map[string][]string                     { return nil }
func (e *echoContextMock) FormFile(string) (*multipart.FileHeader, error)      { return nil, nil }
func (e *echoContextMock) MultipartForm() (*multipart.Form, error)             { return nil, nil }
func (e *echoContextMock) Get(string) interface{}                              { return nil }
func (e *echoContextMock) Set(string, interface{})                             {}
func (e *echoContextMock) Bind(interface{}) error                              { return nil }
func (e *echoContextMock) Render(int, string, interface{}) error               { return nil }
func (e *echoContextMock) HTML(int, string) error                              { return nil }
func (e *echoContextMock) String(int, string) error                            { return nil }
func (e *echoContextMock) JSON(int, interface{}) error                         { return nil }
func (e *echoContextMock) JSONBlob(int, []byte) error                          { return nil }
func (e *echoContextMock) JSONP(int, string, interface{}) error                { return nil }
func (e *echoContextMock) XML(int, interface{}) error                          { return nil }
func (e *echoContextMock) XMLBlob(int, []byte) error                           { return nil }
func (e *echoContextMock) File(string) error                                   { return nil }
func (e *echoContextMock) Attachment(io.ReadSeeker, string) error              { return nil }
func (e *echoContextMock) NoContent(int) error                                 { return nil }
func (e *echoContextMock) Redirect(int, string) error                          { return nil }
func (e *echoContextMock) Error(err error)                                     {}
func (e *echoContextMock) Handler() echo.HandlerFunc                           { return nil }
func (e *echoContextMock) Logger() *log.Logger                                 { return nil }
func (e *echoContextMock) Echo() *echo.Echo                                    { return nil }
func (e *echoContextMock) ServeContent(io.ReadSeeker, string, time.Time) error { return nil }
func (e *echoContextMock) Object() *echo.Context                               { return nil }
func (e *echoContextMock) Reset(engine.Request, engine.Response)               {}

*/

func TestLoadPortalConfig(t *testing.T) {
	t.Parallel()

	os.Setenv("HTTP_CLIENT_TIMEOUT_IN_SECS", "10")
	os.Setenv("SKIP_TLS_VERIFICATION", "true")
	os.Setenv("CONSOLE_PROXY_TLS_ADDRESS", ":8080")
	os.Setenv("CONSOLE_CLIENT", "portal-proxy")
	os.Setenv("CONSOLE_CLIENT_SECRET", "ohsosecret!")
	os.Setenv("HCF_CLIENT", "portal-proxy")
	os.Setenv("HCF_CLIENT_SECRET", "ohsosecret!")
	os.Setenv("HCP_IDENTITY_SCHEME", "https")
	os.Setenv("HCP_IDENTITY_HOST", "login.hcf.helion.lol")
	os.Setenv("HCP_IDENTITY_PORT", "443")
	os.Setenv("ALLOWED_ORIGINS", "https://localhost,https://127.0.0.1")
	os.Setenv("SESSION_STORE_SECRET", "cookiesecret")

	var pc portalConfig

	result, err := loadPortalConfig(pc)

	if err != nil {
		t.Errorf("Unable to load portal config from env vars: %v", err)
	}

	if result.HTTPClientTimeoutInSecs != 10 {
		t.Error("Unable to get HTTPClientTimeoutInSecs from config")
	}

	if result.SkipTLSVerification != true {
		t.Error("Unable to get SkipTLSVerification from config")
	}

	if result.TLSAddress != ":8080" {
		t.Error("Unable to get TLSAddress from config")
	}

	if result.ConsoleClient != "portal-proxy" {
		t.Error("Unable to get ConsoleClient from config")
	}

	if result.ConsoleClientSecret != "ohsosecret!" {
		t.Error("Unable to get ConsoleClientSecret from config")
	}

	if result.HCFClient != "portal-proxy" {
		t.Error("Unable to get HCFClient from config")
	}

	if result.HCFClientSecret != "ohsosecret!" {
		t.Error("Unable to get HCFClientSecret from config")
	}

	if result.HCPIdentityScheme != "https" {
		t.Error("Unable to get HCPIdentityScheme from config")
	}

	if result.HCPIdentityHost != "login.hcf.helion.lol" {
		t.Error("Unable to get HCPIdentityHost from config")
	}

	if result.HCPIdentityPort != "443" {
		t.Error("Unable to get HCPIdentityPort from config")
	}

	if len(result.AllowedOrigins) != 2 {
		t.Error("Unable to get 2 AllowedOrigins from config")
	}

	if result.AllowedOrigins[0] != "https://localhost" {
		t.Error("Unable to get first AllowedOrigin from config")
		t.Error(result.AllowedOrigins[0])
	}

	if result.AllowedOrigins[1] != "https://127.0.0.1" {
		t.Error("Unable to get second AllowedOrigin from config")
		t.Error(result.AllowedOrigins[1])
	}

	if result.SessionStoreSecret != "cookiesecret" {
		t.Error("Unable to get SessionStoreSecret from config")
	}
}

func TestLoadDatabaseConfig(t *testing.T) {
	t.Parallel()

	os.Setenv("PGSQL_USER", "stackato")
	os.Setenv("PGSQL_PASSWORD", "stackato")
	os.Setenv("PGSQL_DATABASE", "stackato-db")
	os.Setenv("PGSQL_HOST", "localhost")
	os.Setenv("PGSQL_PORT", "5432")
	os.Setenv("PGSQL_CONNECT_TIMEOUT_IN_SECS", "5")
	os.Setenv("PGSQL_SSL_MODE", "disable")

	var dc datastore.DatabaseConfig

	_, err := loadDatabaseConfig(dc)

	if err != nil {
		t.Errorf("Unable to load database config from env vars: %v", err)
	}
}

func TestLoadDatabaseConfigWithInvalidSSLMode(t *testing.T) {
	t.Parallel()

	os.Setenv("PGSQL_SSL_MODE", "invalid.ssl.mode")

	var dc datastore.DatabaseConfig

	_, err := loadDatabaseConfig(dc)

	if err == nil {
		t.Errorf("Unexpected success - should not be able to load database configs with an invalid SSL Mode specified.")
	}
}
