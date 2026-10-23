package main

import (
	"testing"
	"time"
)

func TestGuardedDialControlBlocksInternalTargets(t *testing.T) {
	cases := []struct {
		address string
		blocked bool
	}{
		// Blocked: loopback and link-local (link-local covers the
		// 169.254.169.254 cloud metadata endpoint) are the SSRF escalation
		// targets the guard exists to stop.
		{"127.0.0.1:443", true},
		{"[::1]:6443", true},
		{"169.254.169.254:80", true},
		{"[fe80::1]:80", true},
		// Allowed: public and RFC1918 private ranges. Kubernetes API
		// servers legitimately live on private ranges, so those must pass.
		{"93.184.216.34:443", false},
		{"10.0.0.5:6443", false},
		{"192.168.1.10:6443", false},
		// Unparseable host must be rejected rather than dialed.
		{"not-an-ip:443", true},
	}

	for _, tc := range cases {
		err := guardedDialControl("tcp", tc.address, nil)
		if tc.blocked && err == nil {
			t.Errorf("expected %s to be blocked, got nil error", tc.address)
		}
		if !tc.blocked && err != nil {
			t.Errorf("expected %s to be allowed, got error: %v", tc.address, err)
		}
	}
}

// A client for an endpoint with a CA certificate must time out like the
// shared clients: the longer, mutating timeout for a mutating request.
// Not parallel: it changes the package's client settings.
func TestCACertClientUsesTheTimeoutForTheRequestKind(t *testing.T) {
	initializeHTTPClients(60, 120, 10)
	defer initializeHTTPClients(10, 10, 10) // as init in main_test.go sets them

	p := &portalProxy{}
	for _, mutating := range []bool{false, true} {
		shared := p.getHttpClient(false, "", mutating)
		withCA := p.getHttpClient(false, "not a PEM, the system pool is used", mutating)
		if withCA.Timeout != shared.Timeout {
			t.Errorf("mutating=%v: CA cert client timeout %v, shared client %v", mutating, withCA.Timeout, shared.Timeout)
		}
	}
	if got := p.getHttpClient(false, "", true).Timeout; got != 120*time.Second {
		t.Errorf("mutating shared client timeout %v, want 120s", got)
	}
}
