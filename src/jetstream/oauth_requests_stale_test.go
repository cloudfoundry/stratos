package main

import (
	"database/sql/driver"
	"fmt"
	"net/http"
	"testing"
	"time"

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
		{"uaa 401 empty body", api.ErrHTTPRequest{Status: 401}, true},
		{"uaa 401 invalid_client", api.ErrHTTPRequest{Status: 401, Response: `{"error":"invalid_client","error_description":"Bad client credentials"}`}, false},
		{"uaa 400 invalid_grant", api.ErrHTTPRequest{Status: 400, Response: `{"error":"invalid_grant","error_description":"Invalid refresh token"}`}, true},
		{"uaa 400 invalid_token", api.ErrHTTPRequest{Status: 400, Response: `{"error":"invalid_token"}`}, true},
		{"uaa 400 invalid_request", api.ErrHTTPRequest{Status: 400, Response: `{"error":"invalid_request","error_description":"Missing grant_type"}`}, false},
		{"uaa 400 empty body", api.ErrHTTPRequest{Status: 400}, false},
		{"uaa 500", api.ErrHTTPRequest{Status: 500}, false},
		{"transport failure status 0", api.ErrHTTPRequest{Status: 0}, false},
		{"wrapped 401", fmt.Errorf("token refresh request failed: %w", api.ErrHTTPRequest{Status: 401}), true},
		{"wrapped 401 invalid_client", fmt.Errorf("token refresh request failed: %w", api.ErrHTTPRequest{Status: 401, Response: `{"error":"invalid_client"}`}), false},
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

// TestRefreshOAuthTokenDoesNotDisposeNonOAuthToken guards the AuthType gate:
// startCNSITokenRefreshRoutines has no auth_type filter, so every stored
// token row — including basic-auth rows that store the username in
// RefreshToken — reaches RefreshOAuthToken. A rejected-classified UAA
// response must never trigger the disposal write unless the token is
// actually OAuth2.
func TestRefreshOAuthTokenDoesNotDisposeNonOAuthToken(t *testing.T) {
	t.Parallel()

	// UAA responds with a body that isTokenRejectedErr classifies as a
	// genuine token rejection (400 invalid_grant) — so the AuthType gate is
	// the only thing standing between this response and a disposal write.
	mockUAA := setupMockServer(
		t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusBadRequest),
		msBody(`{"error":"invalid_grant","error_description":"Invalid refresh token"}`))
	defer mockUAA.Close()

	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("unexpected error opening stub database connection: %s", dberr)
	}
	defer db.Close()

	pp := setupPortalProxy(db)
	pp.DatabaseConnectionPool = db

	// Stored row: basic-auth token (username in RefreshToken), expired.
	encryptedToken, _ := crypto.EncryptToken(mockEncryptionKey, mockUAAToken)
	rows := testutils.GetEmptyTokenRows()
	rows.AddRow(testutils.MockTokenGUID, encryptedToken, encryptedToken,
		time.Now().AddDate(0, 0, -1).Unix(), false, api.AuthTypeHttpBasic, "", testutils.MockAccount, nil, true)

	mock.ExpectQuery(selectAnyFromTokens).
		WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
		WillReturnRows(rows)

	// Register the disposal-write shape only to observe whether it fires:
	// captureArg records the matched value if, and only if, RefreshOAuthToken
	// actually calls Exec with it. We deliberately do NOT assert
	// mock.ExpectationsWereMet() here — the correct, gated behavior leaves
	// this expectation unmatched.
	var capturedUpdate interface{}
	mock.ExpectExec(updateTokens).
		WithArgs(sqlmock.AnyArg(), captureArg{&capturedUpdate}, sqlmock.AnyArg(), testutils.MockTokenGUID, testutils.MockAccount).
		WillReturnResult(sqlmock.NewResult(1, 1))

	_, err := pp.RefreshOAuthToken(true, testutils.MockCFGUID, testutils.MockAccount, mockClientId, mockClientSecret, mockUAA.URL)
	if err == nil {
		t.Fatalf("expected RefreshOAuthToken to return the UAA rejection error")
	}

	if capturedUpdate != nil {
		t.Errorf("disposal write was attempted for a non-OAuth (basic-auth) token")
	}
}

// TestRefreshOAuthTokenFloorsZeroExpiryOnDisposal guards the disposal write's
// expiry shape: a stored row with TokenExpiry==0 ("no known expiry") must not
// be left at 0 after disposal, or the boot report (requires expiry>0) and the
// frontend (!!token_expiry) both treat the disposed row as healthy forever.
func TestRefreshOAuthTokenFloorsZeroExpiryOnDisposal(t *testing.T) {
	t.Parallel()

	mockUAA := setupMockServer(
		t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusUnauthorized),
		msBody(`{"error":"invalid_token","error_description":"Refresh token expired"}`))
	defer mockUAA.Close()

	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("unexpected error opening stub database connection: %s", dberr)
	}
	defer db.Close()

	pp := setupPortalProxy(db)
	pp.DatabaseConnectionPool = db

	// Stored row: OAuth2 token, TokenExpiry == 0 (no known expiry).
	encryptedToken, _ := crypto.EncryptToken(mockEncryptionKey, mockUAAToken)
	rows := testutils.GetEmptyTokenRows()
	rows.AddRow(testutils.MockTokenGUID, encryptedToken, encryptedToken,
		int64(0), false, api.AuthTypeOAuth2, "", testutils.MockAccount, nil, true)

	mock.ExpectQuery(selectAnyFromTokens).
		WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
		WillReturnRows(rows)

	var capturedExpiry interface{}
	mock.ExpectExec(updateTokens).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), captureArg{&capturedExpiry}, testutils.MockTokenGUID, testutils.MockAccount).
		WillReturnResult(sqlmock.NewResult(1, 1))

	before := time.Now().Unix()
	_, err := pp.RefreshOAuthToken(true, testutils.MockCFGUID, testutils.MockAccount, mockClientId, mockClientSecret, mockUAA.URL)
	after := time.Now().Unix()
	if err == nil {
		t.Fatalf("expected RefreshOAuthToken to return the UAA rejection error")
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("unfulfilled sqlmock expectations: %s", dberr)
	}

	expiry, ok := capturedExpiry.(int64)
	if !ok {
		t.Fatalf("captured expiry is %T, want int64", capturedExpiry)
	}
	if expiry <= 0 {
		t.Errorf("disposed row's expiry was left at %d, want a positive floored timestamp", expiry)
	}
	if expiry < before || expiry > after {
		t.Errorf("disposed row's expiry %d is not within the refresh call window [%d, %d]", expiry, before, after)
	}
}
