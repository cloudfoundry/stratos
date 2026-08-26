package main

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// refreshMutexes serializes concurrent RefreshOAuthToken calls for the same
// (cnsiGUID, userGUID) pair. Without this, N parallel requests (e.g., the
// three home-card CF fetches) all hit UAA with the same old refresh_token,
// UAA invalidates the old refresh_token after the first use, and losers get
// invalid_grant → 502. With the mutex, only the first goroutine hits UAA;
// later goroutines acquire the mutex, see the fresh token already in the DB,
// and skip the round-trip.
var refreshMutexes sync.Map

func refreshMutex(cnsiGUID, userGUID string) *sync.Mutex {
	key := cnsiGUID + ":" + userGUID
	mu, _ := refreshMutexes.LoadOrStore(key, &sync.Mutex{})
	return mu.(*sync.Mutex)
}

func (p *portalProxy) OAuthHandlerFunc(cnsiRequest *api.CNSIRequest, req *http.Request, refreshOAuthTokenFunc api.RefreshOAuthTokenFunc) api.AuthHandlerFunc {

	return func(tokenRec api.TokenRecord, cnsi api.CNSIRecord) (*http.Response, error) {

		got401 := false

		for {
			expTime := time.Unix(tokenRec.TokenExpiry, 0)
			if got401 || expTime.Before(time.Now()) {
				refreshedTokenRec, err := refreshOAuthTokenFunc(cnsi.SkipSSLValidation, cnsiRequest.GUID, cnsiRequest.UserGUID, cnsi.ClientId, cnsi.ClientSecret, cnsi.TokenEndpoint)
				if err != nil {
					slog.Info("could not refresh the token", "endpoint", cnsiRequest.GUID, "user", cnsiRequest.UserGUID, "error", err)
					return nil, fmt.Errorf("couldn't refresh token for CNSI with GUID %s", cnsiRequest.GUID)
				}
				tokenRec = refreshedTokenRec
			}
			req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

			client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
			res, err := client.Do(req)
			if err != nil {
				return nil, fmt.Errorf("request failed: %v", err)
			}

			if res.StatusCode != 401 {
				return res, nil
			}

			if got401 {
				return res, errors.New("failed to authorize")
			}
			got401 = true
		}
	}
}

func (p *portalProxy) DoOAuthFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	slog.Debug("DoOAuthFlowRequest")
	authHandler := p.OAuthHandlerFunc(cnsiRequest, req, p.RefreshOAuthToken)
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)

}

func (p *portalProxy) getCNSIRequestRecords(r *api.CNSIRequest) (t api.TokenRecord, c api.CNSIRecord, err error) {
	slog.Debug("getCNSIRequestRecords")

	var ok bool

	if r.Token != nil {
		t = *r.Token
	} else {
		// look up token
		t, ok = p.GetCNSITokenRecord(r.GUID, r.UserGUID)
		if !ok {
			return t, c, fmt.Errorf("could not find token for csni:user %s:%s", r.GUID, r.UserGUID)
		}
	}

	c, err = p.GetCNSIRecord(r.GUID)
	if err != nil {
		return t, c, fmt.Errorf("info could not be found for CNSI with GUID %s: %s", r.GUID, err)
	}

	return t, c, nil
}

// isTokenRejectedErr reports whether a token-refresh failure means UAA
// REJECTED the refresh token itself — as opposed to UAA being unreachable
// (status 0), erroring (5xx), or the request failing for a reason that says
// nothing about the token's validity. Only a genuine rejection justifies
// disposing of the stored refresh token.
//
// Status alone is not enough to tell those apart: a rotated or misconfigured
// client secret at UAA also surfaces as 401 (invalid_client) or 400
// (invalid_request), and disposing the token on that basis would destroy
// every user's still-valid refresh token for the endpoint the moment the
// operator's client config drifts — unrecoverable even after the secret is
// fixed. So the body is inspected too:
//   - 400 disposes only when the body names invalid_grant or invalid_token
//     (the token was rejected); invalid_request and other 400s are treated
//     as client/request problems and left alone.
//   - 401 disposes UNLESS the body names invalid_client (our own client
//     credentials are wrong, not the user's token); an empty or
//     unrecognized 401 body is treated as a token rejection, matching UAA's
//     normal invalid_token/invalid_grant response to a bad refresh token.
//
// Mirrors classifyCfError's discrimination in the cloudfoundry plugin, which
// cannot be imported from here.
func isTokenRejectedErr(err error) bool {
	var httpReq api.ErrHTTPRequest
	if !errors.As(err, &httpReq) {
		return false
	}
	switch httpReq.Status {
	case http.StatusUnauthorized:
		return !strings.Contains(httpReq.Response, "invalid_client")
	case http.StatusBadRequest:
		return strings.Contains(httpReq.Response, "invalid_grant") ||
			strings.Contains(httpReq.Response, "invalid_token")
	default:
		return false
	}
}

func (p *portalProxy) RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t api.TokenRecord, err error) {
	slog.Debug("refreshToken", "endpoint", cnsiGUID, "user", userGUID)
	mu := refreshMutex(cnsiGUID, userGUID)
	waitStart := time.Now()
	mu.Lock()
	defer mu.Unlock()
	if waited := time.Since(waitStart); waited > 10*time.Millisecond {
		slog.Info("[diag refresh] mutex acquired", "endpoint", cnsiGUID, "user", userGUID, "waited", waited)
	}

	userToken, ok := p.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		slog.Warn("[diag refresh] token record missing", "endpoint", cnsiGUID, "user", userGUID)
		return t, fmt.Errorf("info could not be found for user with GUID %s", userGUID)
	}

	// Double-check: if another goroutine refreshed while we waited on the
	// mutex, the stored token is already fresh — skip the UAA round-trip.
	if userToken.TokenExpiry > 0 && time.Unix(userToken.TokenExpiry, 0).After(time.Now()) {
		slog.Info("[diag refresh] SKIP - token already fresh",
			"endpoint", cnsiGUID, "user", userGUID, "expiry", userToken.TokenExpiry)
		return userToken, nil
	}

	slog.Info("[diag refresh] calling UAA",
		"endpoint", cnsiGUID, "user", userGUID, "tokenEndpoint", tokenEndpoint,
		"hasRefresh", userToken.RefreshToken != "")

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	uaaRes, err := p.getUAATokenWithRefreshToken(skipSSLValidation, userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath, "")
	if err != nil {
		slog.Warn("[diag refresh] UAA call FAILED", "endpoint", cnsiGUID, "user", userGUID, "error", err)
		// OAUTH TOKENS ONLY: this function is the OAuth refresh path, but it
		// is reached for every stored token row regardless of auth type
		// (startCNSITokenRefreshRoutines has no auth_type filter) — basic-auth
		// rows store the username in RefreshToken and must never be cleared
		// this way. The AuthType check below makes that a hard gate rather
		// than an assumption resting on basic-auth endpoints happening to
		// lack a TokenEndpoint today.
		if isTokenRejectedErr(err) && userToken.AuthType == api.AuthTypeOAuth2 {
			// UAA rejected the refresh token — it is worthless now. Record the
			// death in the row itself: drop the dead refresh token and floor
			// the expiry, so read-time state (token_renewable=false + expiry
			// past) computes 'expired' even when the access token looked
			// fresh (mid-window revocation). No new column: this IS the
			// corrected state. The kept auth_token still carries the JWT user
			// claims the UI shows and the reconnect dialog prefills from.
			dead := userToken
			dead.RefreshToken = ""
			// The row must always end up with a positive PAST expiry — a
			// zero expiry reads as "no known expiry" (boot report skips it,
			// frontend computes 'connected'), which would make the disposal
			// invisible. Floor whenever the current value isn't already a
			// positive past timestamp: zero or future both get set to now.
			if now := time.Now().Unix(); dead.TokenExpiry == 0 || dead.TokenExpiry > now {
				dead.TokenExpiry = now
			}
			if updErr := p.updateTokenAuth(userGUID, dead); updErr != nil {
				slog.Warn("could not record the rejected token", "endpoint", cnsiGUID, "user", userGUID, "error", updErr)
			}
		}
		// %w (not %v) so the underlying api.ErrHTTPRequest stays unwrappable —
		// the native CF error classifier inspects its upstream Status to tell
		// an unreachable UAA (5xx/timeout) from a rejected token (401).
		return t, fmt.Errorf("token refresh request failed: %w", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		slog.Warn("[diag refresh] GetUserTokenInfo FAILED", "endpoint", cnsiGUID, "user", userGUID, "error", err)
		return t, fmt.Errorf("could not get user token info from access token")
	}

	u.UserGUID = userGUID

	// RFC 6749 §4.3.3 permits a token response WITHOUT a refresh_token; the
	// previously issued refresh token then remains valid and the client must
	// keep using it. An empty refresh token here must NOT clobber the live
	// stored one — only the rejected-token disposal write above writes an
	// intentionally empty refresh token (UpdateTokenAuth is empty-tolerant
	// for exactly that write, so this keep is the success path's guard).
	refreshToken := uaaRes.RefreshToken
	if refreshToken == "" {
		refreshToken = userToken.RefreshToken
	}

	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, refreshToken, userToken.Disconnected)
	tokenRecord.TokenGUID = userToken.TokenGUID
	err = p.updateTokenAuth(userGUID, tokenRecord)
	if err != nil {
		slog.Warn("[diag refresh] DB update FAILED", "endpoint", cnsiGUID, "user", userGUID, "error", err)
		return t, fmt.Errorf("couldn't update token: %v", err)
	}

	slog.Info("[diag refresh] UAA OK",
		"endpoint", cnsiGUID, "user", userGUID, "newExpiry", tokenRecord.TokenExpiry,
		"hasNewRefresh", tokenRecord.RefreshToken != "")
	return tokenRecord, nil
}
