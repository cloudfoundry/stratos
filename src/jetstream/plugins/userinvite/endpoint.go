package userinvite

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"

	log "github.com/sirupsen/logrus"
)

// GetType - return empty string as we don't introduce a new enpoint type
func (invite *UserInvite) GetType() string {
	return ""
}

// Register is not implemented
func (invite *UserInvite) Register(echoContext echo.Context) error {
	return errors.New("Not implemented")
}

// Connect is not implemented
func (invite *UserInvite) Connect(echoContext echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	return nil, false, errors.New("Not implemented")
}

// Info is not implemented
func (invite *UserInvite) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	return interfaces.CNSIRecord{}, nil, errors.New("Not implemented")
}

func (invite *UserInvite) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return errors.New("Not implemented")
}

// UpdateMetadata will add metadata for each Cloud Foundry endpoint to indicate if user invitation is allowed
func (invite *UserInvite) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
	log.Debug("User Invite:: UpdateMetadata")
	endpoints, err := invite.portalProxy.ListEndpointsByUser(UserInviteUserID)
	if err == nil {
		// Update all of the Cloud Foundry endpoints that have an invite token set to indicate that user invitation is enabled
		if info.Endpoints["cf"] != nil {
			for guid, ep := range info.Endpoints["cf"] {
				log.Debugf("Checking endpoint: %s", guid)
				ep.Metadata["userInviteAllowed"] = hasInviteToken(endpoints, guid)
			}
		}
	}
}

func hasInviteToken(endpoints []*interfaces.ConnectedEndpoint, guid string) string {
	for _, ep := range endpoints {
		if ep.GUID == guid {
			return "true"
		}
	}
	return "false"
}
