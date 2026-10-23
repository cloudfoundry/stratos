package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// An endpoint that still answers 401 after the token was refreshed (the
// autoscaler does, for a user who is not a developer in the app's space)
// must reach the user as that 401, not as an error the proxy turns
// into 500 "failed to authorize".
func TestOAuthRequestPassesOnA401AfterRefresh(t *testing.T) {
	t.Parallel()

	var requests int32
	endpoint := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		atomic.AddInt32(&requests, 1)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, `{"code":"Unauthorized","message":"You are not authorized to perform the requested action"}`)
	}))
	defer endpoint.Close()

	var refreshes int32
	refresh := func(bool, string, string, string, string, string) (api.TokenRecord, error) {
		atomic.AddInt32(&refreshes, 1)
		return api.TokenRecord{AuthToken: "refreshed", TokenExpiry: time.Now().Add(time.Hour).Unix()}, nil
	}

	req, _ := http.NewRequest(http.MethodGet, endpoint.URL+"/v1/apps/app-1/policy", nil)
	pp := &portalProxy{}
	handler := pp.OAuthHandlerFunc(&api.CNSIRequest{GUID: "cf", UserGUID: "user"}, req, refresh)
	res, err := handler(api.TokenRecord{AuthToken: "current", TokenExpiry: time.Now().Add(time.Hour).Unix()}, api.CNSIRecord{})

	if err != nil {
		t.Fatalf("expected the endpoint's answer, got error %v", err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusUnauthorized || len(body) == 0 {
		t.Errorf("got %d %q, want the endpoint's 401 and body", res.StatusCode, body)
	}
	if requests != 2 || refreshes != 1 {
		t.Errorf("got %d requests and %d refreshes, want one retry after one refresh", requests, refreshes)
	}
}
