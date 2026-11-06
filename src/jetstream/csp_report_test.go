package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

const reportBody = `{"csp-report":{
	"document-uri":"https://stratos.example.com/applications/9f2c/log-stream",
	"violated-directive":"style-src-elem",
	"effective-directive":"style-src-elem",
	"original-policy":"style-src-elem 'self' 'nonce-KRUGS4ZANFZSAYJAORSXG5A'",
	"disposition":"enforce",
	"blocked-uri":"inline",
	"line-number":1,
	"source-file":"https://stratos.example.com/main-7F3A9C2E.js"
}}`

func postReport(t *testing.T, p *portalProxy, body string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, cspReportPath, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, "application/csp-report")
	return rec, p.receiveCSPReport(echo.New().NewContext(req, rec))
}

// logEntry is one captured slog record, flattened to what these tests assert
// on: the level, the message, the attributes by key, and the line a real
// handler produced for it.
type logEntry struct {
	Level    slog.Level
	Message  string
	Data     map[string]any
	rendered string
}

// String returns the line as a handler actually wrote it. The forged-line
// tests turn on the handler's quoting, so rendering them any other way would
// test the helper instead of the code.
func (e *logEntry) String() (string, error) { return e.rendered, nil }

// logCapture collects records off a slog handler installed for one test.
type logCapture struct{ entries []*logEntry }

func (c *logCapture) Enabled(context.Context, slog.Level) bool { return true }

func (c *logCapture) Handle(ctx context.Context, record slog.Record) error {
	entry := &logEntry{Level: record.Level, Message: record.Message, Data: map[string]any{}}
	record.Attrs(func(attr slog.Attr) bool {
		entry.Data[attr.Key] = attr.Value.Any()
		return true
	})

	// Render through the real handler so the escaping under test is the
	// escaping production performs.
	var line bytes.Buffer
	if err := slog.NewTextHandler(&line, nil).Handle(ctx, record); err != nil {
		return err
	}
	entry.rendered = strings.TrimRight(line.String(), "\n")

	c.entries = append(c.entries, entry)
	return nil
}

func (c *logCapture) WithAttrs([]slog.Attr) slog.Handler { return c }
func (c *logCapture) WithGroup(string) slog.Handler      { return c }

func (c *logCapture) LastEntry() *logEntry {
	if len(c.entries) == 0 {
		return nil
	}
	return c.entries[len(c.entries)-1]
}

// captureLogs redirects slog for one test and restores it afterwards, so a
// failure here cannot silence logging for the rest of the package.
func captureLogs(t *testing.T) *logCapture {
	t.Helper()
	capture := &logCapture{}
	previous := slog.Default()
	slog.SetDefault(slog.New(capture))
	t.Cleanup(func() { slog.SetDefault(previous) })
	return capture
}

func TestReceiveCSPReportLogsTheViolation(t *testing.T) {
	hook := captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	rec, err := postReport(t, &portalProxy{}, reportBody)
	if err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}
	if rec.Code != http.StatusNoContent {
		t.Errorf("a well-formed report should be accepted with 204, got %d", rec.Code)
	}

	entry := hook.LastEntry()
	if entry == nil {
		t.Fatal("a violation must produce a log entry")
	}
	if entry.Level != slog.LevelWarn {
		t.Errorf("violations are logged at WARN, got %v", entry.Level)
	}
	if !strings.HasPrefix(entry.Message, "SECURITY:") {
		t.Errorf("the message must be greppable as a security event, got %q", entry.Message)
	}
	if entry.Data["security_event"] != "csp-violation" {
		t.Errorf("a JSON log pipeline filters on security_event, got %v", entry.Data["security_event"])
	}
	if entry.Data["violated_directive"] != "style-src-elem" {
		t.Errorf("violated_directive missing: %v", entry.Data)
	}
	if entry.Data["blocked_uri"] != "inline" {
		t.Errorf("blocked_uri missing: %v", entry.Data)
	}
}

// The nonce is a live credential. It reaches the log only through
// original-policy, so that field is never logged at all.
func TestReceiveCSPReportNeverLogsTheNonce(t *testing.T) {
	hook := captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	if _, err := postReport(t, &portalProxy{}, reportBody); err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}

	entry := hook.LastEntry()
	rendered, err := entry.String()
	if err != nil {
		t.Fatalf("rendering the entry: %v", err)
	}
	if strings.Contains(rendered, "KRUGS4ZANFZSAYJAORSXG5A") {
		t.Errorf("the nonce must not reach the log: %q", rendered)
	}
	if _, present := entry.Data["original_policy"]; present {
		t.Error("original-policy must not be logged: it carries the nonce")
	}
}

// The sample is the only field that says which inline script or style was
// refused: blocked-uri reads "inline" for all of them, and source-file names
// the bundle that inserted it rather than the content. Parsing it and then not
// logging it leaves the operator exactly where they were.
func TestReceiveCSPReportLogsTheSample(t *testing.T) {
	hook := captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	sampled := `{"csp-report":{"blocked-uri":"inline","violated-directive":"script-src-elem","script-sample":"console.log('hi')"}}`
	if _, err := postReport(t, &portalProxy{}, sampled); err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}

	if got := hook.LastEntry().Data["script_sample"]; got != "console.log('hi')" {
		t.Errorf("the sample must reach the log: %v", hook.LastEntry().Data)
	}
}

// Every other field describes page state. The sample is the refused content
// itself, so on an injection it is the attacker's own text arriving verbatim —
// the field most worth proving cannot forge a line or run away with the log,
// whatever the spec says about a browser capping it at forty characters.
func TestReceiveCSPReportContainsAHostileSample(t *testing.T) {
	hook := captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	hostile := `{"csp-report":{"blocked-uri":"inline","script-sample":"x\ntime=\"now\" level=warning msg=\"forged\"` +
		strings.Repeat("A", 2*cspFieldLimit) + `"}}`
	if _, err := postReport(t, &portalProxy{}, hostile); err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}

	entry := hook.LastEntry()
	rendered, err := entry.String()
	if err != nil {
		t.Fatalf("rendering the entry: %v", err)
	}
	if strings.Count(strings.TrimRight(rendered, "\n"), "\n") != 0 {
		t.Errorf("the sample opened a second log line: %q", rendered)
	}
	sample, _ := entry.Data["script_sample"].(string)
	if len([]rune(sample)) > cspFieldLimit+1 {
		t.Errorf("the sample must be bounded like every other field, got %d chars", len([]rune(sample)))
	}
}

// Report fields are supplied by the browser from page state an attacker may
// influence. A newline in one of them must not be able to open a second log
// line and forge an entry.
func TestReceiveCSPReportDoesNotLetAFieldForgeALogLine(t *testing.T) {
	hook := captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	forged := `{"csp-report":{"document-uri":"https://x/\ntime=\"now\" level=warning msg=\"forged\"","blocked-uri":"inline"}}`
	if _, err := postReport(t, &portalProxy{}, forged); err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}

	rendered, err := hook.LastEntry().String()
	if err != nil {
		t.Fatalf("rendering the entry: %v", err)
	}
	if strings.Count(strings.TrimRight(rendered, "\n"), "\n") != 0 {
		t.Errorf("a report field opened a second log line: %q", rendered)
	}
	if !strings.Contains(rendered, `\n`) {
		t.Errorf("the newline should survive as an escape rather than a break: %q", rendered)
	}
}

func TestReceiveCSPReportRejectsAnUnparseableBody(t *testing.T) {
	captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	rec, err := postReport(t, &portalProxy{}, `{"csp-report": not json`)
	if err != nil {
		t.Fatalf("receiveCSPReport: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("an unparseable report should be rejected with 400, got %d", rec.Code)
	}
}

func TestReportLogBudgetCapsOneMinuteAndReportsWhatItDropped(t *testing.T) {
	budget := &reportLogBudget{}
	now := time.Unix(1_800_000_000, 0)

	for i := 0; i < cspReportLogBudget; i++ {
		if allowed, _ := budget.allow(now); !allowed {
			t.Fatalf("report %d is within the budget and should be logged", i+1)
		}
	}

	over := 5
	for i := 0; i < over; i++ {
		if allowed, _ := budget.allow(now); allowed {
			t.Fatalf("report %d is over the budget and should be suppressed", cspReportLogBudget+i+1)
		}
	}

	allowed, dropped := budget.allow(now.Add(time.Minute))
	if !allowed {
		t.Error("the first report of a new minute should be logged")
	}
	if dropped != over {
		t.Errorf("the rollover must account for the %d suppressed reports, got %d", over, dropped)
	}

	if _, dropped := budget.allow(now.Add(time.Minute)); dropped != 0 {
		t.Errorf("the dropped count is reported once, not on every later call, got %d", dropped)
	}
}

func TestEnrichCSPReportRedactsTheNonceButKeepsThePolicy(t *testing.T) {
	p := &portalProxy{}
	report := cspViolationReport{
		OriginalPolicy: "default-src 'self'; style-src-elem 'self' 'nonce-KRUGS4ZANFZSAYJAORSXG5A' https://fonts.googleapis.com",
	}

	enriched := p.enrichCSPReport(report, "10.0.0.1", "203.0.113.9", "Chrome", true)

	encoded, err := json.Marshal(enriched)
	if err != nil {
		t.Fatalf("marshalling: %v", err)
	}
	body := string(encoded)

	if strings.Contains(body, "KRUGS4ZANFZSAYJAORSXG5A") {
		t.Errorf("the nonce must be redacted before the report leaves Stratos: %s", body)
	}
	if !strings.Contains(body, "'nonce-REDACTED'") {
		t.Errorf("the redaction should be visible rather than the token vanishing: %s", body)
	}
	// Redaction must not cost the collector the rest of the policy.
	if !strings.Contains(body, "https://fonts.googleapis.com") || !strings.Contains(body, "default-src 'self'") {
		t.Errorf("only the nonce is redacted, not the policy around it: %s", body)
	}
}

// A security feed records that a violation happened on an authenticated page,
// not who it happened to.
func TestEnrichCSPReportCarriesServerContextWithoutIdentity(t *testing.T) {
	p := &portalProxy{}
	enriched := p.enrichCSPReport(cspViolationReport{}, "10.0.0.1", "203.0.113.9", "Chrome/141", true)

	stratos, ok := enriched["stratos"].(map[string]any)
	if !ok {
		t.Fatalf("the forwarded report must carry a stratos block: %v", enriched)
	}
	for _, key := range []string{"version", "git_commit", "received_at", "policy_source", "remote_ip", "forwarded_for", "user_agent", "authenticated"} {
		if _, present := stratos[key]; !present {
			t.Errorf("the stratos block is missing %q: %v", key, stratos)
		}
	}
	if stratos["authenticated"] != true {
		t.Errorf("authenticated should be a boolean fact, got %v", stratos["authenticated"])
	}
}

func TestEnrichCSPReportNamesWhoWroteThePolicy(t *testing.T) {
	builtIn := &portalProxy{}
	builtIn.Config.CSPPolicy = policyWithReporting(defaultCSPPolicy)
	enriched := builtIn.enrichCSPReport(cspViolationReport{}, "", "", "", false)
	if got := enriched["stratos"].(map[string]any)["policy_source"]; got != "built-in" {
		t.Errorf("the shipped policy should report as built-in, got %v", got)
	}

	custom := &portalProxy{}
	custom.Config.CSPPolicy = "default-src 'none'"
	enriched = custom.enrichCSPReport(cspViolationReport{}, "", "", "", false)
	if got := enriched["stratos"].(map[string]any)["policy_source"]; got != "operator" {
		t.Errorf("an operator policy should report as operator, got %v", got)
	}
}

func TestTruncateFieldBoundsBrowserSuppliedText(t *testing.T) {
	if got := truncateField("short"); got != "short" {
		t.Errorf("a short field passes through unchanged, got %q", got)
	}
	long := strings.Repeat("a", cspFieldLimit+100)
	got := truncateField(long)
	if len([]rune(got)) != cspFieldLimit+1 {
		t.Errorf("a long field should be cut to the limit plus an ellipsis, got %d runes", len([]rune(got)))
	}
	if !strings.HasSuffix(got, "…") {
		t.Errorf("truncation should be visible, got %q", got)
	}
}

// The route is unauthenticated, so the body limit is the control that stops an
// oversized post making Jetstream do work. An unparseable limit string would
// panic Echo at startup, which this also catches.
func TestCSPReportBodyLimitRejectsAnOversizedReport(t *testing.T) {
	captureLogs(t)
	cspLogBudget = &reportLogBudget{}

	e := echo.New()
	e.POST(cspReportPath, (&portalProxy{}).receiveCSPReport, middleware.BodyLimit(cspReportBodyLimit))

	oversized := `{"csp-report":{"document-uri":"` + strings.Repeat("a", 32*1024) + `"}}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, cspReportPath, strings.NewReader(oversized))
	req.Header.Set(echo.HeaderContentType, "application/csp-report")
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("an oversized report should be refused with 413, got %d", rec.Code)
	}

	// A report inside the limit still goes through the same middleware.
	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, cspReportPath, strings.NewReader(reportBody))
	req.Header.Set(echo.HeaderContentType, "application/csp-report")
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("a normal report must not be caught by the limit, got %d", rec.Code)
	}
}

func TestForwardCSPReportPostsJSONToTheCollector(t *testing.T) {
	captureLogs(t)

	received := make(chan []byte, 1)
	contentType := make(chan string, 1)
	collector := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		received <- body
		contentType <- r.Header.Get("Content-Type")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer collector.Close()

	p := &portalProxy{}
	forwardCSPReport(collector.URL, p.enrichCSPReport(
		cspViolationReport{ViolatedDirective: "script-src", OriginalPolicy: "script-src 'nonce-SECRETVALUE'"},
		"10.0.0.1", "", "Chrome", false))

	select {
	case body := <-received:
		if ct := <-contentType; ct != "application/json" {
			t.Errorf("the collector should receive JSON, got Content-Type %q", ct)
		}
		if !strings.Contains(string(body), `"violated-directive":"script-src"`) {
			t.Errorf("the browser's report must survive forwarding: %s", body)
		}
		if strings.Contains(string(body), "SECRETVALUE") {
			t.Errorf("the nonce must not leave Stratos: %s", body)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("the report was never delivered to the collector")
	}
}

// A collector that is unreachable costs a forwarded report and nothing else.
func TestForwardCSPReportSurvivesAnUnreachableCollector(t *testing.T) {
	hook := captureLogs(t)

	collector := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	url := collector.URL
	collector.Close()

	forwardCSPReport(url, map[string]any{"csp-report": cspViolationReport{}})

	entry := hook.LastEntry()
	if entry == nil || entry.Level != slog.LevelError {
		t.Fatalf("a failed forward should be logged as an error, got %v", entry)
	}
}
