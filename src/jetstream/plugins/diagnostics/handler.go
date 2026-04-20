package diagnostics

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// Handler serves the admin-gated diagnostics endpoint. Enabled is captured at
// plugin init; a disabled handler returns 404 (not 403) so the endpoint's
// existence isn't leaked to unauthenticated scanners in production.
type Handler struct {
	buffer  *Buffer
	enabled bool
}

func NewHandler(buffer *Buffer, enabled bool) *Handler {
	return &Handler{buffer: buffer, enabled: enabled}
}

func (h *Handler) GetDiagnostics(c echo.Context) error {
	if !h.enabled {
		return c.NoContent(http.StatusNotFound)
	}
	return c.JSON(http.StatusOK, h.buffer.Snapshot())
}

func (h *Handler) ResetDiagnostics(c echo.Context) error {
	if !h.enabled {
		return c.NoContent(http.StatusNotFound)
	}
	h.buffer.Reset()
	return c.NoContent(http.StatusNoContent)
}
