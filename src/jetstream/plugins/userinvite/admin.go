package userinvite

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
)

type StatusResponse struct {
	EndpointGUID string `json:"endpoint_guid"`
	Enabled      bool   `json:"enabled"`
	ClientID     string `json:"client_id"`
}

const wwwAuthHeader = "www-authenticate"
const scimInviteScope = "scim.invite"
const cloudControllerAdminScope = "cloud_controller.admin"

// Admin functions for managing User Invite credentials for a given Cloud Foundry

func (invite *UserInvite) status(c echo.Context) error {
	log.Debug("Invite Status")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return errors.New("Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return errors.New("Not a Cloud Foundry endpoint")
	}

	response := &StatusResponse{
		EndpointGUID: cfGUID,
		Enabled:      false,
	}

	// See if we can get a token for the invite user
	token, ok := invite.portalProxy.GetCNSITokenRecord(cfGUID, UserInviteUserID)
	if !ok {
		response.Enabled = true
		// AuthToken is clientID:clientSecret
		clientDetails := strings.Split(token.AuthToken, ":")
		response.ClientID = clientDetails[0]
	}

	jsonString, err := json.Marshal(response)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

// Configure
func (invite *UserInvite) configure(c echo.Context) error {
	log.Debug("Configure Invite token")
	cfGUID := c.Param("id")

	clientID := c.FormValue("client_id")
	clientSecret := c.FormValue("client_secret")

	if len(clientID) == 0 || len(clientSecret) == 0 {
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Invalid request - must specify client ID and client secret",
			"Invalid request - must specify client ID and client secret",
		)
	}

	uaaRecord, _, err := invite.RefreshToken(cfGUID, clientID, clientSecret)
	if err != nil {
		return err
	}

	// Check the required scopes are present
	scopes := strings.Split(uaaRecord.Scope, " ")
	if !arrayContainsString(scopes, scimInviteScope) || !arrayContainsString(scopes, cloudControllerAdminScope) {
		// Doesn't have the scopes needed
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Specified Client does not have the required scopes",
			"Specified Client does not have the required scopes",
		)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"status\": \"ok\"}"))
	return nil
}

// arrayContainsString checks the string array to see if it contains the specifed value
func arrayContainsString(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}
	return false
}

func (invite *UserInvite) remove(c echo.Context) error {
	log.Debug("Delete Invite token")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return errors.New("Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return errors.New("Not a Cloud Foundry endpoint")
	}

	err = invite.portalProxy.DeleteEndpointToken(cfGUID, UserInviteUserID)
	if err != nil {
		return errors.New("Umable to delete user invite token")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"status\": \"ok\"}"))
	return nil
}
