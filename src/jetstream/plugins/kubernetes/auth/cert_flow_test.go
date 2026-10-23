package auth

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// flowProxy runs the auth handler the way DoAuthFlowRequest does, with a
// set token and endpoint record. Any other method panics.
type flowProxy struct {
	api.PortalProxy
	token api.TokenRecord
	cnsi  api.CNSIRecord
}

func (p flowProxy) DoAuthFlowRequest(_ *api.CNSIRequest, _ *http.Request, handler api.AuthHandlerFunc) (*http.Response, error) {
	return handler(p.token, p.cnsi)
}

// clientCertToken is a cert-auth token holding a fresh self-signed client
// certificate and key.
func clientCertToken(t *testing.T) api.TokenRecord {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "kube-user"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	keyDER, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	cert := &KubeCertificate{
		Certificate:    string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})),
		CertificateKey: string(pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})),
	}
	tokenJSON, err := cert.GetJSON()
	if err != nil {
		t.Fatal(err)
	}
	return api.TokenRecord{AuthType: authConnectTypeCertAuth, AuthToken: tokenJSON}
}

func certFlowRequest(t *testing.T, server *httptest.Server, cnsi api.CNSIRecord) (*http.Response, error) {
	t.Helper()
	auth := InitCertKubeAuth(flowProxy{token: clientCertToken(t), cnsi: cnsi})
	req, _ := http.NewRequest(http.MethodGet, server.URL+"/api/v1/pods?limit=1", nil)
	return auth.DoFlowRequest(&api.CNSIRequest{GUID: "kube", UserGUID: "user"}, req)
}

func caPEM(server *httptest.Server) string {
	return string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}))
}

func TestCertAuthTrustsTheEndpointCACert(t *testing.T) {
	cluster := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = io.WriteString(w, `{"items":[]}`)
	}))
	defer cluster.Close()

	res, err := certFlowRequest(t, cluster, api.CNSIRecord{GUID: "kube", CACert: caPEM(cluster)})
	if err != nil {
		t.Fatalf("expected the cluster's CA certificate to be trusted, got %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Errorf("got %d, want 200", res.StatusCode)
	}
}

func TestCertAuthStillRefusesAnUntrustedCluster(t *testing.T) {
	cluster := httptest.NewTLSServer(http.NotFoundHandler())
	defer cluster.Close()

	res, err := certFlowRequest(t, cluster, api.CNSIRecord{GUID: "kube"})
	if err == nil {
		res.Body.Close()
		t.Fatal("expected a cluster with no trusted CA and no Skip SSL to be refused")
	}
}

func TestCertAuthPassesOnA401(t *testing.T) {
	cluster := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, `{"kind":"Status","message":"Unauthorized","code":401}`)
	}))
	defer cluster.Close()

	res, err := certFlowRequest(t, cluster, api.CNSIRecord{GUID: "kube", CACert: caPEM(cluster)})
	if err != nil {
		t.Fatalf("expected the cluster's 401 as the response, got error %v", err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusUnauthorized || len(body) == 0 {
		t.Errorf("got %d %q, want the cluster's 401 and body", res.StatusCode, body)
	}
}
