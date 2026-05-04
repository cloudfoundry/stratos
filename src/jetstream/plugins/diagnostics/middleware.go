package diagnostics

import (
	"net/http"
	"regexp"
	"strconv"
	"time"
)

// GUIDs are 36-char UUID-style or equivalent hex — collapse to `:guid` so
// aggregated counters/timings don't fragment one API endpoint into thousands
// of per-GUID buckets.
var guidPathRe = regexp.MustCompile(`/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)

func normalizePath(p string) string {
	return guidPathRe.ReplaceAllString(p, "/:guid")
}

type instrumentedTransport struct {
	rt     http.RoundTripper
	buffer *Buffer
}

func (t *instrumentedTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	start := time.Now()
	resp, err := t.rt.RoundTrip(req)
	durMs := float64(time.Since(start).Microseconds()) / 1000.0

	dims := map[string]string{
		"method": req.Method,
		"path":   normalizePath(req.URL.Path),
	}
	if resp != nil {
		dims["status"] = strconv.Itoa(resp.StatusCode)
	}
	if err != nil {
		dims["outcome"] = "error"
	}
	t.buffer.EmitCounter("cf-api-call-count", dims)
	t.buffer.EmitSample("cf-api-call-timing", dims, durMs)
	return resp, err
}

// WrapClient returns a shallow copy of `client` with its Transport replaced by
// one that tallies every round-trip into `buffer`. Leaves the original client
// untouched so concurrent callers that didn't opt in are unaffected.
func WrapClient(client *http.Client, buffer *Buffer) *http.Client {
	rt := client.Transport
	if rt == nil {
		rt = http.DefaultTransport
	}
	cp := *client
	cp.Transport = &instrumentedTransport{rt: rt, buffer: buffer}
	return &cp
}
