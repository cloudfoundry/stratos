package main

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"
	"sync"
	"time"

	"github.com/labstack/echo/v5"
)

// cspReportPath is where the browser posts Content-Security-Policy violation
// reports. It is a path rather than an absolute URL on purpose: report-uri
// accepts a relative reference, and Jetstream does not reliably know its own
// browser-facing origin — it usually sits behind a router that terminates TLS,
// so any absolute URL would have to be reconstructed from forwarding headers
// the client controls.
//
// NOTE: report-uri is the CSP2 mechanism and is formally deprecated in favour
// of report-to plus a Reporting-Endpoints header. That pairing is not used
// here because Reporting-Endpoints requires an absolute HTTPS URL, which is
// exactly what we cannot derive. If a browser ever drops report-uri, this is
// the decision to revisit, and it needs an operator-supplied external URL.
const cspReportPath = "/pp/v1/csp-report"

// cspReportBodyLimit caps the request body this endpoint will read. The route
// is unauthenticated by necessity — the login page carries the policy too, so
// violations must be reportable before anyone signs in — which means anything
// able to reach Stratos can post to it. Real reports are well under a
// kilobyte; the limit exists so an oversized body cannot be used to make
// Jetstream do work.
const cspReportBodyLimit int64 = 16 * 1024

// cspReportLogBudget caps how many violation lines one minute may add to the
// log, so the same unauthenticated route cannot be used to fill an operator's
// log storage. Over budget, reports are counted rather than written, and the
// count is reported when the minute rolls over: a silent cap would read as
// "no more violations" when it means the opposite.
//
// Per-source limiting is deliberately not used. Behind a router every request
// arrives from the same address, so a per-IP bucket would either throttle the
// whole deployment as one client or do nothing at all.
//
// NOTE: one global budget. Isolating a single noisy client from the rest would
// need a per-source bucket keyed on something more trustworthy than remote IP.
const cspReportLogBudget = 60

// cspFieldLimit bounds each field written to the log. Report values describe
// page state and are supplied by the browser, so their length is not ours to
// assume.
const cspFieldLimit = 512

// cspNonceValue matches the nonce in a serialised policy. A violation report
// echoes the policy that blocked it in original-policy, which for Stratos
// carries that response's live nonce — the one value in the report that is a
// credential rather than a description. It is redacted before the report is
// forwarded anywhere, and never written to the log at all.
var cspNonceValue = regexp.MustCompile(`'nonce-[A-Za-z0-9+/=_-]+'`)

// cspViolationReport is the body of an application/csp-report POST. Only the
// fields Stratos reads are declared; a browser sending more is not an error.
type cspViolationReport struct {
	DocumentURI        string `json:"document-uri"`
	Referrer           string `json:"referrer"`
	ViolatedDirective  string `json:"violated-directive"`
	EffectiveDirective string `json:"effective-directive"`
	OriginalPolicy     string `json:"original-policy"`
	Disposition        string `json:"disposition"`
	BlockedURI         string `json:"blocked-uri"`
	LineNumber         int    `json:"line-number"`
	ColumnNumber       int    `json:"column-number"`
	SourceFile         string `json:"source-file"`
	StatusCode         int    `json:"status-code"`
	ScriptSample       string `json:"script-sample"`
}

// cspReportEnvelope is what the browser actually posts: the report under a
// single "csp-report" key.
type cspReportEnvelope struct {
	Report cspViolationReport `json:"csp-report"`
}

// reportLogBudget is the token bucket behind cspReportLogBudget.
type reportLogBudget struct {
	mu         sync.Mutex
	minute     int64
	logged     int
	suppressed int
}

// allow reports whether this violation should be written to the log. The
// second return is the number of reports suppressed during the previous
// minute, non-zero only on the first call after a rollover, so the caller can
// account for what it dropped.
func (b *reportLogBudget) allow(now time.Time) (bool, int) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if minute := now.Unix() / 60; minute != b.minute {
		dropped := b.suppressed
		b.minute, b.logged, b.suppressed = minute, 1, 0
		return true, dropped
	}

	if b.logged < cspReportLogBudget {
		b.logged++
		return true, 0
	}

	b.suppressed++
	return false, 0
}

// cspLogBudget is process-wide. One Jetstream serves one console, and the
// budget is about total log volume rather than about any individual caller.
var cspLogBudget = &reportLogBudget{}

// truncateField bounds a browser-supplied string for logging. Control
// characters are left to the formatter: logrus quotes any value that needs it,
// which escapes a newline rather than letting it open a second log line.
func truncateField(s string) string {
	if len(s) <= cspFieldLimit {
		return s
	}
	return s[:cspFieldLimit] + "…"
}

// receiveCSPReport records a violation the browser refused to load, and
// forwards an enriched copy to the operator's collector when one is
// configured. The response carries no body: nothing the browser does depends
// on it, and a report that cannot be parsed is still not the reporter's fault
// to act on.
func (p *portalProxy) receiveCSPReport(c *echo.Context) error {
	var envelope cspReportEnvelope
	if err := json.NewDecoder(c.Request().Body).Decode(&envelope); err != nil {
		// Logged at debug: a malformed body is either a browser Stratos does
		// not know or someone probing the route, and neither is worth a line
		// an operator has to read.
		slog.Debug("Discarded an unparseable CSP violation report", "error", err)
		return c.NoContent(http.StatusBadRequest)
	}

	report := envelope.Report

	if logIt, dropped := cspLogBudget.allow(time.Now()); logIt {
		if dropped > 0 {
			slog.Warn("SECURITY: further Content-Security-Policy violations were not logged in the previous minute",
				"security_event", "csp-violation", "dropped", dropped)
		}

		// original-policy is deliberately absent: it is the longest field in
		// the report, it is identical on every violation, and it carries the
		// live nonce. An operator reading this line already knows the policy.
		//
		// script_sample is present and is the exception to that caution. It is
		// the refused content itself rather than a description of it, so on an
		// injection it is the attacker's own text — and that is precisely why
		// it is worth having: blocked_uri reads "inline" for every one of them.
		// The policy asks for it via 'report-sample'; the browser sends the
		// first 40 characters, truncateField bounds it in case one does not,
		// and the handler quotes what it contains.
		slog.Warn("SECURITY: Content-Security-Policy violation reported by browser",
			"security_event", "csp-violation",
			"document_uri", truncateField(report.DocumentURI),
			"violated_directive", truncateField(report.ViolatedDirective),
			"blocked_uri", truncateField(report.BlockedURI),
			"source_file", truncateField(report.SourceFile),
			"line_number", report.LineNumber,
			"disposition", truncateField(report.Disposition),
			"script_sample", truncateField(report.ScriptSample))
	}

	if collector := p.GetConfig().CSPReportCollector; collector != "" {
		// Everything the forward needs is read here, on the request
		// goroutine: an *echo.Context must not outlive its handler.
		authenticated := false
		if _, err := p.GetSession(c); err == nil {
			authenticated = true
		}
		enriched := p.enrichCSPReport(report, c.RealIP(),
			c.Request().Header.Get("X-Forwarded-For"),
			c.Request().UserAgent(), authenticated)

		go forwardCSPReport(collector, enriched)
	}

	return c.NoContent(http.StatusNoContent)
}

// enrichCSPReport builds the duplicate sent to an operator's collector: the
// whole report as the browser sent it, minus the nonce, plus the context only
// the server has. A collector is a security feed rather than a debugging aid,
// so it gets more than the log line does.
//
// The session is reported as a boolean rather than an identity. Whether a
// violation happened on an authenticated page is worth knowing; who it
// happened to is a name in a security feed, which is a liability of its own.
func (p *portalProxy) enrichCSPReport(report cspViolationReport, remoteIP, forwardedFor, userAgent string, authenticated bool) map[string]any {
	report.OriginalPolicy = cspNonceValue.ReplaceAllString(report.OriginalPolicy, "'nonce-REDACTED'")

	policySource := "operator"
	if p.GetConfig().CSPPolicy == policyWithReporting(defaultCSPPolicy) {
		policySource = "built-in"
	}

	return map[string]any{
		"csp-report": report,
		"stratos": map[string]any{
			"version":       appVersion,
			"git_commit":    gitCommit,
			"received_at":   time.Now().UTC().Format(time.RFC3339),
			"policy_source": policySource,
			"remote_ip":     remoteIP,
			"forwarded_for": forwardedFor,
			"user_agent":    userAgent,
			"authenticated": authenticated,
		},
	}
}

// cspForwardTimeout bounds a single forward attempt. Reports are telemetry
// about something that has already happened, so a collector that is slow is
// treated the same as one that is down.
const cspForwardTimeout = 5 * time.Second

// forwardCSPReport posts one enriched report to the operator's collector.
//
// Fire and forget: there is no retry and no queue, because a collector being
// unreachable must not be able to slow the report endpoint or hold Jetstream's
// memory. A forward that fails is logged and dropped.
//
// NOTE: reports do not survive a collector outage. Making them durable needs a
// store and a drain, not a longer timeout or more attempts.
func forwardCSPReport(collector string, enriched map[string]any) {
	body, err := json.Marshal(enriched)
	if err != nil {
		slog.Error("could not encode a CSP violation report", "collector", collector, "error", err)
		return
	}

	client := &http.Client{Timeout: cspForwardTimeout}
	req, err := http.NewRequest(http.MethodPost, collector, bytes.NewReader(body))
	if err != nil {
		slog.Error("could not build the CSP violation report request", "collector", collector, "error", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		slog.Error("could not deliver a CSP violation report", "collector", collector, "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		slog.Error("collector rejected a CSP violation report", "collector", collector, "status", resp.StatusCode)
	}
}
