// src/jetstream/plugins/cloudfoundry/auto_register_ca_test.go
package cloudfoundry

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"
)

// AUTO_REG_CF_URL registers an endpoint at startup but had no way to give it a
// CA, so on a foundation with a private authority the auto-registered endpoint
// reported itself connected and then failed every read with x509 (#5922). The
// CA is the only route: capi will not honour skip-ssl (see
// native_handlers_tls_test.go).
//
// The value can arrive inline or as a file, mirroring CONSOLE_PROXY_CERT and
// CONSOLE_PROXY_CERT_PATH, because on Kubernetes the CA is a mounted secret.

const testCAPEM = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n"

func TestResolveAutoRegisterCACertUnsetIsEmpty(t *testing.T) {
	ca, err := resolveAutoRegisterCACert(api.PortalConfig{})
	require.NoError(t, err)
	require.Empty(t, ca, "no CA configured must stay empty, not error")
}

func TestResolveAutoRegisterCACertInline(t *testing.T) {
	ca, err := resolveAutoRegisterCACert(api.PortalConfig{
		AutoRegisterCFCACert: testCAPEM,
	})
	require.NoError(t, err)
	require.Equal(t, testCAPEM, ca)
}

func TestResolveAutoRegisterCACertFromPath(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ca.crt")
	require.NoError(t, os.WriteFile(path, []byte(testCAPEM), 0600))

	ca, err := resolveAutoRegisterCACert(api.PortalConfig{
		AutoRegisterCFCACertPath: path,
	})
	require.NoError(t, err)
	require.Equal(t, testCAPEM, ca)
}

// Same precedence as detectTLSCert: the file is what a Kubernetes deployment
// mounts, so it wins over an inline value that may be a leftover default.
func TestResolveAutoRegisterCACertPathWinsOverInline(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ca.crt")
	require.NoError(t, os.WriteFile(path, []byte(testCAPEM), 0600))

	ca, err := resolveAutoRegisterCACert(api.PortalConfig{
		AutoRegisterCFCACert:     "-----BEGIN CERTIFICATE-----\nSTALE\n-----END CERTIFICATE-----\n",
		AutoRegisterCFCACertPath: path,
	})
	require.NoError(t, err)
	require.Equal(t, testCAPEM, ca)
}

// A configured path that cannot be read is an operator error and must be loud.
// Falling back to no CA would reproduce exactly the silent x509 failure this
// exists to prevent.
func TestResolveAutoRegisterCACertMissingPathErrors(t *testing.T) {
	_, err := resolveAutoRegisterCACert(api.PortalConfig{
		AutoRegisterCFCACertPath: filepath.Join(t.TempDir(), "absent.crt"),
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "absent.crt", "the error must name the file")
}

// The defect was not that the CA could not be resolved but that it never
// reached the endpoint: DoRegisterEndpoint takes the CA as the tenth of eleven
// positional arguments and auto-registration passed a literal "". Resolving the
// value is useless if it is dropped on the way, so pin the argument itself.
type autoRegProxy struct {
	api.PortalProxy
	config       api.PortalConfig
	registeredCA string
	registered   bool
}

func (m *autoRegProxy) GetConfig() *api.PortalConfig { return &m.config }

func (m *autoRegProxy) GetSessionStringValue(_ *echo.Context, _ string) (string, error) {
	return "user-1", nil
}

func (m *autoRegProxy) GetEndpointTypeSpec(_ string) (api.EndpointPlugin, error) {
	return &CloudFoundrySpecification{}, nil
}

// No existing record, so the hook takes the auto-register path.
func (m *autoRegProxy) GetAdminCNSIRecordByEndpoint(_ string) (api.CNSIRecord, error) {
	return api.CNSIRecord{}, errors.New("not found")
}

func (m *autoRegProxy) DoRegisterEndpoint(_ string, _ string, _ bool, _ string, _ string, _ string,
	_ bool, _ string, _ bool, caCert string, _ api.InfoFunc) (api.CNSIRecord, error) {
	m.registered = true
	m.registeredCA = caCert
	return api.CNSIRecord{GUID: "cnsi-1", CNSIType: "cf"}, nil
}

// Stop after registration — auto-connect is not what is under test.
func (m *autoRegProxy) GetCNSITokenRecordWithDisconnected(_, _ string) (api.TokenRecord, bool) {
	return api.TokenRecord{Disconnected: true}, true
}

func runAutoRegister(t *testing.T, pc api.PortalConfig) *autoRegProxy {
	t.Helper()
	pc.AutoRegisterCFUrl = "https://api.cf.example.com"

	proxy := &autoRegProxy{config: pc}
	ctx := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), httptest.NewRecorder())

	require.NoError(t, (&CloudFoundrySpecification{portalProxy: proxy}).cfLoginHook(ctx))
	return proxy
}

func TestAutoRegisterPassesTheCACert(t *testing.T) {
	proxy := runAutoRegister(t, api.PortalConfig{AutoRegisterCFCACert: testCAPEM})

	require.True(t, proxy.registered, "the endpoint should have been auto-registered")
	require.Equal(t, testCAPEM, proxy.registeredCA,
		"the configured CA must reach the endpoint record, or every read fails with x509")
}

func TestAutoRegisterWithoutACACertIsUnchanged(t *testing.T) {
	proxy := runAutoRegister(t, api.PortalConfig{})

	require.True(t, proxy.registered)
	require.Empty(t, proxy.registeredCA, "no CA configured must stay the previous behaviour")
}

// An unreadable CA must not register a CA-less endpoint that then fails every
// read; the hook logs and declines to register.
func TestAutoRegisterSkipsRegistrationWhenTheCACertIsUnreadable(t *testing.T) {
	proxy := runAutoRegister(t, api.PortalConfig{
		AutoRegisterCFCACertPath: filepath.Join(t.TempDir(), "absent.crt"),
	})

	require.False(t, proxy.registered, "a misconfigured CA must not register a CA-less endpoint")
}
