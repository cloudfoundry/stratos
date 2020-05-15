package cfapppush

import (
	"time"

	"code.cloudfoundry.org/cli/api/cloudcontroller"
	"code.cloudfoundry.org/cli/command"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// PushConnectionWrapper can wrap a given connection allowing the wrapper to modify
// all requests going in and out of the given connection.
type PushConnectionWrapper struct {
	inner       cloudcontroller.Connection
	portalProxy interfaces.PortalProxy
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
	// Check to see if the token is about to expire, if it is, refresh it first
	token, found := cw.portalProxy.GetCNSITokenRecord(cw.config.EndpointID, cw.config.UserID)
	if found {
		// Aways update the access token, in case someone else refreshed it
		cw.config.AuthToken = token.AuthToken

		// Check if this is about to expire in the next 30 seconds
		expiry := token.TokenExpiry - 30
		expTime := time.Unix(expiry, 0)
		if expTime.Before(time.Now()) {
			cnsiRecord, err := cw.portalProxy.GetCNSIRecord(cw.config.EndpointID)
			if err == nil {
				// Refresh token first - makes sure it will be valid when we do the push
				refreshedTokenRec, err := cw.portalProxy.RefreshOAuthToken(cnsiRecord.SkipSSLValidation, cnsiRecord.GUID, cw.config.UserID, cnsiRecord.ClientId, cnsiRecord.ClientSecret, cnsiRecord.TokenEndpoint)
				if err == nil {
					cw.config.AuthToken = refreshedTokenRec.AuthToken
				}
			}
		}
	}

	cw.cmdConfig.SetAccessToken("bearer " + cw.config.AuthToken)

	return cw.inner.Make(request, passedResponse)
}
