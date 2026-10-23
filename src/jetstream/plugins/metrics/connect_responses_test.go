package metrics

import (
	"io"
	"net/http"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// trackedBody records whether it was closed.
type trackedBody struct {
	io.Reader
	mu     sync.Mutex
	closed bool
}

func (b *trackedBody) Close() error {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.closed = true
	return nil
}

func (b *trackedBody) isClosed() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.closed
}

// answers is an http.RoundTripper giving a set answer per path: a status
// with a body, or a request error.
type answers struct {
	status map[string]int
	fail   map[string]error
	mu     sync.Mutex
	bodies []*trackedBody
}

func (a *answers) RoundTrip(req *http.Request) (*http.Response, error) {
	if err, ok := a.fail[req.URL.Path]; ok {
		return nil, err
	}
	status, ok := a.status[req.URL.Path]
	if !ok {
		status = http.StatusNotFound
	}
	body := &trackedBody{Reader: strings.NewReader(req.URL.Path + " answered " + http.StatusText(status))}
	a.mu.Lock()
	a.bodies = append(a.bodies, body)
	a.mu.Unlock()
	return &http.Response{StatusCode: status, Status: http.StatusText(status), Body: body, Request: req}, nil
}

// answeringProxy hands out an HTTP client that uses answers.
type answeringProxy struct {
	api.PortalProxy
	transport *answers
}

func (p *answeringProxy) GetHttpClient(bool, string) http.Client {
	return http.Client{Transport: p.transport}
}

func TestInfoClosesTheResponseBody(t *testing.T) {
	t.Parallel()

	for _, status := range []int{http.StatusOK, http.StatusUnauthorized, http.StatusNotFound} {
		transport := &answers{status: map[string]int{"/": status}}
		m := &MetricsSpecification{portalProxy: &answeringProxy{transport: transport}}

		_, _, _ = m.Info("https://metrics.example.com/", false, "")

		require.Len(t, transport.bodies, 1, "status %d", status)
		assert.True(t, transport.bodies[0].isClosed(), "status %d: Info left the response body open", status)
	}
}
