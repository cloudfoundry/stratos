package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
)

func passthroughContext() (*echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/proxy/v2/info", nil)
	req.Header.Set("x-cap-cnsi-list", "endpoint-1")
	req.Header.Set("x-cap-passthrough", "true")
	rec := httptest.NewRecorder()
	return echo.New().NewContext(req, rec), rec
}

// ProxyRequest returns the responses that arrived before its deadline, so
// a passthrough whose endpoint did not answer in time has none.
func TestPassthroughWithNoResponseInTimeReportsATimeout(t *testing.T) {
	t.Parallel()

	ctx, _ := passthroughContext()
	var err error
	func() {
		defer func() {
			if r := recover(); r != nil {
				t.Fatalf("SendProxiedResponse panicked: %v", r)
			}
		}()
		err = (&portalProxy{}).SendProxiedResponse(ctx, map[string]*api.CNSIRequest{})
	}()

	var httpErr *echo.HTTPError
	if !errors.As(err, &httpErr) || httpErr.Code != http.StatusGatewayTimeout {
		t.Errorf("got %v, want a %d error", err, http.StatusGatewayTimeout)
	}
}

func TestPassthroughSendsTheEndpointsResponse(t *testing.T) {
	t.Parallel()

	ctx, rec := passthroughContext()
	err := (&portalProxy{}).SendProxiedResponse(ctx, map[string]*api.CNSIRequest{
		"endpoint-1": {GUID: "endpoint-1", StatusCode: http.StatusTeapot, Response: []byte("short and stout")},
	})

	if err != nil || rec.Code != http.StatusTeapot || rec.Body.String() != "short and stout" {
		t.Errorf("got err %v, %d %q; want the endpoint's 418 and body", err, rec.Code, rec.Body.String())
	}
}

// ProxyRequest stops waiting at its overall timeout. An endpoint that has
// not answered by then must still be in the result, as a timeout, so the
// per-endpoint response says what happened to it instead of leaving it out.
func TestProxyRequestReportsAnEndpointThatTimedOut(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest(http.MethodGet, "/pp/v1/proxy/api/v1/pods", nil)
	req.Header.Set("x-cap-cnsi-list", "slow-endpoint")
	rec := httptest.NewRecorder()
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	ctx := echo.New().NewContext(req, rec)
	ctx.Set("user_id", mockUserGUID)
	pp.Config.HTTPClientTimeoutInSecs = 1

	cnsiRow := func() *sqlmock.Rows {
		return sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).
			AddRow("slow-endpoint", "slow", "k8s", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "", true,
				mockClientId, cipherClientSecret, false, "", "", "", "")
	}
	mock.ExpectQuery(selectAnyFromCNSIs).WithArgs("slow-endpoint").WillReturnRows(cnsiRow()) // validateCNSIList
	mock.ExpectQuery(selectAnyFromCNSIs).WithArgs("slow-endpoint").WillReturnRows(cnsiRow()) // buildCNSIRequest
	// The endpoint's request does not finish within the timeout.
	mock.ExpectQuery(selectAnyFromTokens).WillDelayFor(3 * time.Second).WillReturnRows(testutils.ExpectNoRows())

	responses, err := pp.ProxyRequest(ctx, &url.URL{Path: "/api/v1/pods"})
	if err != nil {
		t.Fatalf("ProxyRequest failed: %v", err)
	}
	res, ok := responses["slow-endpoint"]
	if !ok {
		t.Fatalf("the endpoint that timed out is missing from %v", responses)
	}
	if res.StatusCode != http.StatusGatewayTimeout || res.Status != "Request timed out" {
		t.Errorf("got %d %q, want %d %q", res.StatusCode, res.Status, http.StatusGatewayTimeout, "Request timed out")
	}

	if err := pp.SendProxiedResponse(ctx, responses); err != nil {
		t.Fatalf("SendProxiedResponse failed: %v", err)
	}
	var body map[string]PassthroughError
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("response %q is not the per-endpoint JSON: %v", rec.Body.String(), err)
	}
	entry, ok := body["slow-endpoint"]
	if !ok || entry.Error == nil || entry.Error.StatusCode != http.StatusGatewayTimeout || entry.Error.Status != "Request timed out" {
		t.Errorf("got %s, want an error entry for slow-endpoint with 504 %q", rec.Body.String(), "Request timed out")
	}
}
