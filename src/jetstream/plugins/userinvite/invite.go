package userinvite

import (
	// "encoding/json"
	"errors"
	"fmt"
	// "io/ioutil"
	"net/http"
	// "net/url"
	// "strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// Send an invite
func (invite *UserInvite) invite(c echo.Context) error {
	log.Debug("Invite User")
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
		// Not configured
		return errors.New("User Invite not available")
	}

	log.Info(response)
	log.Info(token)

	// Email addresses are in request body in the same format required by the API

	authEndpoint := "NONE"
	// Make request to the UAA to invite the users
	req, err := http.NewRequest("POST", authEndpoint, nil)
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	client := invite.portalProxy.GetHttpClientForRequest(req, endpoint.SkipSSLValidation)
	res, err := client.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		log.Warnf("%v+", err)
		return interfaces.LogHTTPError(res, err)
	}

	// Send back the response to the client
	c.Response().Header().Set("Content-Type", "application/json")
	//c.Response().Write

	//res.Body

	// c.Response().Write(jsonString)
	return nil
}
