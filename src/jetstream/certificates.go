// src/jetstream/certificates.go
package main

import (
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

const trustCheckTimeout = 10 * time.Second

// CertificateSummary is the decoded form of one certificate in an endpoint's
// CA bundle.
type CertificateSummary struct {
	Subject   string    `json:"subject"`
	Issuer    string    `json:"issuer"`
	NotBefore time.Time `json:"not_before"`
	NotAfter  time.Time `json:"not_after"`
	SHA256    string    `json:"sha256"` // colon-separated upper hex
}

// TrustResult is the outcome of verifying one host against the system roots
// plus the endpoint's CA.
type TrustResult struct {
	Host    string `json:"host"`
	Trusted bool   `json:"trusted"`
	Reason  string `json:"reason,omitempty"` // "expired", "unknown authority", "name mismatch", "unreachable", "other: <detail>"
}

// decodeCertificates parses a PEM bundle. Every block must be a certificate.
func decodeCertificates(pemText string) ([]CertificateSummary, error) {
	var out []CertificateSummary
	rest := []byte(pemText)
	for n := 1; ; n++ {
		var block *pem.Block
		block, rest = pem.Decode(rest)
		if block == nil {
			break
		}
		if block.Type != "CERTIFICATE" {
			return nil, fmt.Errorf("Not a certificate: block %d is %s", n, block.Type)
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("Not a certificate: block %d cannot be parsed", n)
		}
		sum := sha256.Sum256(cert.Raw)
		hex := make([]string, len(sum))
		for i, b := range sum {
			hex[i] = fmt.Sprintf("%02X", b)
		}
		out = append(out, CertificateSummary{
			Subject:   cert.Subject.String(),
			Issuer:    cert.Issuer.String(),
			NotBefore: cert.NotBefore,
			NotAfter:  cert.NotAfter,
			SHA256:    strings.Join(hex, ":"),
		})
	}
	if len(out) == 0 {
		return nil, errors.New("No certificate found")
	}
	return out, nil
}

// checkTrust fetches the certificate chain a host presents and verifies it
// against the system roots plus caCert, the same pool real requests use
// (getHttpClientWIthCA). Skip-SSL is deliberately not honoured, as with a CA.
func checkTrust(hostPort, serverName, caCert string, timeout time.Duration) TrustResult {
	res := TrustResult{Host: hostPort}

	conn, err := tls.DialWithDialer(&net.Dialer{Timeout: timeout}, "tcp", hostPort,
		&tls.Config{InsecureSkipVerify: true, ServerName: serverName}) // #nosec G402 -- fetches the chain only; it is verified below
	if err != nil {
		res.Reason = "unreachable"
		return res
	}
	defer func() { _ = conn.Close() }()

	chain := conn.ConnectionState().PeerCertificates
	if len(chain) == 0 {
		res.Reason = "other: no certificate presented"
		return res
	}

	roots, err := x509.SystemCertPool()
	if roots == nil || err != nil {
		roots = x509.NewCertPool()
	}
	roots.AppendCertsFromPEM([]byte(caCert))
	inter := x509.NewCertPool()
	for _, c := range chain[1:] {
		inter.AddCert(c)
	}

	_, err = chain[0].Verify(x509.VerifyOptions{DNSName: serverName, Roots: roots, Intermediates: inter})
	if err == nil {
		res.Trusted = true
		return res
	}

	var invalid x509.CertificateInvalidError
	var unknown x509.UnknownAuthorityError
	var hostname x509.HostnameError
	switch {
	case errors.As(err, &invalid) && invalid.Reason == x509.Expired:
		res.Reason = "expired"
	// macOS verifies against the platform trust store when no extra CA is
	// in the pool, and reports an untrusted chain as a plain error.
	case errors.As(err, &unknown), strings.HasSuffix(err.Error(), "certificate is not trusted"):
		res.Reason = "unknown authority"
	case errors.As(err, &hostname):
		res.Reason = "name mismatch"
	default:
		res.Reason = "other: " + err.Error()
	}
	return res
}

// decodeCertificatesHandler decodes the PEM in form field ca_cert.
func (p *portalProxy) decodeCertificatesHandler(c *echo.Context) error {
	certs, err := decodeCertificates(c.FormValue("ca_cert"))
	if err != nil {
		return api.NewHTTPShadowError(http.StatusBadRequest, err.Error(), "Certificate decode failed: %v", err)
	}
	return c.JSON(http.StatusOK, certs)
}

// trustCheckHandler checks the trust of the stored endpoint's API host and, if
// different, its token host. The hosts come from the stored record only. The
// CA is the form's ca_cert when sent, else the stored one.
func (p *portalProxy) trustCheckHandler(c *echo.Context) error {
	id := c.Param("id")
	rec, err := p.GetCNSIRecord(id)
	if err != nil {
		// The repository signals not-found only by this message (see also
		// the check in cnsi.go).
		if err.Error() == "No match for that Endpoint" {
			return api.NewHTTPShadowError(http.StatusNotFound, "Endpoint not found", "Trust check: %v", err)
		}
		return api.NewHTTPShadowError(http.StatusInternalServerError, "Could not look up the endpoint", "Trust check: %v", err)
	}

	caCert := rec.CACert
	if err := c.Request().ParseForm(); err == nil {
		if vals, sent := c.Request().PostForm["ca_cert"]; sent && len(vals) > 0 {
			caCert = vals[0]
		}
	}

	results := []TrustResult{}
	seen := map[string]bool{}
	check := func(u *url.URL) {
		if u == nil || u.Host == "" {
			return
		}
		port := u.Port()
		if port == "" {
			port = "443"
		}
		hostPort := net.JoinHostPort(u.Hostname(), port)
		if seen[hostPort] {
			return
		}
		seen[hostPort] = true
		results = append(results, checkTrust(hostPort, u.Hostname(), caCert, trustCheckTimeout))
	}

	check(rec.APIEndpoint)
	if rec.TokenEndpoint != "" {
		if tu, err := url.Parse(rec.TokenEndpoint); err == nil {
			check(tu)
		}
	}
	return c.JSON(http.StatusOK, results)
}
