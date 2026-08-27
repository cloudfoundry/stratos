package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
)

// The Kubernetes chart mounts the certificate at an absolute path. Echo v5
// resolves a certificate PATH through an fs.FS rooted at the working
// directory, and io/fs.ValidPath rejects an absolute path, so handing Echo the
// path started no HTTPS server at all. tlsKeyPair reads the files itself and
// hands Echo the contents, which it takes as-is.
func TestStartTLSAcceptsAnAbsoluteCertificatePath(t *testing.T) {
	dir := t.TempDir()
	certFile := filepath.Join(dir, "tls.crt")
	certKeyFile := filepath.Join(dir, "tls.key")
	writeSelfSignedKeyPair(t, certFile, certKeyFile)

	if !filepath.IsAbs(certFile) {
		t.Fatalf("the test needs an absolute path, got %s", certFile)
	}

	// The path form is what regressed: Echo refuses it before it ever listens.
	pathErr := echo.StartConfig{Address: "127.0.0.1:0", HideBanner: true, HidePort: true}.
		StartTLS(canceledContext(), echo.New(), certFile, certKeyFile)
	if pathErr == nil {
		t.Fatal("expected Echo to reject an absolute certificate path; if this now works, tlsKeyPair can go")
	}

	cert, certKey, err := tlsKeyPair(certFile, certKeyFile)
	if err != nil {
		t.Fatalf("tlsKeyPair: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	listening := make(chan string, 1)
	serveErr := make(chan error, 1)
	go func() {
		e := echo.New()
		e.GET("/", func(c *echo.Context) error { return c.String(http.StatusOK, "ok") })
		serveErr <- echo.StartConfig{
			Address:          "127.0.0.1:0",
			HideBanner:       true,
			HidePort:         true,
			ListenerAddrFunc: func(a net.Addr) { listening <- a.String() },
		}.StartTLS(ctx, e, cert, certKey)
	}()

	var addr string
	select {
	case addr = <-listening:
	case err := <-serveErr:
		t.Fatalf("the HTTPS server did not start: %v", err)
	case <-time.After(5 * time.Second):
		t.Fatal("the HTTPS server did not start within 5s")
	}

	client := &http.Client{
		Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},
		Timeout:   5 * time.Second,
	}
	res, err := client.Get("https://" + addr + "/")
	if err != nil {
		t.Fatalf("the HTTPS server did not serve: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Errorf("status = %d, want %d", res.StatusCode, http.StatusOK)
	}

	cancel()
	<-serveErr
}

func TestTLSKeyPairReportsAMissingFile(t *testing.T) {
	_, _, err := tlsKeyPair(filepath.Join(t.TempDir(), "absent.crt"), filepath.Join(t.TempDir(), "absent.key"))
	if err == nil {
		t.Fatal("expected an error for a missing certificate")
	}
}

func canceledContext() context.Context {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	return ctx
}

func writeSelfSignedKeyPair(t *testing.T, certFile, certKeyFile string) {
	t.Helper()

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "localhost"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	der, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		t.Fatalf("create certificate: %v", err)
	}
	keyDER, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		t.Fatalf("marshal key: %v", err)
	}

	if err := os.WriteFile(certFile, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0600); err != nil {
		t.Fatalf("write certificate: %v", err)
	}
	if err := os.WriteFile(certKeyFile, pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER}), 0600); err != nil {
		t.Fatalf("write key: %v", err)
	}
}
