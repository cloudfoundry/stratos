package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/hpcloud/portal-proxy/datastore"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

type mockServer struct {
	Route  string
	Status int
	Method string
	Body   string
}

type mockServerFunc func(*mockServer)

const mockCNSIGUID = "some-guid-1234"
const mockUserGUID = "asd-gjfg-bob"

func setupEchoContext(res http.ResponseWriter, req *http.Request) (*echo.Echo, echo.Context) {
	e := echo.New()
	ctx := e.NewContext(standard.NewRequest(req, nil), standard.NewResponse(res, nil))

	return e, ctx
}

func setupMockReq(method string, formValues map[string]string) *http.Request {
	if formValues == nil {
		req, err := http.NewRequest(method, "http://127.0.0.1", nil)
		if err != nil {
			panic(err)
		}
		return req
	}

	form := url.Values{}

	for key, value := range formValues {
		form.Set(key, value)
	}
	req, err := http.NewRequest(method, "http://127.0.0.1", strings.NewReader(form.Encode()))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	return req
}

func setupPortalProxy() *portalProxy {
	pc := portalConfig{
		ConsoleClient:       "console",
		ConsoleClientSecret: "",
		UAAEndpoint:         "https://login.52.38.188.107.nip.io/oauth/token",
		CookieStoreSecret:   "hiddenraisinsohno!",
	}

	dc := datastore.DatabaseConfig{}

	pp := newPortalProxy(pc, dc, nil)
	pp.initCookieStore()

	return pp
}

func setupHTTPTest(req *http.Request) (http.ResponseWriter, *echo.Echo, echo.Context, *portalProxy) {
	res := httptest.NewRecorder()
	e, ctx := setupEchoContext(res, req)
	pp := setupPortalProxy()

	return res, e, ctx, pp
}

func msRoute(route string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Route = route
	}
}

func msStatus(status int) mockServerFunc {
	return func(ms *mockServer) {
		ms.Status = status
	}
}

func msMethod(method string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Method = method
	}
}

func msBody(body string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Body = body
	}
}

func setupMockServer(t *testing.T, modifiers ...mockServerFunc) *httptest.Server {
	mServer := &mockServer{}
	for _, mod := range modifiers {
		mod(mServer)
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if mServer.Route != r.URL.Path {
			t.Errorf("Wanted path '%s', got path '%s'", mServer.Route, r.URL.Path)
		}
		if mServer.Method != r.Method {
			t.Errorf("Wanted method '%s', got method '%s'", mServer.Method, r.Method)
		}
		w.WriteHeader(mServer.Status)
		w.Write([]byte(mServer.Body))
	}))

	return server
}

func urlMust(i string) *url.URL {
	b, err := url.Parse(i)
	if err != nil {
		panic(err)
	}
	return b
}

const mockUAAToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsInVzZXJfaWQiOiJhc2QtZ2pmZy1ib2IiLCJleHAiOjEyMzQ1Njd9.gO9WDYNEfMsnbz7-sICTNygzkqvWgMP2nm9BStJvvCw`

var mockUAAResponse = UAAResponse{
	AccessToken:  mockUAAToken,
	RefreshToken: mockUAAToken,
}

const (
	mockAPIEndpoint   = "https://api.127.0.0.1"
	mockAuthEndpoint  = "https://login.127.0.0.1"
	mockTokenEndpoint = "https://uaa.127.0.0.1"
)

var mockV2InfoResponse = v2Info{
	AuthorizationEndpoint: mockAuthEndpoint,
	TokenEndpoint:         mockTokenEndpoint,
}
