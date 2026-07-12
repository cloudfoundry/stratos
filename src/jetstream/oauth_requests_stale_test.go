package main

import (
	"fmt"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func TestIsTokenRejectedErr(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want bool
	}{
		{"uaa 401", api.ErrHTTPRequest{Status: 401}, true},
		{"uaa 400 invalid_grant", api.ErrHTTPRequest{Status: 400}, true},
		{"uaa 500", api.ErrHTTPRequest{Status: 500}, false},
		{"transport failure status 0", api.ErrHTTPRequest{Status: 0}, false},
		{"wrapped 401", fmt.Errorf("token refresh request failed: %w", api.ErrHTTPRequest{Status: 401}), true},
		{"plain error", fmt.Errorf("boom"), false},
		{"nil", nil, false},
	}
	for _, c := range cases {
		if got := isTokenRejectedErr(c.err); got != c.want {
			t.Errorf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}
