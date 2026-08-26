package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"regexp"
	"strconv"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v5"
	log "github.com/sirupsen/logrus"
)

// capiStatusRe matches the "(status NNN)" fragment capi.MapHTTPError embeds in
// its error messages. capi sentinel errors don't expose the numeric HTTP
// status via a field, so this is the only way to recover it for display.
var capiStatusRe = regexp.MustCompile(`\(status (\d{3})\)`)

// gorouterRouteMissingRe matches the body gorouter returns when the platform's
// route table has no entry for the CF API host ("404 Not Found: Requested
// route ('api.example.com') does not exist."). It reaches us as a capi 404,
// but it is a router-level availability failure — the CF API itself was never
// consulted — so it must not be confused with a CAPI resource 404.
var gorouterRouteMissingRe = regexp.MustCompile(`Requested route \('[^']*'\) does not exist`)

// isRouterRouteMissing reports whether err is the gorouter route-flap 404.
func isRouterRouteMissing(err error) bool {
	return err != nil && gorouterRouteMissingRe.MatchString(err.Error())
}

// stratosErrorReasonHeader carries the machine-readable failure classification
// to the frontend. Present only for the called-out reasons (unreachable,
// auth_expired); absent for unclassified errors.
const stratosErrorReasonHeader = "X-Stratos-Error-Reason"

// stratosUpstreamStatusHeader carries the upstream CF/UAA HTTP status (e.g.
// 503) when recoverable, so the frontend can show the real error code even
// though the Stratos response status is a mapped value (often 502).
const stratosUpstreamStatusHeader = "X-Stratos-Upstream-Status"

// setNativeCFErrorHeaders classifies err and sets the reason + upstream-status
// response headers when recoverable. Shared by both native error-shaping
// paths: nativeCFError (raw-error middleware path) and handleCapiError
// (handlers that write a mapped status directly). Returns the reason so
// callers can branch if needed.
func setNativeCFErrorHeaders(ctx *echo.Context, err error) cfErrorReason {
	reason := classifyCfError(err)
	if reason != reasonUnclassified {
		ctx.Response().Header().Set(stratosErrorReasonHeader, string(reason))
	}
	if status := upstreamStatusOf(err); status > 0 {
		ctx.Response().Header().Set(stratosUpstreamStatusHeader, strconv.Itoa(status))
	}
	return reason
}

// nativeCFErrorBody is the JSON body returned for a native CF handler error.
// It is marshalled to a '{'-led string so the frontend's first-character
// discriminator parses it as JSON (vs a '#'-led or legacy plain string).
type nativeCFErrorBody struct {
	Reason         string `json:"reason"`
	UpstreamStatus int    `json:"upstreamStatus,omitempty"`
	Detail         string `json:"detail"`
	CnsiGUID       string `json:"cnsiGuid,omitempty"`
}

// nativeCFError classifies err, sets the reason header for called-out reasons,
// and returns a 502 echo error whose body is a '{'-led JSON object the
// frontend parses to drive the right banner. The cnsiGUID is always included
// so the endpoint can be named regardless of reason.
func nativeCFError(c *echo.Context, cnsiGUID string, err error) error {
	reason := setNativeCFErrorHeaders(c, err)
	body := nativeCFErrorBody{
		Reason:         string(reason),
		UpstreamStatus: upstreamStatusOf(err),
		Detail:         err.Error(),
		CnsiGUID:       cnsiGUID,
	}
	encoded, mErr := json.Marshal(body)
	if mErr != nil {
		// Should never happen for these fields; fall back to the plain detail.
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	return echo.NewHTTPError(http.StatusBadGateway, string(encoded))
}

// classifyNativeErrors is echo middleware for the native CF routes. When a
// handler returns a raw (non-*echo.HTTPError) error and the request carries a
// :cnsiGuid path param, it shapes the error via nativeCFError so the response
// gets the classification header + '{'-led JSON body. Errors that are already
// *echo.HTTPError (auth/config failures such as "could not determine user")
// and requests without a cnsiGuid pass through unchanged, preserving existing
// status codes and the legacy plain-text body.
func classifyNativeErrors(next echo.HandlerFunc) echo.HandlerFunc {
	return func(ctx *echo.Context) error {
		err := next(ctx)
		if err == nil {
			return nil
		}
		if _, ok := err.(*echo.HTTPError); ok {
			return err
		}
		cnsiGUID := ctx.Param("cnsiGuid")
		if cnsiGUID == "" {
			return err
		}
		// Client abandoned the request (page navigation cancels in-flight
		// fetches — routine). Not a gateway failure: log quietly at debug
		// and answer 499-style instead of polluting logs/metrics with 502s.
		// The response never reaches the client anyway.
		if reqErr := ctx.Request().Context().Err(); errors.Is(reqErr, context.Canceled) {
			log.Debugf("[diag drain] client-abort cnsi=%s path=%s err=%v", cnsiGUID, ctx.Path(), err)
			return echo.NewHTTPError(statusClientClosedRequest, "client closed request")
		}
		// A 414 that escaped the chunked internal drains means a pass-through
		// guid filter (width = whatever the frontend sent) exceeded the
		// platform's URI ceiling — make it operator-visible (#5579).
		if upstreamStatusOf(err) == 414 {
			log.Warnf("request %s rejected upstream with 414 Request-URI Too Large — a guid filter exceeds what the platform chain accepts; re-run the endpoint probe on the diagnostics page and lower %s (currently %d)",
				ctx.Path(), guidChunkEnv, guidChunkSize())
		}
		return nativeCFError(ctx, cnsiGUID, err)
	}
}

// statusClientClosedRequest is nginx's non-standard 499 "client closed
// request" — the conventional status for a request the client abandoned.
const statusClientClosedRequest = 499

// diagFailKind classifies a failed CAPI call in a parallel drain for the
// [diag drain] logs, so one real failure that cancels its errgroup siblings
// reads as 1 primary + N collateral instead of N+1 independent failures:
//   - "primary": a real upstream failure (not a cancellation)
//   - "client_abort": canceled because the browser dropped the request
//   - "collateral": canceled because a sibling in the same errgroup failed
//
// parent is the request-scoped context from before the errgroup wrap.
func diagFailKind(parent context.Context, err error) string {
	switch {
	case err == nil:
		return ""
	case !errors.Is(err, context.Canceled):
		return "primary"
	case parent.Err() != nil:
		return "client_abort"
	default:
		return "collateral"
	}
}

// upstreamStatusOf extracts the upstream HTTP status when the error carries
// one. The UAA token-refresh path provides it directly via
// api.ErrHTTPRequest.Status; capi CF-call errors embed it as "(status NNN)" in
// the message (parsed best-effort). Returns 0 when no status is recoverable,
// in which case it is omitted from the response body.
func upstreamStatusOf(err error) int {
	if err == nil {
		return 0
	}
	var httpReq api.ErrHTTPRequest
	if errors.As(err, &httpReq) {
		return httpReq.Status
	}
	if m := capiStatusRe.FindStringSubmatch(err.Error()); m != nil {
		if n, convErr := strconv.Atoi(m[1]); convErr == nil {
			return n
		}
	}
	return 0
}

// cfErrorReason is an open-ended classification of why a native CF handler
// call failed. Only the values we deliberately surface to the frontend are
// named; any unrecognised failure classifies as reasonUnclassified and the
// frontend treats it as a generic endpoint error.
type cfErrorReason string

const (
	// reasonUnreachable: the CF API / UAA could not be reached or returned a
	// 5xx — the endpoint may be down. Reconnecting will not help.
	reasonUnreachable cfErrorReason = "unreachable"
	// reasonAuthExpired: the stored token was rejected (401 / invalid_grant) —
	// the user should reconnect to re-authenticate.
	reasonAuthExpired cfErrorReason = "auth_expired"
	// reasonUnclassified: anything else (normal CF errors like 404/422, or an
	// error we don't specifically call out). Not emitted in the header.
	reasonUnclassified cfErrorReason = ""
)

// classifyCfError inspects an error returned from a native CF handler path
// (UAA token refresh or a capi CF-API call) and returns the reason we surface
// to the frontend.
//
// Two error shapes are understood:
//   - api.ErrHTTPRequest, from the UAA token-refresh path, which carries the
//     upstream HTTP status directly (0 means no response — a transport
//     failure reaching UAA). Requires the refresh wrap chain to use %w.
//   - capi sentinel errors (capi.ErrServerError / capi.ErrUnauthorized),
//     produced by capi.MapHTTPError and wrapped with %w, from CF-API calls.
//
// Bare transport errors (net.Error, context deadline) with no HTTP response
// classify as unreachable. Everything else — normal CF errors like 404/422,
// or anything unrecognised — is unclassified.
func classifyCfError(err error) cfErrorReason {
	if err == nil {
		return reasonUnclassified
	}

	// UAA token-refresh path: the upstream status is authoritative.
	var httpReq api.ErrHTTPRequest
	if errors.As(err, &httpReq) {
		switch {
		case httpReq.Status == 0, httpReq.Status >= 500:
			// No response, or origin 5xx — the endpoint is unreachable.
			return reasonUnreachable
		case httpReq.Status == http.StatusUnauthorized, httpReq.Status == http.StatusBadRequest:
			// 401 / invalid_grant (400) — the stored token was rejected.
			return reasonAuthExpired
		default:
			return reasonUnclassified
		}
	}

	// gorouter route-flap: a 404 from the platform router, not from CAPI.
	// The API route was missing from the route table, so the endpoint was
	// effectively unreachable regardless of the 404 status.
	if isRouterRouteMissing(err) {
		return reasonUnreachable
	}

	// capi CF-API call path: sentinels mapped by capi.MapHTTPError.
	if errors.Is(err, capi.ErrServerError) {
		return reasonUnreachable
	}
	if errors.Is(err, capi.ErrUnauthorized) {
		return reasonAuthExpired
	}

	// Transport-level failure with no HTTP response (conn refused, timeout).
	var netErr net.Error
	if errors.As(err, &netErr) {
		return reasonUnreachable
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return reasonUnreachable
	}

	return reasonUnclassified
}
