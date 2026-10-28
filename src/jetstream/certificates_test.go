// src/jetstream/certificates_test.go
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

type testCA struct {
	cert *x509.Certificate
	key  *ecdsa.PrivateKey
	pem  string
}

func mintCA(t *testing.T, cn string) *testCA {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	tmpl := &x509.Certificate{
		SerialNumber:          big.NewInt(time.Now().UnixNano()),
		Subject:               pkix.Name{CommonName: cn},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(24 * time.Hour),
		IsCA:                  true,
		BasicConstraintsValid: true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	require.NoError(t, err)
	cert, err := x509.ParseCertificate(der)
	require.NoError(t, err)
	return &testCA{cert: cert, key: key, pem: string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}))}
}

// serve starts a TLS server on 127.0.0.1 whose certificate is issued by ca
// and valid until notAfter.
func (ca *testCA) serve(t *testing.T, notAfter time.Time) *httptest.Server {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(time.Now().UnixNano()),
		Subject:      pkix.Name{CommonName: "server"},
		NotBefore:    time.Now().Add(-48 * time.Hour),
		NotAfter:     notAfter,
		KeyUsage:     x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, ca.cert, &key.PublicKey, ca.key)
	require.NoError(t, err)
	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	srv.TLS = &tls.Config{Certificates: []tls.Certificate{{Certificate: [][]byte{der}, PrivateKey: key}}}
	srv.StartTLS()
	t.Cleanup(srv.Close)
	return srv
}

func hostOf(t *testing.T, srv *httptest.Server) string {
	t.Helper()
	u, err := url.Parse(srv.URL)
	require.NoError(t, err)
	return u.Host
}

func Test_decodeCertificates_bundle(t *testing.T) {
	a, b := mintCA(t, "ca-a"), mintCA(t, "ca-b")

	got, err := decodeCertificates(a.pem + "\n" + b.pem)
	require.NoError(t, err)
	require.Len(t, got, 2)

	sum := sha256.Sum256(a.cert.Raw)
	require.Equal(t, a.cert.Subject.String(), got[0].Subject)
	require.Equal(t, a.cert.Issuer.String(), got[0].Issuer)
	require.True(t, a.cert.NotAfter.Equal(got[0].NotAfter))
	parts := make([]string, len(sum))
	for i, b := range sum {
		parts[i] = fmt.Sprintf("%02X", b)
	}
	require.Equal(t, strings.Join(parts, ":"), got[0].SHA256)
	require.Equal(t, b.cert.Subject.String(), got[1].Subject)
}

func Test_decodeCertificates_rejects_non_certificate(t *testing.T) {
	a := mintCA(t, "ca-a")
	key := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: []byte("x")}))

	_, err := decodeCertificates(a.pem + key)
	require.ErrorContains(t, err, "Not a certificate: block 2 is PRIVATE KEY")

	for _, in := range []string{"", "hello"} {
		_, err := decodeCertificates(in)
		require.ErrorContains(t, err, "No certificate found")
	}
}

func Test_checkTrust_trusted(t *testing.T) {
	ca := mintCA(t, "ca")
	srv := ca.serve(t, time.Now().Add(time.Hour))
	r := checkTrust(hostOf(t, srv), "127.0.0.1", ca.pem, 5*time.Second)
	require.True(t, r.Trusted, r.Reason)
	require.Empty(t, r.Reason)
}

func Test_checkTrust_unknown_authority(t *testing.T) {
	srv := mintCA(t, "ca").serve(t, time.Now().Add(time.Hour))
	r := checkTrust(hostOf(t, srv), "127.0.0.1", mintCA(t, "other").pem, 5*time.Second)
	require.False(t, r.Trusted)
	require.Equal(t, "unknown authority", r.Reason)
}

func Test_checkTrust_expired(t *testing.T) {
	ca := mintCA(t, "ca")
	srv := ca.serve(t, time.Now().Add(-time.Hour))
	r := checkTrust(hostOf(t, srv), "127.0.0.1", ca.pem, 5*time.Second)
	require.Equal(t, "expired", r.Reason)
}

func Test_checkTrust_name_mismatch(t *testing.T) {
	ca := mintCA(t, "ca")
	srv := ca.serve(t, time.Now().Add(time.Hour))
	r := checkTrust(hostOf(t, srv), "other.example", ca.pem, 5*time.Second)
	require.Equal(t, "name mismatch", r.Reason)
}

func Test_checkTrust_unreachable(t *testing.T) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	addr := l.Addr().String()
	require.NoError(t, l.Close())

	r := checkTrust(addr, "127.0.0.1", "", 2*time.Second)
	require.Equal(t, "unreachable", r.Reason)
}

// trustRequest runs the trust handler for a stored record with the given
// endpoint URLs and returns the decoded results.
func trustRequest(t *testing.T, apiURL, tokenURL string) []TrustResult {
	t.Helper()
	req := setupMockReq("POST", "", map[string]string{})
	rec, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	ctx.SetPathValues(echo.PathValues{{Name: "id", Value: mockCNSIGUID}})

	rows := sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).
		AddRow(mockCNSIGUID, "ep", "cf", apiURL, "", tokenURL, "", false, "client", []byte{}, true, "", "", "", "")
	mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockCNSIGUID).WillReturnRows(rows)

	require.NoError(t, pp.trustCheckHandler(ctx))
	require.Equal(t, http.StatusOK, rec.Code)
	var out []TrustResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &out))
	return out
}

func Test_trustCheck_dedupes_same_host(t *testing.T) {
	// Closed port: both URLs name the same host, so one result comes back.
	out := trustRequest(t, "https://127.0.0.1:1/api", "https://127.0.0.1:1/uaa")
	require.Len(t, out, 1)
	require.Equal(t, "127.0.0.1:1", out[0].Host)
}

func Test_trustCheck_cf_two_hosts(t *testing.T) {
	out := trustRequest(t, "https://127.0.0.1:1", "https://127.0.0.1:2")
	require.Len(t, out, 2)
	require.Equal(t, "127.0.0.1:1", out[0].Host)
	require.Equal(t, "127.0.0.1:2", out[1].Host)
}

func Test_decodeCertificatesHandler_400(t *testing.T) {
	req := setupMockReq("POST", "", map[string]string{"ca_cert": "hello"})
	_, _, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()

	err := pp.decodeCertificatesHandler(ctx)
	require.ErrorContains(t, err, "No certificate found")
}
