package main

import (
	"github.com/labstack/echo/v5"
)

// permissionsPolicy switches off the browser features Stratos never uses, so
// injected script cannot reach them either. A feature named with an empty
// allowlist is denied outright; a feature not named here keeps its browser
// default, which is why the list only has to cover what is worth denying.
//
// clipboard-read and clipboard-write are deliberately ALLOWED for this origin,
// and both are used far more widely than the copy buttons suggest. Seven call
// sites reach navigator.clipboard.writeText directly — endpoint addresses,
// service-key credentials, masked CF credentials, the two diagnostics reports,
// the foundation-shape export and the shared copy-to-clipboard component,
// which is itself embedded in four more places. The Monaco editor calls
// navigator.clipboard.read/readText to paste, which is what clipboard-read
// covers. Denying either fails silently: the button does nothing, paste does
// nothing, and no error is raised.
//
// These two directives govern the asynchronous Clipboard API and nothing else.
// Most copying in a browser never touches it: cut, copy and paste in a plain
// input or textarea is native editing, xterm moves terminal text through
// ClipboardEvent.clipboardData, and Monaco also uses document.execCommand.
// None of those is affected by Permissions-Policy and all keep working however
// this is set — which is exactly why the gated paths are easy to break without
// noticing. Testing "can I still paste into a text box" proves nothing here.
const permissionsPolicy = "accelerometer=(), autoplay=(), camera=(), " +
	"display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), " +
	"magnetometer=(), microphone=(), midi=(), payment=(), " +
	"publickey-credentials-get=(), screen-wake-lock=(), usb=(), " +
	"xr-spatial-tracking=(), clipboard-read=(self), clipboard-write=(self)"

// crossOriginOpenerPolicy puts the console in its own browsing-context group,
// so a cross-origin document can neither reach into it through window.opener
// nor be reached by it. Safe here because Stratos opens no popups: every
// external link is target="_blank" rel="noopener noreferrer", which already
// severs that relationship.
const crossOriginOpenerPolicy = "same-origin"

// crossOriginResourcePolicy stops another origin embedding Stratos responses
// as subresources. Stratos serves an application rather than a CDN, so nothing
// legitimate needs to.
const crossOriginResourcePolicy = "same-origin"

// Cross-Origin-Embedder-Policy: NOT IMPLEMENTED, deliberately.
//
// COEP "require-corp" refuses every cross-origin subresource that does not opt
// in via CORP or CORS. The policy permits Google Fonts — fonts.googleapis.com
// for the stylesheet, fonts.gstatic.com for the font files — and the branding
// work intends to let users pick a font from there, so turning COEP on would
// break that.
//
// It would also buy little on its own. COEP exists chiefly to establish
// cross-origin isolation, which unlocks SharedArrayBuffer and high-resolution
// timers; Stratos uses neither. Revisit it only together with a decision about
// remote fonts, not as a standalone hardening step.

// defaultHSTSPolicy is what CONSOLE_HSTS=on selects. Two years with subdomains
// is the value the HSTS preload list requires, but preload itself is left out:
// it is effectively irreversible, and that is an operator's call to make for
// their own domain rather than a default Stratos imposes.
const defaultHSTSPolicy = "max-age=63072000; includeSubDomains"

// securityHeaders sets the response headers that are identical on every
// response.
//
// The Content-Security-Policy is deliberately not among them: it carries a
// per-response nonce, so serveIndexHTML sets it on the single document that
// needs one. See csp.go.
func (p *portalProxy) securityHeaders(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		header := c.Response().Header()
		header.Set("Permissions-Policy", permissionsPolicy)
		header.Set("Cross-Origin-Opener-Policy", crossOriginOpenerPolicy)
		header.Set("Cross-Origin-Resource-Policy", crossOriginResourcePolicy)

		// Sent whenever the operator has opted in, without checking whether
		// this particular connection is TLS. In most deployments TLS
		// terminates at a router in front of Jetstream, which then forwards
		// these headers to the browser over HTTPS — so gating on c.IsTLS()
		// would suppress the header in exactly the topology that needs it.
		// Sending it over plain HTTP costs nothing: browsers are required to
		// ignore HSTS received over an insecure transport.
		if policy := p.GetConfig().HSTSPolicy; policy != "" {
			header.Set("Strict-Transport-Security", policy)
		}

		return next(c)
	}
}
