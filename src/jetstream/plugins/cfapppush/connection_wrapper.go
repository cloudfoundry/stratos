package cfapppush

import (
	"errors"
	"time"

	"code.cloudfoundry.org/cli/v8/api/cloudcontroller"
	"code.cloudfoundry.org/cli/v8/api/cloudcontroller/ccerror"
	"code.cloudfoundry.org/cli/v8/command"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	log "github.com/sirupsen/logrus"
)

// PushConnectionWrapper can wrap a given connection allowing the wrapper to modify
// all requests going in and out of the given connection.
type PushConnectionWrapper struct {
	inner       cloudcontroller.Connection
	portalProxy api.PortalProxy
	config      *CFPushAppConfig
	cmdConfig   command.Config
}

// Wrap an existing connection
func (cw PushConnectionWrapper) Wrap(innerconnection cloudcontroller.Connection) cloudcontroller.Connection {
	cw.inner = innerconnection
	return cw
}

// Make makes an HTTP request
func (cw PushConnectionWrapper) Make(request *cloudcontroller.Request, passedResponse *cloudcontroller.Response) error {
	// Proactively refresh the token if it is about to expire, so we don't start
	// a request with a token that's about to lapse.
	cw.ensureFreshToken()
	cw.cmdConfig.SetAccessToken("bearer " + cw.config.AuthToken)

	err := cw.inner.Make(request, passedResponse)

	// Reactive safety net: even after the proactive refresh, a token can still be
	// rejected at its expiry boundary — clock skew, or it lapsed mid-push during a
	// long-running request. On an invalid/expired-token error, force a refresh and
	// replay the request once. A replay needs the body rewound (ResetBody); a
	// streamed upload (non-seekable pipe) can't be rewound, so we surface the
	// original error in that case. We only retry InvalidAuthTokenError (a refresh
	// fixes it), not UnauthorizedError (a permissions problem a refresh won't fix).
	var invalidToken ccerror.InvalidAuthTokenError
	if errors.As(err, &invalidToken) && cw.forceRefreshToken() {
		if resetErr := request.ResetBody(); resetErr != nil {
			log.Warnf("cf push: cannot replay request after token refresh (body not seekable): %s", resetErr)
			return err
		}
		cw.cmdConfig.SetAccessToken("bearer " + cw.config.AuthToken)
		return cw.inner.Make(request, passedResponse)
	}

	return err
}

// ensureFreshToken refreshes the CF token when it is within 30 seconds of expiry.
// It always picks up the latest stored access token first, in case another
// request refreshed it concurrently.
func (cw PushConnectionWrapper) ensureFreshToken() {
	token, found := cw.portalProxy.GetCNSITokenRecord(cw.config.EndpointID, cw.config.UserID)
	if !found {
		return
	}
	cw.config.AuthToken = token.AuthToken

	// Refresh if it expires within the next 30 seconds.
	if time.Unix(token.TokenExpiry-30, 0).Before(time.Now()) {
		cw.forceRefreshToken()
	}
}

// forceRefreshToken unconditionally refreshes the CF OAuth token and updates the
// cached access token on the shared config. Returns true on success; on failure it
// logs and leaves the existing token in place.
func (cw PushConnectionWrapper) forceRefreshToken() bool {
	cnsiRecord, err := cw.portalProxy.GetCNSIRecord(cw.config.EndpointID)
	if err != nil {
		log.Warnf("cf push: could not load endpoint record to refresh token: %s", err)
		return false
	}
	refreshedTokenRec, err := cw.portalProxy.RefreshOAuthToken(cnsiRecord.SkipSSLValidation, cnsiRecord.GUID, cw.config.UserID, cnsiRecord.ClientId, cnsiRecord.ClientSecret, cnsiRecord.TokenEndpoint)
	if err != nil {
		log.Warnf("cf push: failed to refresh CF token: %s", err)
		return false
	}
	cw.config.AuthToken = refreshedTokenRec.AuthToken
	return true
}
