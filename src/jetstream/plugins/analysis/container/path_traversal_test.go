package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
)

// Every report path in this package is built from route parameters. CodeQL
// reports each filesystem sink they reach as a path-injection risk and cannot
// model the validators that stop them, so those alerts are dismissed by hand.
// These tests are the evidence behind that dismissal: they drive a traversing
// value through each handler and assert it is refused before anything on disk
// is touched. If a future change removes a guard, these go red rather than the
// dismissal quietly becoming false.

// traversals covers the shapes a caller can put in a single path parameter.
// A literal "/" cannot appear (the router splits on it and the route stops
// matching), so the interesting cases are the dot segments and separators
// that survive as one parameter value.
var traversals = []string{"..", ".", "../..", "../../etc", "a/../../b", `..\..`, ""}

// newCtx builds a context with the given path parameters, as the router would.
func newCtx(t *testing.T, target string, params map[string]string) (*echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodGet, target, nil), rec)
	vals := make(echo.PathValues, 0, len(params))
	for k, v := range params {
		vals = append(vals, echo.PathValue{Name: k, Value: v})
	}
	c.SetPathValues(vals)
	return c, rec
}

// analyzerWithReports gives the Analyzer a real reports dir holding one file,
// plus a canary outside it that no handler may ever touch.
func analyzerWithReports(t *testing.T) (*Analyzer, string) {
	t.Helper()
	root := t.TempDir()
	reports := filepath.Join(root, "reports")
	if err := os.MkdirAll(filepath.Join(reports, "user", "endpoint", "id"), 0o755); err != nil {
		t.Fatal(err)
	}
	canary := filepath.Join(root, "canary.json")
	if err := os.WriteFile(canary, []byte(`{"secret":true}`), 0o600); err != nil {
		t.Fatal(err)
	}
	return &Analyzer{reportsDir: reports, jobs: map[string]*AnalysisJob{}}, canary
}

func TestReportRejectsTraversalInEverySegment(t *testing.T) {
	for _, bad := range traversals {
		for _, field := range []string{"user", "endpoint", "id", "file"} {
			a, canary := analyzerWithReports(t)
			params := map[string]string{"user": "user", "endpoint": "endpoint", "id": "id", "file": "report.json"}
			params[field] = bad
			if field == "file" {
				// The handler requires a ".json" suffix, and appending it to a
				// bare dot segment produces an ordinary filename ("...json"),
				// which is not a traversal and is rightly a 404. Use values
				// that are still traversals with the suffix attached.
				params[field] = fileTraversal(bad)
			}
			c, _ := newCtx(t, "/report", params)

			if err := a.report(c); !rejectedWith400(err) {
				t.Errorf("report(%s=%q) = %v, want a 400 refusal", field, bad, err)
			}
			if _, err := os.Stat(canary); err != nil {
				t.Fatalf("canary disturbed by %s=%q: %v", field, bad, err)
			}
		}
	}
}

// rejectedWith400 reports whether err is the handler's own refusal rather than
// some later incidental failure. This matters: a traversing path that does not
// exist also produces an error, and Context.File resolves through Echo's fs.FS
// (rooted at the working directory), so an absolute temp path is never served
// in a unit harness either. Asserting "some error" would therefore pass even
// with every guard removed — only the 400 proves the guard ran.
// fileTraversal turns a traversal fragment into one that survives the handler's
// ".json" suffix requirement, so the suffix check cannot be what refuses it.
func fileTraversal(bad string) string {
	if bad == "" {
		return "/.json" // a separator, still refused by validateSegment
	}
	return bad + "/a.json"
}

func rejectedWith400(err error) bool {
	var he *echo.HTTPError
	if !errors.As(err, &he) {
		return false
	}
	return he.Code == http.StatusBadRequest
}

func TestDeleteRejectsTraversalInEverySegment(t *testing.T) {
	for _, bad := range traversals {
		for _, field := range []string{"user", "endpoint", "id"} {
			a, canary := analyzerWithReports(t)
			params := map[string]string{"user": "user", "endpoint": "endpoint", "id": "id"}
			params[field] = bad
			c, _ := newCtx(t, "/delete", params)

			if err := a.delete(c); !rejectedWith400(err) {
				t.Errorf("delete(%s=%q) = %v, want a 400 refusal", field, bad, err)
			}
			if _, err := os.Stat(canary); err != nil {
				t.Fatalf("canary removed by %s=%q: %v", field, bad, err)
			}
		}
	}
}

func TestDeleteEndpointRejectsTraversal(t *testing.T) {
	for _, bad := range traversals {
		a, canary := analyzerWithReports(t)
		c, _ := newCtx(t, "/delete-endpoint", map[string]string{"endpoint": bad})

		if err := a.deleteEndpoint(c); !rejectedWith400(err) {
			t.Errorf("deleteEndpoint(%q) = %v, want a 400 refusal", bad, err)
		}
		if _, err := os.Stat(canary); err != nil {
			t.Fatalf("canary removed by endpoint=%q: %v", bad, err)
		}
	}
}

// The job folder is the other half: kubescore and popeye write reports and
// remove directories under job.Folder, which only jobFolder may produce.
func TestJobFolderRejectsEscapingIDs(t *testing.T) {
	base := "/var/lib/stratos/reports"
	// The property is containment, not refusal. filepath.IsLocal treats "\\" as
	// an ordinary character on Linux, so `..\..` is one odd filename rather than
	// a traversal — accepting it is correct as long as the result stays put.
	for _, bad := range []string{"..", "../..", "../../etc", "/abs", "user/../../../etc", `..\..`, ""} {
		got, err := jobFolder(base, bad)
		if err != nil {
			continue // refused outright, which is also fine
		}
		if !strings.HasPrefix(got, base+"/") {
			t.Errorf("jobFolder(%q) escaped base: %q", bad, got)
		}
		if got != filepath.Clean(got) {
			t.Errorf("jobFolder(%q) returned an uncleaned path: %q", bad, got)
		}
	}
	// and a legitimate nested id still works
	got, err := jobFolder(base, "user/endpoint/id")
	if err != nil {
		t.Fatalf("jobFolder rejected a valid nested id: %v", err)
	}
	if want := base + "/user/endpoint/id"; got != want {
		t.Errorf("jobFolder = %q, want %q", got, want)
	}
}

func TestReportPathConfinesEverySegment(t *testing.T) {
	base := "/var/lib/stratos/reports"
	for _, bad := range traversals {
		for _, segs := range [][]string{{bad}, {"user", bad, "id"}} {
			got, err := reportPath(base, segs...)
			if err != nil {
				continue // refused outright
			}
			if !strings.HasPrefix(got, base+"/") {
				t.Errorf("reportPath(%q) escaped base: %q", bad, got)
			}
		}
	}
	got, err := reportPath(base, "user", "endpoint", "id", "report.json")
	if err != nil {
		t.Fatalf("reportPath rejected legitimate segments: %v", err)
	}
	if want := base + "/user/endpoint/id/report.json"; got != want {
		t.Errorf("reportPath = %q, want %q", got, want)
	}
	if !strings.HasPrefix(got, base+"/") {
		t.Errorf("reportPath escaped base: %q", got)
	}
}
