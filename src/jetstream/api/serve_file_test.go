package api

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/labstack/echo/v5"
)

// The Kubernetes chart sets HELM_CACHE_FOLDER=/helm-cache against
// WORKDIR /home/stratos, so the served file sits outside the working
// directory. Echo v5's Context.File resolves through a filesystem rooted at
// the working directory and answers 404 for exactly that shape.
func TestServeFileServesOutsideTheWorkingDirectory(t *testing.T) {
	outside := t.TempDir()
	file := filepath.Join(outside, "icon.png")
	if err := os.WriteFile(file, []byte("not-really-a-png"), 0600); err != nil {
		t.Fatalf("write: %v", err)
	}

	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)

	// What regressed: the same path through Context.File.
	if err := c.File(file); err == nil && rec.Code == http.StatusOK {
		t.Fatal("expected Context.File to fail for a path outside the working directory; if it now works, ServeFile can go")
	}

	rec = httptest.NewRecorder()
	c = e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := ServeFile(c, file); err != nil {
		t.Fatalf("ServeFile: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if got := rec.Body.String(); got != "not-really-a-png" {
		t.Errorf("body = %q, want the file contents", got)
	}
}

func TestServeFileServesARelativePath(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "values.yaml"), []byte("relative"), 0600); err != nil {
		t.Fatalf("write: %v", err)
	}
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir: %v", err)
	}
	t.Cleanup(func() { _ = os.Chdir(wd) })

	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := ServeFile(c, "values.yaml"); err != nil {
		t.Fatalf("ServeFile: %v", err)
	}
	if rec.Code != http.StatusOK || rec.Body.String() != "relative" {
		t.Errorf("status = %d body = %q, want 200 and the file contents", rec.Code, rec.Body.String())
	}
}

func TestServeFileRejectsAMissingFile(t *testing.T) {
	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
	if err := ServeFile(c, filepath.Join(t.TempDir(), "absent.json")); err == nil {
		t.Fatal("expected an error for a missing file")
	}
}
