package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// fakeProxy satisfies the *portalProxy shape wireSizeMiddleware needs —
// only GetConfig() is exercised. Keeps the test self-contained so it can
// run without the full DI graph.
type fakeProxyForWireSize struct {
	*portalProxy
	diagEnabled bool
}

func newTestPortalProxy(diagEnabled bool) *portalProxy {
	cfg := &api.PortalConfig{DiagnosticsEnabled: diagEnabled}
	return &portalProxy{Config: *cfg}
}

// runThroughMiddleware invokes wireSizeMiddleware in an Echo chain against a
// handler that writes the given JSON body with the given content-type and
// status. Returns the ResponseRecorder so the caller can assert on headers,
// status, and body.
func runThroughMiddleware(t *testing.T, p *portalProxy, contentType string, status int, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	e := echo.New()
	e.Use(p.wireSizeMiddleware)
	e.GET("/test", func(c echo.Context) error {
		c.Response().Header().Set(echo.HeaderContentType, contentType)
		c.Response().WriteHeader(status)
		_, err := c.Response().Write(body)
		return err
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return rec
}

func TestWireSizeMiddleware_EmitsHeaderForJSONResponse(t *testing.T) {
	p := newTestPortalProxy(true)
	body := []byte(`{"resources":[{"guid":"a"}],"pagination":{"totalResults":1}}`)
	rec := runThroughMiddleware(t, p, "application/json", http.StatusOK, body)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
	if string(rec.Body.Bytes()) != string(body) {
		t.Errorf("body mismatch: got %q, want %q", rec.Body.String(), string(body))
	}
	h := rec.Header().Get("X-Stratos-Wire-Sizes")
	if h == "" {
		t.Fatal("X-Stratos-Wire-Sizes header missing — regression of the WriteHeader-too-early bug")
	}
	for _, want := range []string{"raw_total=", "keys=", "values=", "structural=", "resources=1", "duration_ms="} {
		if !strings.Contains(h, want) {
			t.Errorf("X-Stratos-Wire-Sizes missing %q: got %q", want, h)
		}
	}
}

func TestWireSizeMiddleware_SkippedWhenDiagnosticsDisabled(t *testing.T) {
	p := newTestPortalProxy(false)
	body := []byte(`{"resources":[]}`)
	rec := runThroughMiddleware(t, p, "application/json", http.StatusOK, body)

	if rec.Header().Get("X-Stratos-Wire-Sizes") != "" {
		t.Error("X-Stratos-Wire-Sizes should be absent when DIAGNOSTICS_ENABLED=false")
	}
	if rec.Body.String() != string(body) {
		t.Error("body should pass through unchanged when middleware skipped")
	}
}

func TestWireSizeMiddleware_NonJSONPassesThroughWithoutHeader(t *testing.T) {
	p := newTestPortalProxy(true)
	body := []byte(`plain text response`)
	rec := runThroughMiddleware(t, p, "text/plain", http.StatusOK, body)

	if rec.Header().Get("X-Stratos-Wire-Sizes") != "" {
		t.Error("X-Stratos-Wire-Sizes should be absent for non-JSON responses")
	}
	if rec.Body.String() != string(body) {
		t.Errorf("body mismatch: got %q, want %q", rec.Body.String(), string(body))
	}
}

func TestWireSizeMiddleware_PreservesHandlerStatus(t *testing.T) {
	p := newTestPortalProxy(true)
	body := []byte(`{"errors":[{"code":"X"}]}`)
	rec := runThroughMiddleware(t, p, "application/json", http.StatusBadGateway, body)

	if rec.Code != http.StatusBadGateway {
		t.Errorf("status = %d, want 502 (WriteHeader code must be preserved through buffering)", rec.Code)
	}
	if rec.Header().Get("X-Stratos-Wire-Sizes") == "" {
		t.Error("header should still be emitted for non-2xx JSON responses")
	}
}

func TestWireSizeMiddleware_SkipsWebSocketUpgrade(t *testing.T) {
	p := newTestPortalProxy(true)
	e := echo.New()
	e.Use(p.wireSizeMiddleware)
	e.GET("/ws", func(c echo.Context) error {
		// Simulate a WebSocket-upgrade-adjacent handler: it doesn't write a body
		// here, but the middleware must not wrap the writer so hijack works.
		if _, ok := c.Response().Writer.(*bufferingResponseWriter); ok {
			t.Error("wireSize middleware should not wrap the writer on WebSocket upgrade")
		}
		return c.NoContent(http.StatusSwitchingProtocols)
	})

	req := httptest.NewRequest(http.MethodGet, "/ws", nil)
	req.Header.Set("Upgrade", "websocket")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
}

func TestCountJSONBytes_FlatObject(t *testing.T) {
	body := []byte(`{"name":"foo"}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6 (`\"name\"`)", m.Keys)
	}
	if m.Structural != 3 {
		t.Errorf("Structural = %d, want 3 ({ : })", m.Structural)
	}
	if m.Values != 5 {
		t.Errorf("Values = %d, want 5 (`\"foo\"`)", m.Values)
	}
	if m.Resources != 0 {
		t.Errorf("Resources = %d, want 0", m.Resources)
	}
	if m.Keys+m.Values+m.Structural != m.RawTotal {
		t.Errorf("Keys+Values+Structural=%d should equal RawTotal=%d", m.Keys+m.Values+m.Structural, m.RawTotal)
	}
}

func TestCountJSONBytes_NestedObject(t *testing.T) {
	body := []byte(`{"a":{"b":1}}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6 (`\"a\"`+`\"b\"`)", m.Keys)
	}
	if m.Structural != 6 {
		t.Errorf("Structural = %d, want 6 ({ : { : } })", m.Structural)
	}
	if m.Values != 1 {
		t.Errorf("Values = %d, want 1 (the literal `1`)", m.Values)
	}
}

func TestCountJSONBytes_Whitespace(t *testing.T) {
	body := []byte(`{ "name" : "foo" }`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6", m.Keys)
	}
	if m.Values != 5 {
		t.Errorf("Values = %d, want 5", m.Values)
	}
	// Structural = { \s \s : \s \s } = 7
	if m.Structural != 7 {
		t.Errorf("Structural = %d, want 7", m.Structural)
	}
}

func TestCountJSONBytes_ResourcesArray(t *testing.T) {
	body := []byte(`{"resources":[{"guid":"a"},{"guid":"b"},{"guid":"c"}],"pagination":{}}`)
	m := countJSONBytes(body)

	if m.Resources != 3 {
		t.Errorf("Resources = %d, want 3", m.Resources)
	}
	// 4 keys at top level + 3 nested: "resources", "pagination" (2 top) + "guid" x3
	// bytes: `"resources"`=11, `"pagination"`=12, `"guid"`x3=18 → 41
	if m.Keys != 11+12+18 {
		t.Errorf("Keys = %d, want 41 (\"resources\"+\"pagination\"+3x\"guid\")", m.Keys)
	}
}

func TestCountJSONBytes_EscapedQuoteInString(t *testing.T) {
	// String value contains an escaped quote — must not terminate the string early
	body := []byte(`{"note":"has \"quote\" inside"}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 { // `"note"`
		t.Errorf("Keys = %d, want 6", m.Keys)
	}
	// Structural = { : } = 3
	if m.Structural != 3 {
		t.Errorf("Structural = %d, want 3 — got escaped-quote miscounted as structural", m.Structural)
	}
	// Values = everything after the key "note" and the separator colon, before the closing }
	// That's `"has \"quote\" inside"` literally in the body: 22 chars.
	if m.Values != m.RawTotal-m.Keys-m.Structural {
		t.Errorf("Values arithmetic wrong: %d vs expected %d", m.Values, m.RawTotal-m.Keys-m.Structural)
	}
}

func TestCountJSONBytes_MalformedJSON(t *testing.T) {
	body := []byte(`{"not-valid-`)
	m := countJSONBytes(body)

	// RawTotal still accurate even for malformed input
	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	// Keys should be 0 because unmarshal fails; don't crash
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0 for malformed JSON", m.Keys)
	}
}

func TestCountJSONBytes_EmptyObject(t *testing.T) {
	body := []byte(`{}`)
	m := countJSONBytes(body)

	if m.RawTotal != 2 {
		t.Errorf("RawTotal = %d, want 2", m.RawTotal)
	}
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0", m.Keys)
	}
	if m.Structural != 2 {
		t.Errorf("Structural = %d, want 2", m.Structural)
	}
	if m.Values != 0 {
		t.Errorf("Values = %d, want 0", m.Values)
	}
}

func TestCountJSONBytes_EmptyArray(t *testing.T) {
	body := []byte(`[]`)
	m := countJSONBytes(body)

	if m.RawTotal != 2 {
		t.Errorf("RawTotal = %d, want 2", m.RawTotal)
	}
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0 (no keys in an empty array)", m.Keys)
	}
	if m.Structural != 2 {
		t.Errorf("Structural = %d, want 2", m.Structural)
	}
}

func TestCountJSONBytes_StratosShapeExampleBudget(t *testing.T) {
	// Shape resembling what a real paged apps response will emit; checks that
	// resources length is found under the top-level "resources" key.
	body := []byte(`{"resources":[{"guid":"a","name":"x"},{"guid":"b","name":"y"}],` +
		`"pagination":{"totalResults":2,"totalPages":1,"first":{"href":"/p?page=1"},"last":{"href":"/p?page=1"},"next":null,"previous":null}}`)
	m := countJSONBytes(body)

	if m.Resources != 2 {
		t.Errorf("Resources = %d, want 2", m.Resources)
	}
	if m.Keys+m.Values+m.Structural != m.RawTotal {
		t.Errorf("Closure violated: %d + %d + %d != %d", m.Keys, m.Values, m.Structural, m.RawTotal)
	}
}
