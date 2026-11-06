// src/jetstream/authuaa_tls_test.go
package main

import (
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
)

// The token endpoint of a foundation with a private CA is reached with the CA
// the endpoint was registered with. Without it, registering an endpoint with a
// CA succeeds and connecting to it then fails, because the OAuth call trusts
// nothing but the system roots.
func TestGetUAATokenUsesEndpointCACert(t *testing.T) {
	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"a","refresh_token":"r","token_type":"bearer","expires_in":100,"scope":"s"}`))
	}))
	defer srv.Close()

	caPEM := string(pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: srv.Certificate().Raw,
	}))

	p := &portalProxy{}

	t.Run("with the CA the request succeeds", func(t *testing.T) {
		_, err := p.getUAAToken(url.Values{}, false, caPEM, "client", "secret", srv.URL)
		require.NoError(t, err)
	})

	t.Run("without the CA it fails verification", func(t *testing.T) {
		_, err := p.getUAAToken(url.Values{}, false, "", "client", "secret", srv.URL)
		require.Error(t, err)
	})
}
