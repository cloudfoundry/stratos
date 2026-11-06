package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/labstack/echo/v5"
)

// ANALYSIS_REPORTS_DIR is an absolute path (the chart sets /reports), so a
// report lives outside the working directory unless the process happens to
// have been started from an ancestor of it. Echo v5's Context.File resolves
// through a filesystem rooted at the working directory and 404s otherwise.
func TestServeFileServesAReportOutsideTheWorkingDirectory(t *testing.T) {
	reports := t.TempDir()
	file := filepath.Join(reports, "report.json")
	if err := os.WriteFile(file, []byte(`{"popeye":{"score":85}}`), 0600); err != nil {
		t.Fatalf("write: %v", err)
	}

	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := c.File(file); err == nil && rec.Code == http.StatusOK {
		t.Fatal("expected Context.File to fail for a report outside the working directory; if it now works, serveFile can go")
	}

	rec = httptest.NewRecorder()
	c = e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := serveFile(c, file); err != nil {
		t.Fatalf("serveFile: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if got := rec.Body.String(); got != `{"popeye":{"score":85}}` {
		t.Errorf("body = %q, want the report contents", got)
	}
}
