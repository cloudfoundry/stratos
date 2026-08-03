package main

import (
	"testing"

	"github.com/govau/cf-common/env"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

// DO NOT DELETE - this is necessary for thr HTTP Client used during unit tests
func init() {
	initializeHTTPClients(10, 10, 10)
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
	var pc api.PortalConfig

	result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
		"HTTP_CLIENT_TIMEOUT_IN_SECS":             "10",
		"HTTP_CLIENT_TIMEOUT_MUTATING_IN_SECS":    "35",
		"HTTP_CLIENT_TIMEOUT_LONGRUNNING_IN_SECS": "123",
		"SKIP_SSL_VALIDATION":                     "true",
		"CONSOLE_PROXY_TLS_ADDRESS":               ":8080",
		"CONSOLE_CLIENT":                          "portal-proxy",
		"CONSOLE_CLIENT_SECRET":                   "ohsosecret!",
		"CF_CLIENT":                               "portal-proxy",
		"CF_CLIENT_SECRET":                        "ohsosecret!",
		"UAA_ENDPOINT":                            "https://login.cf.org.com:443",
		"ALLOWED_ORIGINS":                         "https://localhost,https://127.0.0.1",
		"SESSION_STORE_SECRET":                    "cookiesecret",
	})))

	if err != nil {
		t.Errorf("Unable to load portal config from env vars: %v", err)
	}

	if result.HTTPClientTimeoutInSecs != 10 {
		t.Error("Unable to get HTTPClientTimeoutInSecs from config")
	}

	if result.HTTPClientTimeoutMutatingInSecs != 35 {
		t.Error("Unable to get HTTPClientTimeoutMutatingInSecs from config")
	}

	if result.TLSAddress != ":8080" {
		t.Error("Unable to get TLSAddress from config")
	}

	if result.CFClient != "portal-proxy" {
		t.Error("Unable to get CFClient from config")
	}

	if result.CFClientSecret != "ohsosecret!" {
		t.Error("Unable to get CFClientSecret from config")
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

	// CSP is on by default: CONSOLE_CSP is not supplied above, so the built-in
	// policy applies. Opting out takes an explicit off-value. The resolved
	// policy carries the reporting directive, which is appended at load time.
	if result.CSPPolicy != policyWithReporting(defaultCSPPolicy) {
		t.Errorf("Expected the default CSP policy when CONSOLE_CSP unset, got: %q", result.CSPPolicy)
	}
}

func TestLoadPortalConfigDefaultCSP(t *testing.T) {
	var pc api.PortalConfig

	// "default" and "on" both opt into the built-in default policy.
	for _, val := range []string{"default", "Default", "on", "ON"} {
		result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
			"CONSOLE_CSP": val,
		})))
		if err != nil {
			t.Fatalf("Unable to load portal config for CONSOLE_CSP=%q: %v", val, err)
		}
		if result.CSPPolicy != policyWithReporting(defaultCSPPolicy) {
			t.Errorf("Expected default CSP policy for CONSOLE_CSP=%q, got %q", val, result.CSPPolicy)
		}
	}
}

func TestLoadPortalConfigCustomCSP(t *testing.T) {
	var pc api.PortalConfig
	const custom = "default-src 'self'"

	result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
		"CONSOLE_CSP": custom,
	})))
	if err != nil {
		t.Fatalf("Unable to load portal config: %v", err)
	}
	// A custom policy is used as given except for the reporting directive,
	// which is appended to it too — see policyWithReporting.
	if result.CSPPolicy != policyWithReporting(custom) {
		t.Errorf("Expected custom CSP policy %q, got %q", policyWithReporting(custom), result.CSPPolicy)
	}
}

func TestLoadPortalConfigOptOutCSP(t *testing.T) {
	var pc api.PortalConfig

	// Explicit off-values normalize to "" so a well-meaning CONSOLE_CSP=off
	// never leaks as a literal Content-Security-Policy header value.
	for _, val := range []string{"off", "OFF", "none", "None", "false", "disabled"} {
		result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
			"CONSOLE_CSP": val,
		})))
		if err != nil {
			t.Fatalf("Unable to load portal config for CONSOLE_CSP=%q: %v", val, err)
		}
		if result.CSPPolicy != "" {
			t.Errorf("Expected CONSOLE_CSP=%q to disable CSP (empty), got %q", val, result.CSPPolicy)
		}
	}
}

func TestLoadDatabaseConfig(t *testing.T) {
	var dc datastore.DatabaseConfig

	_, err := loadDatabaseConfig(dc, env.NewVarSet(env.WithMapLookup(map[string]string{
		"DB_USER":                    "console",
		"DB_PASSWORD":                "console",
		"DB_DATABASE_NAME":           "console-db",
		"DB_HOST":                    "localhost",
		"DB_PORT":                    "5432",
		"DB_CONNECT_TIMEOUT_IN_SECS": "5",
		"DB_SSL_MODE":                "false",
	})))

	if err != nil {
		t.Errorf("Unable to load database config from env vars: %v", err)
	}
}

func TestLoadDatabaseConfigWithInvalidSSLMode(t *testing.T) {
	var dc datastore.DatabaseConfig

	_, err := loadDatabaseConfig(dc, env.NewVarSet(env.WithMapLookup(map[string]string{
		"DB_USER":           "console",
		"DB_PASSWORD":       "console",
		"DB_DATABASE_NAME":  "console-db",
		"DB_HOST":           "localhost",
		"DB_PORT":           "5432",
		"DATABASE_PROVIDER": "pgsql",
		"DB_SSL_MODE":       "invalid.ssl.mode",
	})))

	if err == nil {
		t.Errorf("Unexpected success - should not be able to load database configs with an invalid SSL Mode specified.")
	}
}

// HSTS is the mirror image of CSP: same vocabulary, opposite default. Nothing
// is asserted about the operator's domain unless they ask for it.
func TestLoadPortalConfigHSTSIsOffByDefault(t *testing.T) {
	var pc api.PortalConfig

	result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{})))
	if err != nil {
		t.Fatalf("Unable to load portal config: %v", err)
	}
	if result.HSTSPolicy != "" {
		t.Errorf("Expected no HSTS policy when CONSOLE_HSTS unset, got %q", result.HSTSPolicy)
	}
}

func TestLoadPortalConfigHSTSOnValues(t *testing.T) {
	var pc api.PortalConfig

	for _, val := range []string{"on", "ON", "default", "Default"} {
		result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
			"CONSOLE_HSTS": val,
		})))
		if err != nil {
			t.Fatalf("Unable to load portal config for CONSOLE_HSTS=%q: %v", val, err)
		}
		if result.HSTSPolicy != defaultHSTSPolicy {
			t.Errorf("Expected default HSTS policy for CONSOLE_HSTS=%q, got %q", val, result.HSTSPolicy)
		}
	}
}

// The off-values must normalize to empty, or a well-meaning CONSOLE_HSTS=off
// ships as a literal Strict-Transport-Security: off header.
func TestLoadPortalConfigHSTSOffValues(t *testing.T) {
	var pc api.PortalConfig

	for _, val := range []string{"off", "OFF", "none", "false", "disabled"} {
		result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
			"CONSOLE_HSTS": val,
		})))
		if err != nil {
			t.Fatalf("Unable to load portal config for CONSOLE_HSTS=%q: %v", val, err)
		}
		if result.HSTSPolicy != "" {
			t.Errorf("Expected no HSTS policy for CONSOLE_HSTS=%q, got %q", val, result.HSTSPolicy)
		}
	}
}

func TestLoadPortalConfigCustomHSTS(t *testing.T) {
	var pc api.PortalConfig
	const custom = "max-age=300"

	result, err := loadPortalConfig(pc, env.NewVarSet(env.WithMapLookup(map[string]string{
		"CONSOLE_HSTS": custom,
	})))
	if err != nil {
		t.Fatalf("Unable to load portal config: %v", err)
	}
	if result.HSTSPolicy != custom {
		t.Errorf("Expected the custom HSTS policy verbatim, got %q", result.HSTSPolicy)
	}
}
