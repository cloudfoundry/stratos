package cloudfoundry

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"
)

// preferenceProxy has two admin endpoints at the auto-register URL: the
// console-wide pick and norm-lab, which a user may have connected instead.
type preferenceProxy struct {
	api.PortalProxy
	config       api.PortalConfig
	userEndpoint *api.CNSIRecord // the user's live connection, if any
	disconnected map[string]bool // endpoints the user disconnected
	connected    []string        // endpoints the hook connected
}

var (
	consolePick = api.CNSIRecord{GUID: "cf-guid", Name: "Cloud Foundry", CNSIType: "cf", ClientId: "console-client"}
	normLab     = api.CNSIRecord{GUID: "norm-lab-guid", Name: "norm-lab", CNSIType: "cf", ClientId: "console-client"}
)

func (m *preferenceProxy) GetConfig() *api.PortalConfig { return &m.config }

func (m *preferenceProxy) GetSessionStringValue(_ *echo.Context, _ string) (string, error) {
	return "user-1", nil
}

func (m *preferenceProxy) GetAdminCNSIRecordByEndpoint(_, _ string) (api.CNSIRecord, error) {
	return consolePick, nil
}

func (m *preferenceProxy) GetUserConnectedAdminCNSIRecordByEndpoint(_, _, _ string) (api.CNSIRecord, error) {
	if m.userEndpoint == nil {
		return api.CNSIRecord{}, errors.New("not connected")
	}
	return *m.userEndpoint, nil
}

func (m *preferenceProxy) GetCNSITokenRecordWithDisconnected(guid, _ string) (api.TokenRecord, bool) {
	if m.disconnected[guid] {
		return api.TokenRecord{Disconnected: true}, true
	}
	return api.TokenRecord{}, false
}

func (m *preferenceProxy) DoLoginToCNSI(_ *echo.Context, guid string, _ bool) (*api.LoginRes, error) {
	m.connected = append(m.connected, guid)
	return &api.LoginRes{}, nil
}

func (m *preferenceProxy) DoLoginToCNSIwithConsoleUAAtoken(_ *echo.Context, rec api.CNSIRecord) error {
	m.connected = append(m.connected, rec.GUID)
	return nil
}

func runLoginHook(t *testing.T, proxy *preferenceProxy) []string {
	t.Helper()
	proxy.config.AutoRegisterCFUrl = "https://api.cf.example.com"
	proxy.config.CFClient = "console-client"
	ctx := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), httptest.NewRecorder())
	require.NoError(t, (&CloudFoundrySpecification{portalProxy: proxy}).cfLoginHook(ctx))
	require.Equal(t, consolePick.GUID, proxy.config.CloudFoundryInfo.EndpointGUID,
		"the console-wide pick is the same for every user")
	return proxy.connected
}

func TestLoginHookReconnectsTheEndpointTheUserUses(t *testing.T) {
	connected := runLoginHook(t, &preferenceProxy{userEndpoint: &normLab})
	require.Equal(t, []string{normLab.GUID}, connected)
}

func TestLoginHookConnectsTheConsolePickWhenTheUserUsesNone(t *testing.T) {
	connected := runLoginHook(t, &preferenceProxy{})
	require.Equal(t, []string{consolePick.GUID}, connected)
}

func TestLoginHookLeavesAManualDisconnectAlone(t *testing.T) {
	connected := runLoginHook(t, &preferenceProxy{disconnected: map[string]bool{consolePick.GUID: true}})
	require.Empty(t, connected)
}

// With SSO the console's token is linked in, and only an endpoint on the
// console's client can take it.
func TestLoginHookWithSSOKeepsToTheConsoleClient(t *testing.T) {
	otherClient := normLab
	otherClient.ClientId = "cf"
	proxy := &preferenceProxy{userEndpoint: &otherClient}
	proxy.config.SSOLogin = true
	require.Equal(t, []string{consolePick.GUID}, runLoginHook(t, proxy))

	proxy = &preferenceProxy{userEndpoint: &normLab}
	proxy.config.SSOLogin = true
	require.Equal(t, []string{normLab.GUID}, runLoginHook(t, proxy))
}
