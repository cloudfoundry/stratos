package main

import (
	"crypto/x509"
	"errors"
	"fmt"
	"net/url"
	"testing"
)

// Regression for isSSLRelatedError: it previously passed nil typed pointers to
// errors.As, which panics. net/http surfaces certificate failures as a
// *url.Error wrapping an x509 error (by value), so this exercises that shape.
func TestIsSSLRelatedErrorDetectsWrappedX509(t *testing.T) {
	urlErr := &url.Error{Op: "Get", URL: "https://example.com", Err: x509.UnknownAuthorityError{}}
	isSSL, msg := isSSLRelatedError(urlErr)
	if !isSSL {
		t.Fatalf("expected a wrapped x509 cert error to be detected as SSL-related")
	}
	if msg == "" {
		t.Fatalf("expected a non-empty error message")
	}
}

func TestIsSSLRelatedErrorIgnoresNonCertErrors(t *testing.T) {
	if isSSL, _ := isSSLRelatedError(errors.New("some other error")); isSSL {
		t.Fatalf("expected a plain error to be reported as not SSL-related")
	}
	// A url.Error wrapping a non-cert error must not panic or false-positive.
	urlErr := &url.Error{Op: "Get", URL: "https://example.com", Err: fmt.Errorf("connection refused")}
	if isSSL, _ := isSSLRelatedError(urlErr); isSSL {
		t.Fatalf("expected a non-cert url.Error to be reported as not SSL-related")
	}
}
