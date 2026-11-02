package autoscaler

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"
)

// registerProxy has the records Register reads and records what it writes.
type registerProxy struct {
	api.PortalProxy
	server     *httptest.Server // answers for every host
	records    map[string]api.CNSIRecord
	registered []string          // URLs passed to DoRegisterEndpoint
	metadata   map[string]string // guid → metadata written
}

func (p *registerProxy) GetSessionStringValue(_ *echo.Context, _ string) (string, error) {
	return "user-1", nil
}

func (p *registerProxy) GetCNSIRecord(guid string) (api.CNSIRecord, error) {
	rec, ok := p.records[guid]
	if !ok {
		return api.CNSIRecord{}, errors.New("not found")
	}
	return rec, nil
}

func (p *registerProxy) GetHttpClient(bool, string) http.Client { return routeTo(p.server) }

// routeTo sends every request to the test server, whatever the host, so
// URLs can sit on a real-looking domain.
func routeTo(s *httptest.Server) http.Client {
	addr := s.Listener.Addr().String()
	return http.Client{Transport: &http.Transport{
		DialContext: func(ctx context.Context, network, _ string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, network, addr)
		},
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec // test server
	}}
}

func (p *registerProxy) DoRegisterEndpoint(name, apiEndpoint string, skip bool, _, _, _ string, _ bool, _ string, _ bool, ca string, fetchInfo api.InfoFunc) (api.CNSIRecord, error) {
	rec, _, err := fetchInfo(apiEndpoint, skip, ca)
	if err != nil {
		return api.CNSIRecord{}, err
	}
	p.registered = append(p.registered, apiEndpoint)
	rec.GUID = "as-guid"
	rec.Name = name
	return rec, nil
}

func (p *registerProxy) UpdateEndpointMetadata(guid, metadata string) error {
	if p.metadata == nil {
		p.metadata = map[string]string{}
	}
	p.metadata[guid] = metadata
	return nil
}

// autoscalerServer answers /health and /v1/info like a 15.3.1 autoscaler,
// or 404 everywhere like a CF API URL when notAutoscaler is set.
func autoscalerServer(t *testing.T, notAutoscaler bool) *httptest.Server {
	s := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if notAutoscaler {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		switch r.URL.Path {
		case "/health":
			_, _ = w.Write([]byte(`{"alive":"true"}`))
		case "/v1/info":
			_, _ = w.Write([]byte(`{"build":"15.3.1"}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(s.Close)
	return s
}

func cfRecord(guid, apiURL, cnsiType, creator string) api.CNSIRecord {
	u, _ := url.Parse(apiURL)
	return api.CNSIRecord{GUID: guid, Name: guid, CNSIType: cnsiType, APIEndpoint: u, Creator: creator}
}

func registerWith(t *testing.T, proxy *registerProxy, form url.Values) (*httptest.ResponseRecorder, error) {
	t.Helper()
	form.Set("endpoint_type", EndpointType)
	form.Set("cnsi_name", "lab autoscaler")
	req := httptest.NewRequest(http.MethodPost, "/register", strings.NewReader(form.Encode()))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)
	rec := httptest.NewRecorder()
	ctx := echo.New().NewContext(req, rec)
	return rec, (&Autoscaler{portalProxy: proxy}).Register(ctx)
}

// requireBadRequest checks a refusal the register form can show: 400 with
// the message in the body's error field.
func requireBadRequest(t *testing.T, err error, wantInMessage ...string) {
	t.Helper()
	var shadow api.ErrHTTPShadow
	require.True(t, errors.As(err, &shadow), "want a user-facing HTTP error, got %v", err)
	require.Equal(t, http.StatusBadRequest, shadow.HTTPError.Code)
	for _, want := range wantInMessage {
		require.Contains(t, shadow.UserFacingError, want)
	}
}

func TestRegisterLinksCF(t *testing.T) {
	s := autoscalerServer(t, false)
	proxy := &registerProxy{server: s, records: map[string]api.CNSIRecord{
		"cf": cfRecord("cf", "https://api.sys.example.com", "cf", ""),
	}}
	form := url.Values{
		"api_endpoint": {"https://autoscaler.sys.example.com"},
		"cf_guid":      {"cf"},
		"broker_guid":  {"b1"},
		"broker_name":  {"autoscaler"},
	}
	rec, err := registerWith(t, proxy, form)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, rec.Code)
	require.Equal(t, []string{"https://autoscaler.sys.example.com"}, proxy.registered)

	var link endpointLink
	require.NoError(t, json.Unmarshal([]byte(proxy.metadata["as-guid"]), &link))
	require.Equal(t, endpointLink{CFGUID: "cf", BrokerGUID: "b1", BrokerName: "autoscaler", Build: "15.3.1"}, link)

	var body api.CNSIRecord
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	require.Equal(t, EndpointType, body.CNSIType)
	require.Equal(t, proxy.metadata["as-guid"], body.Metadata, "the response carries the link")
}

func TestRegisterRefusesOtherDomain(t *testing.T) {
	s := autoscalerServer(t, false)
	proxy := &registerProxy{server: s, records: map[string]api.CNSIRecord{
		"cf": cfRecord("cf", "https://api.sys.a.com", "cf", ""),
	}}
	_, err := registerWith(t, proxy, url.Values{
		"api_endpoint": {"https://autoscaler.sys.b.com"},
		"cf_guid":      {"cf"},
	})
	requireBadRequest(t, err, "https://autoscaler.sys.b.com", "https://api.sys.a.com", "domain")
	require.Empty(t, proxy.registered)
}

func TestRegisterRequiresCF(t *testing.T) {
	s := autoscalerServer(t, false)
	proxy := &registerProxy{server: s, records: map[string]api.CNSIRecord{
		"kube":  cfRecord("kube", "https://kube.sys.example.com", "k8s", ""),
		"other": cfRecord("other", "https://api.sys.example.com", "cf", "user-2"),
		"mine":  cfRecord("mine", "https://api.sys.example.com", "cf", "user-1"),
	}}
	for _, cf := range []string{"", "missing", "kube", "other"} {
		_, err := registerWith(t, proxy, url.Values{
			"api_endpoint": {"https://autoscaler.sys.example.com"},
			"cf_guid":      {cf},
		})
		requireBadRequest(t, err, "Cloud Foundry")
	}
	require.Empty(t, proxy.registered)

	// The user's own personal CF is theirs to link.
	_, err := registerWith(t, proxy, url.Values{
		"api_endpoint": {"https://autoscaler.sys.example.com"},
		"cf_guid":      {"mine"},
	})
	require.NoError(t, err)
}

func TestRegisterNotAnAutoscaler(t *testing.T) {
	s := autoscalerServer(t, true)
	proxy := &registerProxy{server: s, records: map[string]api.CNSIRecord{
		"cf": cfRecord("cf", "https://api.sys.example.com", "cf", ""),
	}}
	_, err := registerWith(t, proxy, url.Values{
		"api_endpoint": {"https://api.sys.example.com"},
		"cf_guid":      {"cf"},
	})
	requireBadRequest(t, err, "is not an autoscaler", "/health returned 404")
	require.Empty(t, proxy.registered)
}

func TestConnectRefused(t *testing.T) {
	_, _, err := (&Autoscaler{}).Connect(nil, api.CNSIRecord{}, "user-1")
	require.EqualError(t, err,
		"Autoscaler endpoints do not take a connection: calls use your Cloud Foundry connection")
}
