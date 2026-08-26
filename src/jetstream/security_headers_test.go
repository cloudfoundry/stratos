package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
)

func serveThroughSecurityHeaders(t *testing.T, p *portalProxy) http.Header {
	t.Helper()
	rec := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	handler := p.securityHeaders(func(*echo.Context) error { return nil })
	if err := handler(c); err != nil {
		t.Fatalf("securityHeaders: %v", err)
	}
	return rec.Header()
}

func TestSecurityHeadersAreSetOnEveryResponse(t *testing.T) {
	header := serveThroughSecurityHeaders(t, &portalProxy{})

	for name, want := range map[string]string{
		"Permissions-Policy":           permissionsPolicy,
		"Cross-Origin-Opener-Policy":   crossOriginOpenerPolicy,
		"Cross-Origin-Resource-Policy": crossOriginResourcePolicy,
	} {
		if got := header.Get(name); got != want {
			t.Errorf("%s = %q, want %q", name, got, want)
		}
	}
}

// Seven call sites copy with navigator.clipboard.writeText — credentials,
// endpoint addresses, diagnostics reports, the foundation-shape export — and
// Monaco pastes with navigator.clipboard.read/readText. Denying either breaks
// silently: the button does nothing and no error is raised. Pinned here rather
// than left to whoever next edits the policy string.
func TestPermissionsPolicyStillAllowsClipboard(t *testing.T) {
	for _, feature := range []string{"clipboard-read=(self)", "clipboard-write=(self)"} {
		if !strings.Contains(permissionsPolicy, feature) {
			t.Errorf("%s must stay allowed for this origin: %q", feature, permissionsPolicy)
		}
	}
}

// COEP is deliberately absent: require-corp would refuse the Google Fonts
// subresources the policy permits. If it is ever added, that decision has to
// be made together with one about remote fonts, so this fails loudly rather
// than letting it arrive as an unnoticed hardening tweak.
func TestCrossOriginEmbedderPolicyIsNotSent(t *testing.T) {
	if got := serveThroughSecurityHeaders(t, &portalProxy{}).Get("Cross-Origin-Embedder-Policy"); got != "" {
		t.Errorf("COEP is not implemented; got %q", got)
	}
}

func TestHSTSIsAbsentUnlessConfigured(t *testing.T) {
	if got := serveThroughSecurityHeaders(t, &portalProxy{}).Get("Strict-Transport-Security"); got != "" {
		t.Errorf("HSTS must be off by default, got %q", got)
	}
}

// Deliberately not gated on the connection being TLS. In most deployments TLS
// terminates upstream and Jetstream sees plain HTTP, so a c.IsTLS() gate would
// suppress the header in exactly the topology that needs it. The request built
// by the helper is not TLS, which is the point.
func TestHSTSIsSentEvenWhenJetstreamItselfIsNotTLS(t *testing.T) {
	p := &portalProxy{}
	p.Config.HSTSPolicy = "max-age=1234"

	if got := serveThroughSecurityHeaders(t, p).Get("Strict-Transport-Security"); got != "max-age=1234" {
		t.Errorf("HSTS = %q, want the configured value", got)
	}
}
