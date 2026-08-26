package main

import (
	"crypto/rand"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
)

// cspNoncePlaceholder is the literal token a CSP policy carries where the
// per-request nonce belongs. cspHeaderWithNonce substitutes it.
const cspNoncePlaceholder = "'nonce-PLACEHOLDER'"

// cspReportSample is the token that asks a browser to include the first of the
// refused script or style in its violation report's script-sample. It is not a
// source expression: it grants nothing and matches nothing, so it can sit in a
// directive alongside 'strict-dynamic' without weakening it.
//
// It only has an effect in a directive that can refuse inline content, which is
// why style-src does not carry it — 'unsafe-inline' means nothing violates it.
const cspReportSample = "'report-sample'"

// moduleScriptTail is the closing run every script tag the Angular build emits
// ends with: <script src="main-<hash>.js" type="module"></script>. The hash
// lives in src, outside this literal, so matching it needs neither a regex nor
// an HTML rewrite — and once a nonce has been spliced in, the literal no
// longer occurs, which is what keeps injection non-re-appliable.
const moduleScriptTail = `type="module"></script>`

// injectNonce returns htmlTemplate with nonce="<n>" on every bare <style> tag
// and on every module <script>, and ngCspNonce="<n>" on <app-root> (which
// Angular reads at bootstrap to nonce the styles it injects at runtime).
//
// nonce must come from crypto/rand.Text(). It is interpolated into an HTML
// attribute and an HTTP header unescaped, and rand.Text's base32 alphabet is
// what guarantees it carries no character able to break out of either; it also
// satisfies the CSP base64-value grammar and the spec's 128-bit entropy floor.
//
// The bare opening tags are what index.html ships today; a <style> or
// <app-root> carrying attributes would be missed silently, so
// TestInjectNonceOnRealIndexHTML asserts the tag forms have not changed. It
// cannot do the same for scripts — the source file has none, the build appends
// them — so scriptNonceGap reports that mismatch at startup instead.
//
// Injection is not re-appliable — no bare tag and no un-nonced module script
// survives it — so callers must always inject into the pristine template and
// must never write the result back over it.
func injectNonce(htmlTemplate, nonce string) string {
	withStyles := strings.ReplaceAll(htmlTemplate, "<style>", `<style nonce="`+nonce+`">`)
	withScripts := strings.ReplaceAll(withStyles, moduleScriptTail, `type="module" nonce="`+nonce+`"></script>`)
	return strings.Replace(withScripts, "<app-root>", `<app-root ngCspNonce="`+nonce+`">`, 1)
}

// scriptNonceGap reports whether htmlTemplate carries any script tag that
// injectNonce cannot reach, by comparing opening tags against matchable ones.
//
// Counting rather than testing for presence is deliberate: it catches a
// template where only some scripts are matchable, and an inline <script>, both
// of which would otherwise be served un-nonced and blocked under a policy
// without 'unsafe-inline'.
func scriptNonceGap(htmlTemplate string) bool {
	return strings.Count(htmlTemplate, "<script") != strings.Count(htmlTemplate, moduleScriptTail)
}

// cspHeaderWithNonce returns policy with every nonce placeholder replaced by
// the per-request nonce. An empty policy stays empty (CSP is opt-out, and the
// caller must not emit an empty header). A policy carrying no placeholder —
// an operator's custom CONSOLE_CSP, for instance — passes through verbatim.
func cspHeaderWithNonce(policy, nonce string) string {
	if policy == "" {
		return ""
	}
	return strings.ReplaceAll(policy, cspNoncePlaceholder, "'nonce-"+nonce+"'")
}

// policyWithReporting appends the violation reporting directive to policy.
//
// This applies to an operator's custom CONSOLE_CSP as well as the built-in
// policy, which is a deliberate exception to using a custom policy verbatim.
// A reporting directive grants and denies nothing — it cannot change what the
// browser loads — and an operator who has written their own policy is the one
// most likely to block something they did not intend to.
//
// A policy that already names a reporting directive is left alone. Declaring
// report-uri twice does not merge the two: the browser takes the first and
// warns about the rest, so appending would quietly cost the operator the
// destination they chose.
func policyWithReporting(policy string) string {
	if policy == "" {
		return ""
	}
	if strings.Contains(policy, "report-uri") || strings.Contains(policy, "report-to") {
		return policy
	}
	return policy + "; report-uri " + cspReportPath
}

// serveIndexHTML serves the SPA document with a freshly minted nonce in both
// the CSP header and the markup that header authorises.
//
// This is the only response that carries a CSP header. A nonce is per-response
// by definition, so it cannot come from Echo's Secure middleware, which emits
// one string fixed at startup; every other response needs no nonce because
// 'self' already covers the assets it serves.
//
// p.indexHTMLTemplate must be the pristine template — injectNonce is not
// re-appliable, so the result is never written back over it.
func (p *portalProxy) serveIndexHTML(c *echo.Context) error {
	nonce := rand.Text()
	config := p.GetConfig()

	if policy := config.CSPPolicy; policy != "" {
		c.Response().Header().Set("Content-Security-Policy", cspHeaderWithNonce(policy, nonce))
	}

	// A report-only policy rides alongside the enforced one, carrying the same
	// nonce because it describes the same response. Nothing it names is
	// blocked; violations of it are reported with disposition "report", which
	// is how a stricter policy gets measured against real traffic before it is
	// enforced. Empty unless an operator supplies one.
	if policy := config.CSPReportOnlyPolicy; policy != "" {
		c.Response().Header().Set("Content-Security-Policy-Report-Only", cspHeaderWithNonce(policy, nonce))
	}

	// Each response carries a different nonce, so this document must never be
	// stored: a 304 would pair the fresh header with a stale body and block
	// every style. This overrides the weaker no-cache that
	// setStaticCacheContentMiddleware puts on every response.
	c.Response().Header().Set("Cache-Control", "no-store")

	return c.HTML(http.StatusOK, injectNonce(p.indexHTMLTemplate, nonce))
}
