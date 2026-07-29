package main

import "strings"

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
