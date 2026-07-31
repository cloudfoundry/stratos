package main

import (
	"crypto/rand"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// cspNoncePlaceholder is the literal token a CSP policy carries where the
// per-request nonce belongs. cspHeaderWithNonce substitutes it.
const cspNoncePlaceholder = "'nonce-PLACEHOLDER'"

// injectNonce returns htmlTemplate with nonce="<n>" on every bare <style> tag
// and ngCspNonce="<n>" on <app-root> (which Angular reads at bootstrap to
// nonce the styles it injects at runtime).
//
// nonce must come from crypto/rand.Text(). It is interpolated into an HTML
// attribute and an HTTP header unescaped, and rand.Text's base32 alphabet is
// what guarantees it carries no character able to break out of either; it also
// satisfies the CSP base64-value grammar and the spec's 128-bit entropy floor.
//
// The bare opening tags are what index.html ships today; a <style> or
// <app-root> carrying attributes would be missed silently, so
// TestInjectNonceOnRealIndexHTML asserts the tag forms have not changed.
//
// Injection is not re-appliable — no bare tag survives it — so callers must
// always inject into the pristine template and must never write the result
// back over it.
func injectNonce(htmlTemplate, nonce string) string {
	withStyles := strings.ReplaceAll(htmlTemplate, "<style>", `<style nonce="`+nonce+`">`)
	return strings.Replace(withStyles, "<app-root>", `<app-root ngCspNonce="`+nonce+`">`, 1)
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
func (p *portalProxy) serveIndexHTML(c echo.Context) error {
	nonce := rand.Text()

	if policy := p.GetConfig().CSPPolicy; policy != "" {
		c.Response().Header().Set("Content-Security-Policy", cspHeaderWithNonce(policy, nonce))
	}

	// Each response carries a different nonce, so this document must never be
	// stored: a 304 would pair the fresh header with a stale body and block
	// every style. This overrides the weaker no-cache that
	// setStaticCacheContentMiddleware puts on every response.
	c.Response().Header().Set("Cache-Control", "no-store")

	return c.HTML(http.StatusOK, injectNonce(p.indexHTMLTemplate, nonce))
}
