package main

import "testing"

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
