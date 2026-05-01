// src/jetstream/plugins/cloudfoundry/native_apps_restage_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNewestReadyPackage_HappyPath verifies the helper issues a single
// /v3/packages list query filtered to the target app and the READY state,
// ordered descending by created_at with per_page=1, and returns the first
// resource's GUID.
func TestGetNewestReadyPackage_HappyPath(t *testing.T) {
	var capturedQuery string
	var capturedPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			capturedPath = r.URL.Path
			capturedQuery = r.URL.RawQuery
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid":  "pkg-newest",
						"state": "READY",
						"type":  "bits",
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-1")
	require.NoError(t, err)
	assert.Equal(t, "pkg-newest", pkgGUID)
	assert.Equal(t, "/v3/packages", capturedPath)
	assert.Contains(t, capturedQuery, "app_guids=app-1")
	assert.Contains(t, capturedQuery, "states=READY")
	assert.Contains(t, capturedQuery, "order_by=-created_at")
	assert.Contains(t, capturedQuery, "per_page=1")
}

// TestGetNewestReadyPackage_NoEligiblePackages verifies that an empty
// resources list (e.g. an app with no buildable package) surfaces
// errNoReadyPackage. The orchestrator treats this as a terminal failure.
func TestGetNewestReadyPackage_NoEligiblePackages(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-empty")
	require.ErrorIs(t, err, errNoReadyPackage)
	assert.Empty(t, pkgGUID)
}

// TestGetNewestReadyPackage_PropagatesUpstreamError verifies the helper
// returns the underlying error when CF responds with a non-success status,
// rather than masking it with errNoReadyPackage.
func TestGetNewestReadyPackage_PropagatesUpstreamError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"errors":[{"code":10001,"title":"CF-ServerError","detail":"upstream broke"}]}`))
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-1")
	require.Error(t, err)
	require.NotErrorIs(t, err, errNoReadyPackage)
	assert.Empty(t, pkgGUID)
}
