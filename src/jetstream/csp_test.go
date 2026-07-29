package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInjectNonceStylesAndAppRoot(t *testing.T) {
	in := `<style>a{}</style><app-root></app-root><style>b{}</style>`
	out := injectNonce(in, "N1")
	if strings.Count(out, `nonce="N1"`) != 2 {
		t.Errorf("both <style> tags must be nonced: %q", out)
	}
	if !strings.Contains(out, `<app-root ngCspNonce="N1">`) {
		t.Errorf("app-root must carry ngCspNonce: %q", out)
	}
}

// The synthetic string above cannot detect a change to the tag forms the
// frontend actually ships. index.html has two bare <style> tags — the first is
// inside <noscript>, so a count-1 replace would nonce the wrong one — and one
// bare <app-root>. The counts below match every opening form ("<style", not
// "<style>") so that a tag gaining an attribute turns this test red rather
// than letting injectNonce miss it silently. Missing the file is a failure,
// not a skip: this is the only guard against that silent miss.
func TestInjectNonceOnRealIndexHTML(t *testing.T) {
	path := filepath.Join("..", "frontend", "packages", "core", "src", "index.html")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("cannot read %s: %v", path, err)
	}
	in := string(raw)
	if strings.Count(in, "<style") != 2 || strings.Count(in, "<app-root") != 1 {
		t.Fatalf("index.html tag forms changed: %d <style>, %d <app-root>; injectNonce must be updated",
			strings.Count(in, "<style"), strings.Count(in, "<app-root"))
	}

	out := injectNonce(in, "N1")
	if got := strings.Count(out, `<style nonce="N1">`); got != 2 {
		t.Errorf("expected 2 nonced style tags, got %d", got)
	}
	if got := strings.Count(out, `<app-root ngCspNonce="N1">`); got != 1 {
		t.Errorf("expected 1 nonced app-root, got %d", got)
	}
	if strings.Contains(out, "<style>") || strings.Contains(out, "<app-root>") {
		t.Error("no bare <style> or <app-root> may survive injection")
	}
}

// Injection is not re-appliable: the first nonce sticks. Callers must always
// inject into the pristine template, never into a previous result.
func TestInjectNonceOnAlreadyInjectedHTMLKeepsFirstNonce(t *testing.T) {
	in := `<style>a{}</style><app-root></app-root>`
	out := injectNonce(injectNonce(in, "A"), "B")
	if strings.Contains(out, `"B"`) {
		t.Errorf("second injection must not apply: %q", out)
	}
	if !strings.Contains(out, `<style nonce="A">`) || !strings.Contains(out, `<app-root ngCspNonce="A">`) {
		t.Errorf("first nonce must be retained: %q", out)
	}
}

func TestCspHeaderWithNonceSubstitutesPlaceholder(t *testing.T) {
	pol := "default-src 'self'; style-src 'self' 'nonce-PLACEHOLDER'"
	got := cspHeaderWithNonce(pol, "N1")
	if got != "default-src 'self'; style-src 'self' 'nonce-N1'" {
		t.Errorf("nonce not substituted: %q", got)
	}
}

// The end-state policy carries the placeholder in more than one directive, so
// every occurrence must be substituted — a count-1 replace would ship a
// literal 'nonce-PLACEHOLDER' in the second directive, which is a predictable
// nonce an attacker can match.
func TestCspHeaderWithNonceSubstitutesEveryPlaceholder(t *testing.T) {
	pol := "script-src 'self' 'nonce-PLACEHOLDER'; style-src 'self' 'nonce-PLACEHOLDER'"
	got := cspHeaderWithNonce(pol, "N1")
	if strings.Contains(got, "PLACEHOLDER") {
		t.Errorf("no placeholder may survive: %q", got)
	}
	if strings.Count(got, "'nonce-N1'") != 2 {
		t.Errorf("expected 2 substitutions: %q", got)
	}
}

func TestCspHeaderWithNonceLeavesEmptyPolicyEmpty(t *testing.T) {
	if got := cspHeaderWithNonce("", "N1"); got != "" {
		t.Errorf("empty policy stays empty: %q", got)
	}
}

func TestCspHeaderWithNonceLeavesPolicyWithoutPlaceholderUnchanged(t *testing.T) {
	pol := "default-src 'self'; style-src 'self' 'unsafe-inline'"
	if got := cspHeaderWithNonce(pol, "N1"); got != pol {
		t.Errorf("custom policy must pass through verbatim: %q", got)
	}
}
