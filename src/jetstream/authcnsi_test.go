package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
)

const failingEndpointType = "failing"

// failingEndpointPlugin is an endpoint type whose Connect or Validate
// returns a given error, the way a real plugin passes one up.
type failingEndpointPlugin struct {
	connectErr  error
	validateErr error
}

func (f failingEndpointPlugin) Init() error { return nil }
func (f failingEndpointPlugin) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("not implemented")
}
func (f failingEndpointPlugin) GetEndpointPlugin() (api.EndpointPlugin, error) { return f, nil }
func (f failingEndpointPlugin) GetRoutePlugin() (api.RoutePlugin, error) {
	return nil, errors.New("not implemented")
}
func (f failingEndpointPlugin) Info(string, bool, string) (api.CNSIRecord, interface{}, error) {
	return api.CNSIRecord{}, nil, nil
}
func (f failingEndpointPlugin) GetType() string              { return failingEndpointType }
func (f failingEndpointPlugin) Register(*echo.Context) error { return nil }
func (f failingEndpointPlugin) Connect(*echo.Context, api.CNSIRecord, string) (*api.TokenRecord, bool, error) {
	if f.connectErr != nil {
		return nil, false, f.connectErr
	}
	return &api.TokenRecord{AuthType: api.AuthTypeHttpBasic, AuthToken: "dG9rZW4="}, false, nil
}
func (f failingEndpointPlugin) Validate(string, api.CNSIRecord, api.TokenRecord) error {
	return f.validateErr
}
func (f failingEndpointPlugin) UpdateMetadata(*api.Info, string, *echo.Context) {}

// unreachableError is what an HTTP client returns for a host that refuses
// the connection.
func unreachableError(t *testing.T) error {
	t.Helper()
	server := httptest.NewServer(http.NotFoundHandler())
	address := server.URL
	server.Close()
	_, err := http.Get(address)
	if err == nil {
		t.Fatal("expected a request to a closed server to fail")
	}
	return err
}

// untrustedCertificateError is what an HTTP client returns for a server
// whose certificate it does not trust.
func untrustedCertificateError(t *testing.T) error {
	t.Helper()
	server := httptest.NewTLSServer(http.NotFoundHandler())
	defer server.Close()
	_, err := (&http.Client{Timeout: 5 * time.Second}).Get(server.URL)
	if err == nil {
		t.Fatal("expected a request with an untrusted certificate to fail")
	}
	return err
}

// statusError is the error plugins build from an answered request with
// api.LogHTTPError.
func statusError(t *testing.T, status int) error {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(status)
	}))
	defer server.Close()
	res, err := http.Get(server.URL)
	if err != nil {
		t.Fatalf("request to the test server failed: %v", err)
	}
	return api.LogHTTPError(res, nil)
}

// connectWith runs DoLoginToCNSI against an endpoint of the failing type.
func connectWith(t *testing.T, plugin failingEndpointPlugin) error {
	t.Helper()
	req := setupMockReq("POST", "", map[string]string{"cnsi_guid": mockCNSIGUID})
	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	t.Cleanup(func() { _ = db.Close() })
	pp.Config.UserEndpointsEnabled = config.UserEndpointsConfigEnum.Disabled
	pp.Plugins = map[string]api.StratosPlugin{failingEndpointType: plugin}

	mock.ExpectQuery(selectAnyFromCNSIs).
		WithArgs(mockCNSIGUID).
		WillReturnRows(sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).
			AddRow(mockCNSIGUID, "failing endpoint", failingEndpointType, mockAPIEndpoint, mockAuthEndpoint,
				mockAuthEndpoint, "", true, mockClientId, cipherClientSecret, false, "", "", "", ""))
	// Saving the token before Validate, and clearing it after a failure.
	mock.ExpectQuery(selectAnyFromTokens).WillReturnRows(testutils.ExpectNoRows())
	mock.ExpectExec(insertIntoTokens).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(deleteTokens).WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pp.setSessionValues(ctx, map[string]interface{}{
		"user_id": mockUserGUID,
		"exp":     time.Now().AddDate(0, 0, 1).Unix(),
	}); err != nil {
		t.Fatalf("unable to set the session user: %v", err)
	}

	resp, err := pp.DoLoginToCNSI(ctx, mockCNSIGUID, false)
	if err == nil {
		t.Fatalf("expected the connect to fail, got %+v", resp)
	}
	return err
}

// connectFailureResponse returns the status and decoded body the user gets.
func connectFailureResponse(t *testing.T, err error) (int, map[string]string) {
	t.Helper()
	var shadow api.ErrHTTPShadow
	if !errors.As(err, &shadow) {
		t.Fatalf("expected an ErrHTTPShadow, got %T: %v", err, err)
	}
	body := map[string]string{}
	message := shadow.HTTPError.Message
	if jsonErr := json.Unmarshal([]byte(message), &body); jsonErr != nil {
		t.Fatalf("response body %q is not JSON: %v", message, jsonErr)
	}
	return shadow.HTTPError.Code, body
}

func TestConnectFailureTellsTheUserWhy(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name        string
		err         func(t *testing.T) error
		status      int
		reason      string
		errorPhrase string
	}{
		{"credentials rejected", func(t *testing.T) error { return statusError(t, http.StatusUnauthorized) },
			http.StatusUnauthorized, "auth_failed", "rejected the credentials (401 Unauthorized)"},
		{"access refused", func(t *testing.T) error { return statusError(t, http.StatusForbidden) },
			http.StatusForbidden, "auth_failed", "(403 Forbidden)"},
		{"endpoint failing", func(t *testing.T) error { return statusError(t, http.StatusServiceUnavailable) },
			http.StatusBadGateway, "unreachable", "503 Service Unavailable"},
		{"other answer", func(t *testing.T) error { return statusError(t, http.StatusNotFound) },
			http.StatusBadRequest, "", "404 Not Found"},
		{"unreachable", unreachableError,
			http.StatusBadGateway, "unreachable", "could not be reached"},
		{"untrusted certificate", untrustedCertificateError,
			http.StatusBadGateway, "tls", "certificate"},
		{"plugin message", func(*testing.T) error { return errors.New("Need username and password") },
			http.StatusBadRequest, "", "Need username and password"},
	}

	for _, tc := range cases {
		for _, step := range []string{"Connect", "Validate"} {
			t.Run(tc.name+" in "+step, func(t *testing.T) {
				plugin := failingEndpointPlugin{}
				if step == "Connect" {
					plugin.connectErr = tc.err(t)
				} else {
					plugin.validateErr = tc.err(t)
				}

				status, body := connectFailureResponse(t, connectWith(t, plugin))

				if status != tc.status {
					t.Errorf("status = %d, want %d", status, tc.status)
				}
				if body["reason"] != tc.reason {
					t.Errorf("reason = %q, want %q", body["reason"], tc.reason)
				}
				if body["status"] != "error" {
					t.Errorf("status field = %q, want %q", body["status"], "error")
				}
				if !strings.HasPrefix(body["error"], "Could not connect to the endpoint") ||
					!strings.Contains(body["error"], tc.errorPhrase) {
					t.Errorf("error = %q, want it to start with %q and contain %q",
						body["error"], "Could not connect to the endpoint", tc.errorPhrase)
				}
			})
		}
	}
}

func TestConnectFailureKeepsAShapedPluginError(t *testing.T) {
	t.Parallel()

	shaped := api.NewHTTPShadowError(http.StatusUnauthorized, "Plugin says no", "plugin log line")
	status, body := connectFailureResponse(t, connectWith(t, failingEndpointPlugin{connectErr: shaped}))

	if status != http.StatusUnauthorized || body["error"] != "Plugin says no" {
		t.Errorf("got %d %q, want the plugin's 401 %q", status, body["error"], "Plugin says no")
	}
}

func TestCloudFoundryConnectReportsAnUnreachableUAA(t *testing.T) {
	t.Parallel()

	uaa := httptest.NewServer(http.NotFoundHandler())
	uaaURL := uaa.URL
	uaa.Close()

	req := setupMockReq("POST", "", map[string]string{"username": "admin", "password": "changeme"})
	_, _, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()

	apiURL, _ := url.Parse(mockAPIEndpoint)
	_, _, _, err := pp.FetchOAuth2Token(api.CNSIRecord{
		GUID:                  mockCNSIGUID,
		CNSIType:              "cf",
		APIEndpoint:           apiURL,
		AuthorizationEndpoint: uaaURL,
	}, ctx)

	status, body := connectFailureResponse(t, err)
	if status != http.StatusBadGateway || body["reason"] != "unreachable" {
		t.Errorf("got %d reason %q (%q), want 502 reason %q", status, body["reason"], body["error"], "unreachable")
	}
}

func TestCloudFoundryConnectKeepsTheUAAReason(t *testing.T) {
	t.Parallel()

	uaa := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"unauthorized","error_description":"Bad credentials"}`))
	}))
	defer uaa.Close()

	req := setupMockReq("POST", "", map[string]string{"username": "admin", "password": "wrong"})
	_, _, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()

	apiURL, _ := url.Parse(mockAPIEndpoint)
	_, _, _, err := pp.FetchOAuth2Token(api.CNSIRecord{
		GUID:                  mockCNSIGUID,
		CNSIType:              "cf",
		APIEndpoint:           apiURL,
		AuthorizationEndpoint: uaa.URL,
	}, ctx)

	status, body := connectFailureResponse(t, err)
	if status != http.StatusUnauthorized || body["reason"] != "auth_failed" ||
		body["error"] != "Could not connect to the endpoint: Bad credentials" {
		t.Errorf("got %d reason %q error %q, want 401 reason %q with the UAA description",
			status, body["reason"], body["error"], "auth_failed")
	}
}

func TestConnectFailureShowsTheEndpointsMessage(t *testing.T) {
	t.Parallel()

	// A Kubernetes Status, as answered to the pods list Validate makes.
	answer := api.ErrHTTPRequest{
		Status:   http.StatusForbidden,
		Response: `{"kind":"Status","status":"Failure","message":"pods is forbidden: User \"jo\" cannot list resource \"pods\"","code":403}`,
	}
	status, body := connectFailureResponse(t, connectWith(t, failingEndpointPlugin{validateErr: answer}))

	want := `Could not connect to the endpoint: the endpoint refused access with these credentials ` +
		`(403 Forbidden: pods is forbidden: User "jo" cannot list resource "pods")`
	if status != http.StatusForbidden || body["error"] != want {
		t.Errorf("got %d %q, want 403 %q", status, body["error"], want)
	}
}

func TestSameURLAlternatives(t *testing.T) {
	t.Parallel()

	const user = "user-1"
	system := &api.CNSIRecord{GUID: "system", CNSIType: "cf"}
	otherSystem := &api.CNSIRecord{GUID: "other-system", CNSIType: "cf"}
	own := &api.CNSIRecord{GUID: "own", CNSIType: "cf", Creator: user}
	othersOwn := &api.CNSIRecord{GUID: "others-own", CNSIType: "cf", Creator: "user-2"}
	metrics := &api.CNSIRecord{GUID: "metrics", CNSIType: "metrics"}
	sameURL := []*api.CNSIRecord{system, otherSystem, own, othersOwn, metrics}

	guids := func(records []*api.CNSIRecord) string {
		names := []string{}
		for _, r := range records {
			names = append(names, r.GUID)
		}
		return strings.Join(names, ",")
	}

	cases := []struct {
		name   string
		target *api.CNSIRecord
		want   string
	}{
		{"own endpoint replaces the system ones of its type", own, "system,other-system"},
		{"system endpoint replaces the user's own", system, "own"},
		{"another user's endpoint is never touched", othersOwn, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := guids(sameURLAlternatives(*tc.target, sameURL, user)); got != tc.want {
				t.Errorf("alternatives = %q, want %q", got, tc.want)
			}
		})
	}
}
