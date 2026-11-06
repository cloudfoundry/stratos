// src/jetstream/plugins/cloudfoundry/native_handlers_tls_test.go
package cloudfoundry

import (
	"context"
	"encoding/pem"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/require"
)

// A CF with a self-signed CA is the normal case for a lab foundation and for
// CF on Kubernetes. The endpoint record carries SkipSSLValidation and CACert
// for exactly this; both have to reach the capi client or every native read
// fails with "x509: certificate signed by unknown authority" while the
// endpoint still reports itself connected.
func newTLSCFStub(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewTLSServer(nil)
	t.Cleanup(srv.Close)
	return srv
}

func capiClientFor(t *testing.T, rec api.CNSIRecord) error {
	t.Helper()
	proxy := &mockNativeCFProxy{
		userID:      "user-1",
		cnsiRecord:  rec,
		tokenRecord: api.TokenRecord{AuthToken: "token", TokenExpiry: 0},
	}
	client, err := newCapiClient(context.Background(), proxy, "cnsi-1", "user-1")
	if err != nil {
		return err
	}
	// Force a real request so the TLS handshake actually happens.
	_, err = client.Organizations().List(context.Background(), nil)
	return err
}

// SkipSSLValidation alone is deliberately not enough on this path. capi gates
// SkipTLSVerify behind CAPI_DEV_MODE and documents CACertPEM as the supported
// route for a real foundation, so forwarding skip-ssl here would either fail
// on that gate or disable verification for every native call. Registering the
// endpoint with its CA is the fix; this test pins the behaviour so it is not
// "corrected" back into forwarding the flag.
func TestNewCapiClientDoesNotForwardSkipSSLValidation(t *testing.T) {
	srv := newTLSCFStub(t)
	endpoint, err := url.Parse(srv.URL)
	require.NoError(t, err)

	err = capiClientFor(t, api.CNSIRecord{
		APIEndpoint:       endpoint,
		SkipSSLValidation: true,
	})
	require.Error(t, err, "skip-ssl alone must not silence verification")
	require.Contains(t, err.Error(), "x509",
		"without a CA the read should still fail verification")
}

func TestNewCapiClientTrustsEndpointCACert(t *testing.T) {
	srv := newTLSCFStub(t)
	endpoint, err := url.Parse(srv.URL)
	require.NoError(t, err)

	caPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: srv.Certificate().Raw,
	})

	err = capiClientFor(t, api.CNSIRecord{
		APIEndpoint:       endpoint,
		SkipSSLValidation: false,
		CACert:            string(caPEM),
	})
	if err != nil {
		require.NotContains(t, err.Error(), "x509",
			"the endpoint CACert must be trusted by the capi client")
	}
}
