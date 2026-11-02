package autoscaler

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"
)

// directProxy is a CF endpoint with the user's token, a registered
// autoscaler at the test server, and today's proxy path recorded.
type directProxy struct {
	api.PortalProxy
	server    *httptest.Server
	cf        api.CNSIRecord
	endpoints []*api.CNSIRecord
	token     api.TokenRecord
	refreshes int
	proxied   []string // paths sent through ProxyRequest
}

func (p *directProxy) GetSessionStringValue(*echo.Context, string) (string, error) {
	return "user-1", nil
}

func (p *directProxy) GetCNSIRecord(guid string) (api.CNSIRecord, error) { return p.cf, nil }

func (p *directProxy) ListEndpoints() ([]*api.CNSIRecord, error) { return p.endpoints, nil }

func (p *directProxy) GetHttpClient(bool, string) http.Client { return routeTo(p.server) }

func (p *directProxy) GetCNSITokenRecord(string, string) (api.TokenRecord, bool) {
	return p.token, p.token.AuthToken != ""
}

func (p *directProxy) RefreshOAuthToken(_ bool, cnsiGUID, userGUID, client, _, tokenEndpoint string) (api.TokenRecord, error) {
	p.refreshes++
	if cnsiGUID != p.cf.GUID || userGUID != "user-1" || client != p.cf.ClientId || tokenEndpoint != p.cf.TokenEndpoint {
		return api.TokenRecord{}, echo.NewHTTPError(http.StatusBadRequest, "refreshed with the wrong record")
	}
	p.token = api.TokenRecord{AuthToken: "fresh-token", TokenExpiry: time.Now().Add(time.Hour).Unix()}
	return p.token, nil
}

func (p *directProxy) ProxyRequest(_ *echo.Context, uri *url.URL) (map[string]*api.CNSIRequest, error) {
	p.proxied = append(p.proxied, uri.String())
	return map[string]*api.CNSIRequest{"cf": {GUID: "cf", StatusCode: http.StatusOK, Response: []byte(`{"via":"default"}`)}}, nil
}

func (p *directProxy) SendProxiedResponse(c *echo.Context, responses map[string]*api.CNSIRequest) error {
	res := responses["cf"]
	return c.Blob(res.StatusCode, echo.MIMEApplicationJSON, res.Response)
}

// seen is what the autoscaler test server received.
type seen struct {
	auth, path, query, body []string
}

// autoscalerAt serves the autoscaler, answering each request with the
// next status (the last one repeats).
func autoscalerAt(t *testing.T, got *seen, statuses ...int) *httptest.Server {
	n := 0
	s := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got.auth = append(got.auth, r.Header.Get("Authorization"))
		got.path = append(got.path, r.URL.Path)
		got.query = append(got.query, r.URL.RawQuery)
		b, _ := io.ReadAll(r.Body)
		got.body = append(got.body, string(b))
		status := statuses[min(n, len(statuses)-1)]
		n++
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(`{"via":"registered"}`))
	}))
	t.Cleanup(s.Close)
	return s
}

func newDirect(s *httptest.Server) *directProxy {
	cfURL, _ := url.Parse("https://api.sys.example.com")
	asURL, _ := url.Parse("https://autoscaler.sys.example.com")
	link, _ := json.Marshal(endpointLink{CFGUID: "cf", BrokerGUID: "b1"})
	return &directProxy{
		server: s,
		cf: api.CNSIRecord{GUID: "cf", CNSIType: "cf", APIEndpoint: cfURL, ClientId: "cf",
			TokenEndpoint: "https://uaa.sys.example.com"},
		endpoints: []*api.CNSIRecord{{GUID: "as1", Name: "lab autoscaler", CNSIType: EndpointType,
			APIEndpoint: asURL, Metadata: string(link)}},
		token: api.TokenRecord{AuthToken: "cf-token", TokenExpiry: time.Now().Add(time.Hour).Unix()},
	}
}

func echoCtx(method, target, body string) (*echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.Header.Set("x-cap-cnsi-list", "cf")
	req.Header.Set("x-cap-passthrough", "true")
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	return echo.New().NewContext(req, rec), rec
}

func callDirect(p *directProxy, method, path, body string) (*httptest.ResponseRecorder, error) {
	c, rec := echoCtx(method, "/", body)
	err := (&Autoscaler{portalProxy: p}).callRegistered(c, p.cf, *p.endpoints[0], "user-1", method, path, []byte(body))
	return rec, err
}

func TestCallRegisteredSendsCFToken(t *testing.T) {
	var got seen
	p := newDirect(autoscalerAt(t, &got, http.StatusOK))

	rec, err := callDirect(p, http.MethodPut, "/v1/apps/app-1/scaling_histories?page=2", `{"p":1}`)
	require.NoError(t, err)
	require.Equal(t, []string{"bearer cf-token"}, got.auth)
	require.Equal(t, []string{"/v1/apps/app-1/scaling_histories"}, got.path)
	require.Equal(t, []string{"page=2"}, got.query)
	require.Equal(t, []string{`{"p":1}`}, got.body)
	require.Equal(t, http.StatusOK, rec.Code)
	require.JSONEq(t, `{"via":"registered"}`, rec.Body.String())
	require.Equal(t, "application/json", rec.Header().Get("Content-Type"))
}

func TestCallRegisteredRefreshesOn401(t *testing.T) {
	var got seen
	p := newDirect(autoscalerAt(t, &got, http.StatusUnauthorized, http.StatusOK))
	rec, err := callDirect(p, http.MethodGet, "/v1/apps/app-1/policy", "")
	require.NoError(t, err)
	require.Equal(t, 1, p.refreshes)
	require.Equal(t, []string{"bearer cf-token", "bearer fresh-token"}, got.auth)
	require.Equal(t, http.StatusOK, rec.Code)

	// A second 401 is the autoscaler's answer: passed on, not retried again.
	var again seen
	p = newDirect(autoscalerAt(t, &again, http.StatusUnauthorized))
	rec, err = callDirect(p, http.MethodGet, "/v1/apps/app-1/policy", "")
	require.NoError(t, err)
	require.Equal(t, 1, p.refreshes)
	require.Len(t, again.auth, 2)
	require.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestCallRegisteredExpiredTokenRefreshedFirst(t *testing.T) {
	var got seen
	p := newDirect(autoscalerAt(t, &got, http.StatusOK))
	p.token.TokenExpiry = time.Now().Add(-time.Minute).Unix()

	_, err := callDirect(p, http.MethodGet, "/v1/apps/app-1/policy", "")
	require.NoError(t, err)
	require.Equal(t, 1, p.refreshes)
	require.Equal(t, []string{"bearer fresh-token"}, got.auth)
}

func TestCallRegisteredRefusesOtherDomain(t *testing.T) {
	var got seen
	p := newDirect(autoscalerAt(t, &got, http.StatusOK))
	p.cf.APIEndpoint, _ = url.Parse("https://api.sys.other.com")

	_, err := callDirect(p, http.MethodGet, "/v1/apps/app-1/policy", "")
	requireBadRequest(t, err, "domain")
	require.Empty(t, got.auth, "no request made")
}

func TestPolicyRouteUsesTarget(t *testing.T) {
	var got seen
	p := newDirect(autoscalerAt(t, &got, http.StatusOK))
	a := &Autoscaler{portalProxy: p}
	brokers := map[string]string{"b1": "autoscaler"}
	a.brokersForApp = func(context.Context, string, string, string) (map[string]string, error) {
		return brokers, nil
	}
	run := func() *httptest.ResponseRecorder {
		c, rec := echoCtx(http.MethodGet, "/autoscaler/apps/app-1/policy", "")
		c.SetPathValues(echo.PathValues{{Name: "appId", Value: "app-1"}})
		require.NoError(t, a.getAutoscalerPolicy(c))
		return rec
	}

	rec := run()
	require.JSONEq(t, `{"via":"registered"}`, rec.Body.String())
	require.Equal(t, []string{"/v1/apps/app-1/policy"}, got.path)
	require.Empty(t, p.proxied)

	// Not bound to a registered autoscaler: today's path.
	a.cache = brokerCache{}
	brokers = map[string]string{}
	rec = run()
	require.JSONEq(t, `{"via":"default"}`, rec.Body.String())
	require.Equal(t, []string{"/v1/apps/app-1/policy"}, p.proxied)
}

func TestTargetRoute(t *testing.T) {
	p := newDirect(nil)
	a := &Autoscaler{portalProxy: p}
	a.brokersForApp = func(context.Context, string, string, string) (map[string]string, error) {
		return map[string]string{"b1": "autoscaler"}, nil
	}
	c, rec := echoCtx(http.MethodGet, "/autoscaler/apps/app-1/target", "")
	c.SetPathValues(echo.PathValues{{Name: "appId", Value: "app-1"}})

	require.NoError(t, a.getAutoscalerTarget(c))
	require.Equal(t, http.StatusOK, rec.Code)
	require.JSONEq(t, `{
		"source": "registered",
		"endpoint": {"guid": "as1", "name": "lab autoscaler", "url": "https://autoscaler.sys.example.com", "personal": false},
		"duplicates": {"registered": [], "bound": []}
	}`, rec.Body.String())
}
