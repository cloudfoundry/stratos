package main

import (
	"database/sql/driver"
	"fmt"
	"net/http"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"
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

// captureArg is a sqlmock.Argument that records whatever value it matched,
// so the test can inspect the exact bytes a write produced.
type captureArg struct {
	dest *interface{}
}

func (c captureArg) Match(v driver.Value) bool {
	*c.dest = v
	return true
}

// TestRefreshOAuthTokenKeepsStoredRefreshTokenWhenUAAOmitsOne guards the
// success path: RFC 6749 §4.3.3 permits a token response WITHOUT a
// refresh_token, in which case the previously issued refresh token remains
// valid and the client must keep using it. The stored refresh token must
// therefore survive such a refresh — an empty refresh_token in a SUCCESS
// response must never clobber a live stored one (only the rejected-token
// disposal write intentionally writes an empty refresh token).
func TestRefreshOAuthTokenKeepsStoredRefreshTokenWhenUAAOmitsOne(t *testing.T) {
	t.Parallel()

	// UAA succeeds but omits refresh_token from the response.
	mockUAA := setupMockServer(
		t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(api.UAAResponse{
			AccessToken:  mockUAAToken,
			RefreshToken: "",
		})))
	defer mockUAA.Close()

	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("unexpected error opening stub database connection: %s", dberr)
	}
	defer db.Close()

	pp := setupPortalProxy(db)
	pp.DatabaseConnectionPool = db

	// Stored row: expired access token, live (encrypted) refresh token.
	mock.ExpectQuery(selectAnyFromTokens).
		WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
		WillReturnRows(testutils.GetTokenRowsWithExpiredToken(mockEncryptionKey))

	// The refresh must persist fresh auth data — capture the refresh-token
	// ciphertext it writes so we can prove WHICH refresh token survived.
	var capturedRefreshCiphertext interface{}
	mock.ExpectExec(updateTokens).
		WithArgs(sqlmock.AnyArg(), captureArg{&capturedRefreshCiphertext}, sqlmock.AnyArg(), testutils.MockTokenGUID, testutils.MockAccount).
		WillReturnResult(sqlmock.NewResult(1, 1))

	tokenRecord, err := pp.RefreshOAuthToken(true, testutils.MockCFGUID, testutils.MockAccount, mockClientId, mockClientSecret, mockUAA.URL)
	if err != nil {
		t.Fatalf("RefreshOAuthToken failed: %v", err)
	}
	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("unfulfilled sqlmock expectations: %s", dberr)
	}

	// The returned record must carry the stored refresh token, not "".
	if tokenRecord.RefreshToken != testutils.MockUAAToken {
		t.Errorf("returned RefreshToken: got %q-len %d, want the stored refresh token", "", len(tokenRecord.RefreshToken))
	}

	// And the persisted row must too: decrypt the exact ciphertext written.
	ciphertext, ok := capturedRefreshCiphertext.([]byte)
	if !ok {
		t.Fatalf("captured refresh ciphertext is %T, want []byte", capturedRefreshCiphertext)
	}
	persisted, decErr := crypto.DecryptToken(mockEncryptionKey, ciphertext)
	if decErr != nil {
		t.Fatalf("could not decrypt persisted refresh token: %v", decErr)
	}
	if persisted != testutils.MockUAAToken {
		t.Errorf("persisted refresh token was clobbered: got len %d, want the stored refresh token (len %d)", len(persisted), len(testutils.MockUAAToken))
	}
}
