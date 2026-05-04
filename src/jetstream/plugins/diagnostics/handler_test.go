package diagnostics

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestHandler_GetDiagnostics_ReturnsVersionedEnvelope(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET"})
	h := NewHandler(b, true)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/admin/diagnostics", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetDiagnostics(c)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var env SnapshotEnvelope
	assert.NoError(t, json.Unmarshal(rec.Body.Bytes(), &env))
	assert.Equal(t, 1, env.Version)
	assert.NotEmpty(t, env.Counters["cf-api-call-count"])
}

func TestHandler_GetDiagnostics_404WhenDisabled(t *testing.T) {
	// 404 (not 403) to avoid leaking feature-availability info in prod.
	b := NewBuffer(DefaultBufferConfig())
	h := NewHandler(b, false)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/admin/diagnostics", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetDiagnostics(c)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestHandler_ResetDiagnostics_204WhenEnabled(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET"})
	h := NewHandler(b, true)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/admin/diagnostics/reset", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.ResetDiagnostics(c)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusNoContent, rec.Code)

	snap := b.Snapshot()
	assert.Empty(t, snap.Counters)
}

func TestHandler_ResetDiagnostics_404WhenDisabled(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	h := NewHandler(b, false)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/admin/diagnostics/reset", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.ResetDiagnostics(c)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}
