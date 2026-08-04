package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
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

func TestInjectNonceScriptTags(t *testing.T) {
	in := `<script src="polyfills-AAA.js" type="module"></script><script src="main-BBB.js" type="module"></script>`
	out := injectNonce(in, "N1")
	if got := strings.Count(out, `type="module" nonce="N1"></script>`); got != 2 {
		t.Errorf("both module scripts must be nonced, got %d: %q", got, out)
	}
	if strings.Contains(out, `type="module"></script>`) {
		t.Errorf("no un-nonced module script may survive injection: %q", out)
	}
}

// The hash in src changes on every build. It sits outside the matched literal,
// so a differing hash must not affect the result.
func TestInjectNonceScriptTagsIsHashIndependent(t *testing.T) {
	in := `<script src="main-ZZZZZZZZ.js" type="module"></script>`
	if got := injectNonce(in, "N1"); !strings.Contains(got, `src="main-ZZZZZZZZ.js" type="module" nonce="N1">`) {
		t.Errorf("hash must survive untouched and the tag be nonced: %q", got)
	}
}

// The synthetic string above cannot detect a change to the tag forms the
// frontend actually ships. index.html has two bare <style> tags — the first is
// inside <noscript>, so a count-1 replace would nonce the wrong one — and one
// bare <app-root>. The counts below match every opening form ("<style", not
// "<style>") so that a tag gaining an attribute turns this test red rather
// than letting injectNonce miss it silently. Missing the file is a failure,
// not a skip: this is the only guard against that silent miss.
//
// Script tags are deliberately absent from the assertions: the source file
// carries none — Angular's build appends them — so this test cannot pin the
// form injectNonce has to match. scriptNonceGap covers that at startup
// instead; see TestScriptNonceGap.
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

	// If the source ever gains script tags, the startup guard stops being the
	// only thing standing between a form change and un-nonced scripts, and
	// this test should assert on them directly.
	if strings.Contains(in, "<script") {
		t.Error("index.html now ships script tags; assert their form here rather than relying on scriptNonceGap alone")
	}
}

// scriptNonceGap is the whole guard for the script form: no built index.html
// exists in the repo and the backend suite never runs the frontend build, so
// nothing else can see what the builder actually emits.
func TestScriptNonceGap(t *testing.T) {
	cases := []struct {
		name string
		html string
		want bool
	}{
		{"emitted form matches", `<script src="main-AAA.js" type="module"></script>`, false},
		{"both emitted scripts match", `<script src="a.js" type="module"></script><script src="b.js" type="module"></script>`, false},
		{"unmatchable form", `<script src="main-AAA.js" defer></script>`, true},
		{"attribute order swapped", `<script type="module" src="main-AAA.js"></script>`, true},
		{"inline script carries no src to match", `<script>console.log(1)</script>`, true},
		{"no scripts at all", `<style>a{}</style><app-root></app-root>`, false},
		{"one matchable, one not", `<script src="a.js" type="module"></script><script src="b.js" defer></script>`, true},
	}
	for _, tc := range cases {
		if got := scriptNonceGap(tc.html); got != tc.want {
			t.Errorf("%s: scriptNonceGap = %v, want %v", tc.name, got, tc.want)
		}
	}
}

// Injection is not re-appliable: the first nonce sticks. Callers must always
// inject into the pristine template, never into a previous result.
func TestInjectNonceOnAlreadyInjectedHTMLKeepsFirstNonce(t *testing.T) {
	in := `<style>a{}</style><app-root></app-root><script src="main-AAA.js" type="module"></script>`
	out := injectNonce(injectNonce(in, "A"), "B")
	if strings.Contains(out, `"B"`) {
		t.Errorf("second injection must not apply: %q", out)
	}
	if !strings.Contains(out, `<style nonce="A">`) || !strings.Contains(out, `<app-root ngCspNonce="A">`) {
		t.Errorf("first nonce must be retained: %q", out)
	}
	if !strings.Contains(out, `type="module" nonce="A"></script>`) {
		t.Errorf("script must retain the first nonce: %q", out)
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

// directiveSources returns the source list of the named directive in policy.
// Splitting on the directive name is what distinguishes style-src from
// style-src-elem — a substring search matches both.
func directiveSources(t *testing.T, policy, name string) []string {
	t.Helper()
	for _, directive := range strings.Split(policy, "; ") {
		if fields := strings.Fields(directive); len(fields) > 0 && fields[0] == name {
			return fields[1:]
		}
	}
	t.Fatalf("policy has no %s directive: %q", name, policy)
	return nil
}

// Nothing else proves the shipped policy participates in the nonce mechanism.
// A style-src-elem without the placeholder is enforced against every <style>
// in the document with no nonce able to satisfy it, which blocks the lot.
func TestDefaultCSPPolicyNoncesStyleElements(t *testing.T) {
	if !slices.Contains(directiveSources(t, defaultCSPPolicy, "style-src-elem"), cspNoncePlaceholder) {
		t.Errorf("style-src-elem must carry the nonce placeholder: %q", defaultCSPPolicy)
	}
}

// The script half of the same mechanism. 'strict-dynamic' alone would block
// every script in the document, and the placeholder alone would leave the lazy
// chunks main.js pulls in unauthorised — neither token is useful without the
// other, so both are asserted together.
func TestDefaultCSPPolicyNoncesScripts(t *testing.T) {
	sources := directiveSources(t, defaultCSPPolicy, "script-src")
	for _, want := range []string{cspNoncePlaceholder, "'strict-dynamic'"} {
		if !slices.Contains(sources, want) {
			t.Errorf("script-src must carry %s: %q", want, defaultCSPPolicy)
		}
	}
}

// 'strict-dynamic' makes a browser ignore every host and 'self' source in the
// same directive. One left behind reads as a grant that no longer holds, which
// is how a policy comes to be trusted for something it does not do.
//
// 'report-sample' is exempt because it is not a source: it grants nothing and
// matches nothing, it only asks the browser to describe what it refused.
func TestDefaultCSPPolicyScriptSrcCarriesNoIgnoredSource(t *testing.T) {
	for _, source := range directiveSources(t, defaultCSPPolicy, "script-src") {
		switch source {
		case cspNoncePlaceholder, "'strict-dynamic'", cspReportSample:
			continue
		}
		t.Errorf("strict-dynamic makes script-src's %s ignored: %q", source, defaultCSPPolicy)
	}
}

// Without 'report-sample' a browser sends script-sample empty, so a blocked
// inline script or style is reported as nothing but blocked-uri "inline" —
// which names no file, no line worth trusting, and nothing to grep for. Both
// directives that enforce against inline content have to ask for it; asking in
// one leaves the other half of the policy undiagnosable.
func TestDefaultCSPPolicyAsksForViolationSamples(t *testing.T) {
	for _, directive := range []string{"script-src", "style-src-elem"} {
		if !slices.Contains(directiveSources(t, defaultCSPPolicy, directive), cspReportSample) {
			t.Errorf("%s must carry %s: %q", directive, cspReportSample, defaultCSPPolicy)
		}
	}
}

// style-src keeps 'unsafe-inline', so an inline style attribute never violates
// it and never produces a sample. Asking anyway would read as telemetry that
// arrives, and none ever would.
func TestDefaultCSPPolicyDoesNotAskForSamplesItCannotGet(t *testing.T) {
	if slices.Contains(directiveSources(t, defaultCSPPolicy, "style-src"), cspReportSample) {
		t.Errorf("style-src permits inline, so it can never sample: %q", defaultCSPPolicy)
	}
}

// blob: was here for Monaco's language workers, which have been built from
// same-origin module URLs since the ESM change in #5561. A blob: worker
// inherits the creating document's policy, so re-granting it is a way back to
// running script the nonce never authorised — the one thing script-src
// 'strict-dynamic' was just tightened to prevent.
func TestDefaultCSPPolicyWorkerSrcForbidsBlobURLs(t *testing.T) {
	if slices.Contains(directiveSources(t, defaultCSPPolicy, "worker-src"), "blob:") {
		t.Errorf("worker-src must not grant blob:: %q", defaultCSPPolicy)
	}
}

// style-src-elem overrides style-src for elements wholesale rather than
// intersecting with it, so a source added to style-src alone is silently
// withdrawn from every <style> and <link rel=stylesheet>.
func TestDefaultCSPPolicyStyleElemRepeatsEveryStyleSrcSource(t *testing.T) {
	elem := directiveSources(t, defaultCSPPolicy, "style-src-elem")
	for _, source := range directiveSources(t, defaultCSPPolicy, "style-src") {
		// The one deliberate omission: dropping 'unsafe-inline' for elements is
		// the entire purpose of the directive. Browsers ignore it beside a nonce
		// anyway; it stays in style-src for attributes and pre-CSP3 browsers.
		if source == "'unsafe-inline'" {
			continue
		}
		if !slices.Contains(elem, source) {
			t.Errorf("style-src grants %s but style-src-elem does not repeat it: %q", source, defaultCSPPolicy)
		}
	}
}

// The mechanism end to end on the policy that actually ships, rather than on a
// synthetic one: the styles in the document must carry the value the header's
// style-src-elem authorises.
func TestServeIndexHTMLNoncesStyleElementsUnderTheDefaultPolicy(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<style>a{}</style><app-root></app-root>`}
	p.Config.CSPPolicy = defaultCSPPolicy

	rec := serveIndex(t, p)
	hdr := rec.Header().Get("Content-Security-Policy")
	nonce := nonceFromHeader(t, hdr)

	if !slices.Contains(directiveSources(t, hdr, "style-src-elem"), "'nonce-"+nonce+"'") {
		t.Errorf("style-src-elem must carry the substituted nonce: %q", hdr)
	}
	if !strings.Contains(rec.Body.String(), `<style nonce="`+nonce+`">`) {
		t.Errorf("document styles must carry the nonce %q: %q", nonce, rec.Body.String())
	}
}

// The script mechanism end to end on the shipped policy: under
// 'strict-dynamic' the nonce is the only thing that can authorise the build's
// module scripts, so header and markup have to agree or the app does not boot
// at all.
func TestServeIndexHTMLNoncesScriptsUnderTheDefaultPolicy(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<app-root></app-root><script src="main-ABC.js" ` + moduleScriptTail}
	p.Config.CSPPolicy = defaultCSPPolicy

	rec := serveIndex(t, p)
	hdr := rec.Header().Get("Content-Security-Policy")
	nonce := nonceFromHeader(t, hdr)

	if !slices.Contains(directiveSources(t, hdr, "script-src"), "'nonce-"+nonce+"'") {
		t.Errorf("script-src must carry the substituted nonce: %q", hdr)
	}
	if !strings.Contains(rec.Body.String(), `type="module" nonce="`+nonce+`">`) {
		t.Errorf("document scripts must carry the nonce %q: %q", nonce, rec.Body.String())
	}
}

func serveIndex(t *testing.T, p *portalProxy) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := p.serveIndexHTML(c); err != nil {
		t.Fatalf("serveIndexHTML: %v", err)
	}
	return rec
}

func nonceFromHeader(t *testing.T, hdr string) string {
	t.Helper()
	_, after, found := strings.Cut(hdr, "'nonce-")
	if !found {
		t.Fatalf("no nonce in header: %q", hdr)
	}
	nonce, _, found := strings.Cut(after, "'")
	if !found {
		t.Fatalf("unterminated nonce in header: %q", hdr)
	}
	return nonce
}

// The header nonce and the markup nonce are the same value or the browser
// blocks the very styles the header just permitted.
func TestServeIndexHTMLPutsTheSameNonceInHeaderAndBody(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<style>a{}</style><app-root></app-root>`}
	p.Config.CSPPolicy = "style-src 'self' " + cspNoncePlaceholder

	rec := serveIndex(t, p)

	hdr := rec.Header().Get("Content-Security-Policy")
	if strings.Contains(hdr, "PLACEHOLDER") {
		t.Fatalf("placeholder must be substituted: %q", hdr)
	}
	nonce := nonceFromHeader(t, hdr)
	body := rec.Body.String()
	if !strings.Contains(body, `<style nonce="`+nonce+`">`) || !strings.Contains(body, `<app-root ngCspNonce="`+nonce+`">`) {
		t.Errorf("body must carry the header nonce %q: %q", nonce, body)
	}
}

// Injection must run against the pristine template on every request. Caching
// the injected result would reuse one nonce for the life of the process, which
// is no better than 'unsafe-inline'.
func TestServeIndexHTMLMintsAFreshNoncePerRequest(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<style>a{}</style><app-root></app-root>`}
	p.Config.CSPPolicy = "style-src " + cspNoncePlaceholder

	first := nonceFromHeader(t, serveIndex(t, p).Header().Get("Content-Security-Policy"))
	second := nonceFromHeader(t, serveIndex(t, p).Header().Get("Content-Security-Policy"))

	if first == second {
		t.Errorf("nonce must differ per request, got %q twice", first)
	}
}

// Every response carries a unique nonce, so this document must never be
// cached. no-cache is not enough: it permits a 304 that pairs a freshly minted
// header nonce with the stale body the browser already holds.
func TestServeIndexHTMLIsNeverCached(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<app-root></app-root>`}

	if got := serveIndex(t, p).Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("index.html must be no-store, got %q", got)
	}
}

// setStaticCacheContentMiddleware sets no-cache on every response before the
// handler runs. The handler's no-store is what must survive — this is why
// index.html needs no exclusion from that middleware.
func TestServeIndexHTMLOverridesTheStaticCacheMiddleware(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<app-root></app-root>`}
	rec := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)

	if err := p.setStaticCacheContentMiddleware(p.serveIndexHTML)(c); err != nil {
		t.Fatalf("serveIndexHTML: %v", err)
	}

	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("handler must override the middleware's no-cache, got %q", got)
	}
}

// registerRoutes registers GET "/" alongside .Static("/", dir), which is
// GET "/*". Echo must prefer the explicit route or the document goes out raw
// and unnonced, with nothing else failing to show it.
func TestExplicitRootRouteBeatsTheStaticHandler(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("RAW"), 0o600); err != nil {
		t.Fatalf("write index.html: %v", err)
	}
	p := &portalProxy{indexHTMLTemplate: `<app-root></app-root>`}
	e := echo.New()
	g := e.Group("")
	g.GET("/", p.serveIndexHTML)
	g.Static("/", dir)

	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if strings.Contains(rec.Body.String(), "RAW") {
		t.Errorf("static handler won: %q", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "ngCspNonce=") {
		t.Errorf("document not nonced: %q", rec.Body.String())
	}
}

// CONSOLE_CSP=off leaves the policy empty. No header may be emitted at all —
// an empty Content-Security-Policy header is not the same as none.
func TestServeIndexHTMLOmitsCSPHeaderWhenPolicyEmpty(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<app-root></app-root>`}

	rec := serveIndex(t, p)

	if got := rec.Header().Get("Content-Security-Policy"); got != "" {
		t.Errorf("no CSP header when the policy is empty, got %q", got)
	}
}

func TestPolicyWithReportingAppendsTheDirective(t *testing.T) {
	got := policyWithReporting("default-src 'self'")
	if got != "default-src 'self'; report-uri "+cspReportPath {
		t.Errorf("the reporting directive should be appended, got %q", got)
	}
}

// A custom policy gets the directive too. It grants and denies nothing, and an
// operator who wrote their own policy is the most likely to block something by
// accident.
func TestPolicyWithReportingAppliesToACustomPolicy(t *testing.T) {
	if !strings.Contains(policyWithReporting("default-src 'none'"), "report-uri "+cspReportPath) {
		t.Error("a custom policy should carry the reporting directive")
	}
}

// Declaring report-uri twice does not merge the destinations — the browser
// takes the first and warns about the rest — so appending would silently cost
// the operator the collector they chose.
func TestPolicyWithReportingLeavesAnOperatorsOwnDestinationAlone(t *testing.T) {
	for _, policy := range []string{
		"default-src 'self'; report-uri https://collector.example/csp",
		"default-src 'self'; report-to csp-endpoint",
	} {
		if got := policyWithReporting(policy); got != policy {
			t.Errorf("policy %q already reports somewhere and must be left alone, got %q", policy, got)
		}
	}
}

// CSP off means no header at all, so there is nothing to append to.
func TestPolicyWithReportingLeavesEmptyPolicyEmpty(t *testing.T) {
	if got := policyWithReporting(""); got != "" {
		t.Errorf("an empty policy must stay empty, got %q", got)
	}
}

func TestServeIndexHTMLSendsNoReportOnlyHeaderUnlessConfigured(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<style>a{}</style><app-root></app-root>`}
	p.Config.CSPPolicy = defaultCSPPolicy

	if got := serveIndex(t, p).Header().Get("Content-Security-Policy-Report-Only"); got != "" {
		t.Errorf("no report-only policy is configured, so no header should be sent, got %q", got)
	}
}

// Both headers describe the same response, so a candidate policy that nonces
// anything has to carry the nonce that response actually used.
func TestServeIndexHTMLReportOnlyCarriesTheEnforcedNonce(t *testing.T) {
	p := &portalProxy{indexHTMLTemplate: `<style>a{}</style><app-root></app-root>`}
	p.Config.CSPPolicy = "style-src-elem 'self' " + cspNoncePlaceholder
	p.Config.CSPReportOnlyPolicy = "script-src " + cspNoncePlaceholder + " 'strict-dynamic'"

	rec := serveIndex(t, p)
	enforced := rec.Header().Get("Content-Security-Policy")
	reportOnly := rec.Header().Get("Content-Security-Policy-Report-Only")

	if reportOnly == "" {
		t.Fatal("a configured report-only policy must be sent")
	}
	if strings.Contains(reportOnly, "PLACEHOLDER") {
		t.Errorf("the report-only placeholder must be substituted too: %q", reportOnly)
	}
	if nonceFromHeader(t, reportOnly) != nonceFromHeader(t, enforced) {
		t.Errorf("both headers describe one response and must share its nonce:\n enforced=%q\n report-only=%q", enforced, reportOnly)
	}
}

// Plugin content executes script by a route script-src does not govern. The
// directive is declared rather than inherited: falling back to default-src
// 'self' would still permit <object> and <embed> from this origin.
func TestDefaultCSPPolicyForbidsPluginContent(t *testing.T) {
	sources := directiveSources(t, defaultCSPPolicy, "object-src")
	if !slices.Equal(sources, []string{"'none'"}) {
		t.Errorf("object-src must be exactly 'none', got %v", sources)
	}
}
