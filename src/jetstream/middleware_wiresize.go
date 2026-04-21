package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// wireSizeMaxBufferBytes caps how much response body the wire-size middleware
// will buffer. Responses larger than this pass through unmeasured to avoid
// pathological memory use on e.g. bulk export endpoints.
const wireSizeMaxBufferBytes = 10 * 1024 * 1024

// WireSizeMetrics is the byte breakdown of a JSON response body. Keys, values,
// and structural should sum to raw total for well-formed JSON.
type WireSizeMetrics struct {
	RawTotal   int
	Keys       int
	Values     int
	Structural int
	Resources  int
}

// wireSizeMiddleware emits an X-Stratos-Wire-Sizes diagnostic header on JSON
// responses when DIAGNOSTICS_ENABLED is set. The header breaks the body into
// key / value / structural bytes so post-deploy measurement can tell whether
// wire-transfer cost is dominated by repeated key names (cheap to remove via
// format tricks) or by payload values (cheap to remove via tier narrowing).
// Non-JSON responses pass through unmeasured. WebSocket upgrade requests are
// skipped entirely — hijacking a buffered writer breaks the upgrade.
func (p *portalProxy) wireSizeMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !p.GetConfig().DiagnosticsEnabled {
			return next(c)
		}
		if c.Request().Header.Get("Upgrade") == "websocket" {
			return next(c)
		}

		origWriter := c.Response().Writer
		bw := &bufferingResponseWriter{
			ResponseWriter: origWriter,
			buf:            &bytes.Buffer{},
			limit:          wireSizeMaxBufferBytes,
		}
		c.Response().Writer = bw
		defer func() { c.Response().Writer = origWriter }()

		if err := next(c); err != nil {
			return err
		}

		if bw.overflowed {
			return nil
		}

		ct := c.Response().Header().Get(echo.HeaderContentType)
		if strings.Contains(ct, "application/json") {
			m := countJSONBytes(bw.buf.Bytes())
			c.Response().Header().Set("X-Stratos-Wire-Sizes", fmt.Sprintf(
				"raw_total=%d; keys=%d; values=%d; structural=%d; resources=%d",
				m.RawTotal, m.Keys, m.Values, m.Structural, m.Resources,
			))
		}

		bw.flushStatus()
		_, err := origWriter.Write(bw.buf.Bytes())
		return err
	}
}

// bufferingResponseWriter captures response bytes into an in-memory buffer
// so the wire-size middleware can measure the response and set an additional
// header before the underlying writer sees the status line. Overrides both
// Write() and WriteHeader(): WriteHeader records the code without forwarding,
// so later Header().Set() calls still have effect; Write() buffers bytes.
// If the buffer would exceed its limit the writer flushes status + buffer to
// the underlying writer and switches to pass-through mode for the remainder.
type bufferingResponseWriter struct {
	http.ResponseWriter
	buf            *bytes.Buffer
	limit          int
	overflowed     bool
	statusCode     int
	statusCaptured bool
	statusFlushed  bool
}

func (w *bufferingResponseWriter) WriteHeader(code int) {
	if w.statusCaptured {
		return
	}
	w.statusCode = code
	w.statusCaptured = true
}

// flushStatus writes the captured status line to the underlying writer if
// it hasn't been flushed yet. Idempotent.
func (w *bufferingResponseWriter) flushStatus() {
	if w.statusFlushed {
		return
	}
	status := w.statusCode
	if status == 0 {
		status = http.StatusOK
	}
	w.ResponseWriter.WriteHeader(status)
	w.statusFlushed = true
}

func (w *bufferingResponseWriter) Write(p []byte) (int, error) {
	if w.overflowed {
		w.flushStatus()
		return w.ResponseWriter.Write(p)
	}
	if w.buf.Len()+len(p) > w.limit {
		w.flushStatus()
		if w.buf.Len() > 0 {
			if _, err := w.ResponseWriter.Write(w.buf.Bytes()); err != nil {
				return 0, err
			}
			w.buf.Reset()
		}
		w.overflowed = true
		return w.ResponseWriter.Write(p)
	}
	return w.buf.Write(p)
}

// countJSONBytes walks the given JSON body and splits raw byte count into
// keys (object key names including surrounding quotes), structural (braces,
// brackets, colons, commas, whitespace outside strings), and values
// (everything else — string value contents with quotes, numbers, booleans,
// nulls, including bytes inside arrays). Resources counts the length of the
// top-level "resources" array if present.
//
// Approach:
//   - Scan character-by-character once to count structural bytes (symbols +
//     whitespace outside strings) and detect the top-level resources length.
//   - Unmarshal once to walk object keys and sum their byte count.
//   - Values = raw - keys - structural (arithmetic closure; handles numbers,
//     booleans, nulls, string values without a separate per-type scan).
//
// Returns partial metrics when the body isn't valid JSON — RawTotal always
// reflects the actual length; Keys/Values fields may be zero.
func countJSONBytes(body []byte) WireSizeMetrics {
	m := WireSizeMetrics{RawTotal: len(body)}
	m.Structural = scanStructuralBytes(body)

	var root interface{}
	if err := json.Unmarshal(body, &root); err != nil {
		return m
	}

	m.Keys = countObjectKeyBytes(root)

	if obj, ok := root.(map[string]interface{}); ok {
		if resources, ok := obj["resources"].([]interface{}); ok {
			m.Resources = len(resources)
		}
	}

	m.Values = m.RawTotal - m.Keys - m.Structural
	if m.Values < 0 {
		m.Values = 0
	}
	return m
}

// scanStructuralBytes counts JSON structural characters ({, }, [, ], :, ,)
// plus whitespace outside of string contexts. Handles escape sequences inside
// strings correctly so that e.g. `\"` inside a string value isn't mis-parsed
// as a string terminator.
func scanStructuralBytes(body []byte) int {
	count := 0
	inString := false
	escape := false
	for _, c := range body {
		if inString {
			if escape {
				escape = false
				continue
			}
			if c == '\\' {
				escape = true
				continue
			}
			if c == '"' {
				inString = false
			}
			continue
		}
		switch c {
		case '"':
			inString = true
		case '{', '}', '[', ']', ',', ':', ' ', '\t', '\n', '\r':
			count++
		}
	}
	return count
}

// countObjectKeyBytes recursively walks an unmarshaled JSON tree and returns
// the total byte cost of every object key's name plus its surrounding quotes.
// The colon separator is counted as structural elsewhere, not here.
func countObjectKeyBytes(v interface{}) int {
	switch x := v.(type) {
	case map[string]interface{}:
		total := 0
		for k, child := range x {
			total += len(k) + 2
			total += countObjectKeyBytes(child)
		}
		return total
	case []interface{}:
		total := 0
		for _, item := range x {
			total += countObjectKeyBytes(item)
		}
		return total
	default:
		return 0
	}
}
