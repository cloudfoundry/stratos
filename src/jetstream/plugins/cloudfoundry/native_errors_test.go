package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakeNetError implements net.Error for the transport-failure cases (conn
// refused / timeout). The capi client surfaces these as *url.Error wrapping
// a *net.OpError, both of which satisfy net.Error.
type fakeNetError struct{ timeout bool }

func (e fakeNetError) Error() string   { return "dial tcp: connection refused" }
func (e fakeNetError) Timeout() bool   { return e.timeout }
func (e fakeNetError) Temporary() bool { return false }

func TestClassifyCfError(t *testing.T) {
	var _ net.Error = fakeNetError{} // compile-time assertion

	cases := []struct {
		name string
		err  error
		want cfErrorReason
	}{
		// --- UAA token-refresh path: api.ErrHTTPRequest ---
		{"uaa 503 origin down", api.ErrHTTPRequest{Status: 503}, reasonUnreachable},
		{"uaa 500 origin error", api.ErrHTTPRequest{Status: 500}, reasonUnreachable},
		{"uaa 502 gateway", api.ErrHTTPRequest{Status: 502}, reasonUnreachable},
		{"uaa no response (network)", api.ErrHTTPRequest{Status: 0, InnerError: fakeNetError{}}, reasonUnreachable},
		{"uaa 401 token rejected", api.ErrHTTPRequest{Status: 401}, reasonAuthExpired},
		{"uaa 400 invalid_grant", api.ErrHTTPRequest{Status: 400}, reasonAuthExpired},
		{"uaa 404 unexpected", api.ErrHTTPRequest{Status: 404}, reasonUnclassified},
		// real wrap chain from RefreshOAuthToken must use %w to stay classifiable
		{"uaa 503 wrapped with %w", fmt.Errorf("token refresh request failed: %w", api.ErrHTTPRequest{Status: 503}), reasonUnreachable},
		{"uaa 401 wrapped with %w", fmt.Errorf("token refresh request failed: %w", api.ErrHTTPRequest{Status: 401}), reasonAuthExpired},

		// --- capi CF-call path: sentinels via errors.Is ---
		{"capi 5xx server error", fmt.Errorf("list failed: %w", capi.ErrServerError), reasonUnreachable},
		{"capi 401 unauthorized", fmt.Errorf("get failed: %w", capi.ErrUnauthorized), reasonAuthExpired},
		{"capi 404 not found", fmt.Errorf("get failed: %w", capi.ErrNotFound), reasonUnclassified},
		{"capi 422 unprocessable", fmt.Errorf("create failed: %w", capi.ErrUnprocessable), reasonUnclassified},

		// --- transport-level errors (no HTTP response at all) ---
		{"net error", fakeNetError{}, reasonUnreachable},
		{"net error wrapped", fmt.Errorf("doing request: %w", fakeNetError{timeout: true}), reasonUnreachable},
		{"context deadline", context.DeadlineExceeded, reasonUnreachable},

		// --- nothing we call out ---
		{"plain error", errors.New("something went wrong"), reasonUnclassified},
		{"nil", nil, reasonUnclassified},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.want, classifyCfError(tc.err))
		})
	}
}

func TestUpstreamStatusOf(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want int
	}{
		{"uaa status", api.ErrHTTPRequest{Status: 503}, 503},
		{"uaa wrapped", fmt.Errorf("x: %w", api.ErrHTTPRequest{Status: 401}), 401},
		{"capi status in message", capi.MapHTTPError(503, []byte("down")), 503},
		{"capi status wrapped", fmt.Errorf("list: %w", capi.MapHTTPError(500, nil)), 500},
		{"capi sentinel no body still has status", capi.ErrServerError, 0},
		{"plain error", errors.New("nope"), 0},
		{"nil", nil, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.want, upstreamStatusOf(tc.err))
		})
	}
}

func TestClassifyNativeErrorsMiddleware(t *testing.T) {
	e := echo.New()

	runWithCnsi := func(handler echo.HandlerFunc) (echo.Context, error) {
		req := httptest.NewRequest(http.MethodGet, "/cf/spaces/cnsi-9", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("cnsiGuid")
		c.SetParamValues("cnsi-9")
		return c, classifyNativeErrors(handler)(c)
	}

	t.Run("raw classifiable error is shaped with header + JSON body", func(t *testing.T) {
		c, err := runWithCnsi(func(ctx echo.Context) error {
			return api.ErrHTTPRequest{Status: 503}
		})
		he, ok := err.(*echo.HTTPError)
		require.True(t, ok, "raw error should be shaped into *echo.HTTPError")
		assert.Equal(t, http.StatusBadGateway, he.Code)
		assert.Equal(t, "unreachable", c.Response().Header().Get(stratosErrorReasonHeader))
		msg, _ := he.Message.(string)
		assert.True(t, strings.HasPrefix(msg, "{"), "shaped body must be JSON")
	})

	t.Run("existing echo.HTTPError passes through untouched", func(t *testing.T) {
		orig := echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
		c, err := runWithCnsi(func(ctx echo.Context) error { return orig })
		assert.Same(t, orig, err)
		assert.Empty(t, c.Response().Header().Get(stratosErrorReasonHeader))
	})

	t.Run("nil passes through", func(t *testing.T) {
		_, err := runWithCnsi(func(ctx echo.Context) error { return nil })
		assert.NoError(t, err)
	})

	t.Run("raw error without cnsiGuid passes through untouched", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/no-cnsi", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		raw := errors.New("boom")
		err := classifyNativeErrors(func(ctx echo.Context) error { return raw })(c)
		assert.Same(t, raw, err)
	})
}

func TestNativeCFError(t *testing.T) {
	e := echo.New()
	cases := []struct {
		name         string
		err          error
		wantHeader   string // "" means header must be absent
		wantReason   string
		wantUpstream int
	}{
		{"unreachable sets header", api.ErrHTTPRequest{Status: 503}, "unreachable", "unreachable", 503},
		{"auth_expired sets header", api.ErrHTTPRequest{Status: 401}, "auth_expired", "auth_expired", 401},
		{"unclassified omits header", fmt.Errorf("get: %w", capi.ErrNotFound), "", "", 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-123", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			herr := nativeCFError(c, "cnsi-123", tc.err)

			// Header is set on the response immediately (before commit), and
			// only for the called-out reasons.
			assert.Equal(t, tc.wantHeader, c.Response().Header().Get(stratosErrorReasonHeader))

			he, ok := herr.(*echo.HTTPError)
			require.True(t, ok, "must return *echo.HTTPError")
			assert.Equal(t, http.StatusBadGateway, he.Code)

			msg, ok := he.Message.(string)
			require.True(t, ok, "message must be a string")
			assert.True(t, strings.HasPrefix(msg, "{"), "body must lead with '{' for the JSON discriminator, got %q", msg)

			var body nativeCFErrorBody
			require.NoError(t, json.Unmarshal([]byte(msg), &body))
			assert.Equal(t, tc.wantReason, body.Reason)
			assert.Equal(t, "cnsi-123", body.CnsiGUID)
			assert.Equal(t, tc.wantUpstream, body.UpstreamStatus)
			assert.NotEmpty(t, body.Detail, "detail should carry the underlying error text")
		})
	}
}
