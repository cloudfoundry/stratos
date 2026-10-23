package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
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
