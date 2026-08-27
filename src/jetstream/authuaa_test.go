package main

import "testing"

// The endpoint check in getUAAToken is the only barrier between the
// unauthenticated first-run setup form and an outbound POST carrying
// credentials, so it gets a table of its own.
func TestTokenEndpointPattern(t *testing.T) {
	accept := []string{
		"https://uaa.example.com/oauth/token",
		"http://localhost:8080/oauth/token",
		"https://login.system.example.io:443/oauth/token",
		"https://127.0.0.1/oauth/token",
		"https://[::1]:8443/oauth/token",
		"https://keycloak.example/realms/my-realm/protocol/openid-connect/token",
		"https://uaa.example.com",
	}
	reject := []string{
		"",
		"uaa.example.com/oauth/token",      // no scheme
		"file:///etc/passwd",               // wrong scheme
		"gopher://internal:70/oauth/token", // wrong scheme
		"http://evil@internal/oauth/token", // user info steers the host
		"https://uaa.example.com/t?next=http://evil", // query
		"https://uaa.example.com/t#x",                // fragment
		"https://uaa.example.com/t\nX-Evil: 1",       // header injection
		"https://uaa example.com/oauth/token",        // space in host
	}

	for _, e := range accept {
		if !tokenEndpointPattern.MatchString(e) {
			t.Errorf("expected %q to be accepted", e)
		}
	}
	for _, e := range reject {
		if tokenEndpointPattern.MatchString(e) {
			t.Errorf("expected %q to be rejected", e)
		}
	}
}
