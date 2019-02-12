package userinvite

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// CFError is the error info returned from the CF API
type CFError struct {
	Description string `json:"description"`
	ErrorCode   string `json:"error_code"`
	Code        int    `json:"code"`
}

// UserInviteReq is the payload that is POSTed to request user invites to be generated
type UserInviteReq struct {
	Org        string `json:"org"`
	Space      string `json:"space"`
	SpaceRoles struct {
		Auditor   bool `json:"auditor"`
		Developer bool `json:"developer"`
		Manager   bool `json:"manager"`
	} `json:"spaceRoles"`
	Emails []string `json:"emails"`
}

type UAAUserInviteReq struct {
	Emails []string `json:"emails"`
}

type UserInviteUser struct {
	Email        string `json:"email"`
	UserID       string `json:"userid"`
	Success      bool   `json:"success"`
	ErrorCode    string `json:"errorCode"`
	ErrorMessage string `json:"errorMessage"`
	InviteLink   string `json:"inviteLink"`
}

type UserInviteResponse struct {
	NewInvites    []UserInviteUser `json:"new_invites"`
	FailedInvites []UserInviteUser `json:"failed_invites"`
}

// Send an invite
func (invite *UserInvite) invite(c echo.Context) error {
	log.Debug("Invite User")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return interfaces.NewHTTPError(http.StatusServiceUnavailable, "Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return interfaces.NewHTTPError(http.StatusServiceUnavailable, "Not a Cloud Foundry endpoint")
	}

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	userInviteRequest := &UserInviteReq{}
	err = json.Unmarshal(body, userInviteRequest)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}

	// Check we have at least one email address
	if len(userInviteRequest.Emails) == 0 {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - no email addresses provided")
	}

	// TODO: Quick validation of email addresses

	// TODO: Check user has correct permissions before making the call to the UAA

	inviteResponse, err := invite.processUserInvites(c, endpoint, userInviteRequest)
	if err != nil {
		return err
	}

	// Send back the response to the client
	jsonString, err := json.Marshal(inviteResponse)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusInternalServerError, "Failed to serialize response")
	}
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (invite *UserInvite) processUserInvites(c echo.Context, endpoint interfaces.CNSIRecord, userInviteRequest *UserInviteReq) (*UserInviteResponse, error) {
	cfGUID := c.Param("id")
	userGUID := c.Get("user_id").(string)

	// Make request to UAA to create users and invite links
	inviteResponse, err := invite.UAAUserInvite(c, endpoint, userInviteRequest)
	if err != nil {
		return nil, err
	}

	// Loop through each user and:
	// - Create a user in Cloud Foundry for them
	// - Add them to the org
	// - Assign Space roles (if requested)
	newInvites := make([]UserInviteUser, 0)
	failedInvites := inviteResponse.FailedInvites

	for _, user := range inviteResponse.NewInvites {
		userErr, err := invite.processUserInvite(cfGUID, userGUID, userInviteRequest, user, endpoint)
		if err == true {
			failedInvites = append(failedInvites, userErr)
		} else {
			newInvites = append(newInvites, user)
		}
	}

	inviteResponse.NewInvites = newInvites
	inviteResponse.FailedInvites = failedInvites
	return inviteResponse, nil
}

func (invite *UserInvite) processUserInvite(cfGUID, userGUID string, userInviteRequest *UserInviteReq, user UserInviteUser, endpoint interfaces.CNSIRecord) (UserInviteUser, bool) {
	log.Debugf("Creating CF User for: %s", user.Email)
	// Create the user in Cloud Foundry
	cfError, err := invite.CreateCloudFoundryUser(cfGUID, userGUID, user.UserID)
	if err != nil {
		return updateUserInviteRecordForError(user, "Failed to create user in Cloud Foundry", cfError), true
	} else {
		// User created - add the user to org
		cfError, err = invite.AssociateUserWithOrg(cfGUID, userGUID, user.UserID, userInviteRequest.Org)
		if err != nil {
			return updateUserInviteRecordForError(user, "Failed to associate user with Org", cfError), true
		} else {
			// Finally, add the user to the space, if one was specified
			if len(userInviteRequest.Space) > 0 {
				cfError, err = invite.AssociateSpaceRoles(cfGUID, userGUID, user.UserID, userInviteRequest)
				if err != nil {
					return updateUserInviteRecordForError(user, "Failed to associate user with Org", cfError), true
				}
			}
			if err == nil {
				// Send the email
				err = invite.SendEmail(user.Email, user.InviteLink, endpoint)
				if err != nil {
					user.Success = false
					user.ErrorMessage = err.Error()
					user.ErrorCode = "Stratos-EmailSendFailure"
					return user, true
				}
			}
		}
	}
	return UserInviteUser{}, false
}

// UAAUserInvite makes the request to the UAA to create accounts and invite links
func (invite *UserInvite) UAAUserInvite(c echo.Context, endpoint interfaces.CNSIRecord, uaaInviteReq *UserInviteReq) (*UserInviteResponse, error) {
	log.Debug("Requesting invite links from UAA")

	// See if we can get a token for the invite user
	token, ok := invite.portalProxy.GetCNSITokenRecord(endpoint.GUID, UserInviteUserID)
	if !ok {
		// Not configured
		return nil, interfaces.NewHTTPError(http.StatusServiceUnavailable, "User Invite not available")
	}

	client := strings.Split(token.RefreshToken, ":")
	if len(client) != 2 {
		return nil, interfaces.NewHTTPError(http.StatusBadRequest, "Invalid client ID and client Secret configuration")
	}

	returnURL := getReturnURL(c)

	// Make a request to the UAA for the Cloud Foundry to generate the User Invite links
	inviteURL := fmt.Sprintf("%s/invite_users?client_id=%s&redirect_uri=%s", endpoint.AuthorizationEndpoint, client[0], url.QueryEscape(returnURL))

	// Refresh the token if it is about to expiry
	expTime := time.Unix(token.TokenExpiry, 0)
	expTime = expTime.Add(time.Second * -10)
	if expTime.Before(time.Now()) {
		_, _, err := invite.RefreshToken(endpoint.GUID, client[0], client[1])
		if err != nil {
			return nil, err
		}
		token, ok = invite.portalProxy.GetCNSITokenRecord(endpoint.GUID, UserInviteUserID)
		if !ok {
			return nil, interfaces.NewHTTPError(http.StatusServiceUnavailable, "User Invite not available - could not get token after refresh")
		}
	}

	uaaReq := &UAAUserInviteReq{}
	uaaReq.Emails = uaaInviteReq.Emails
	uaaReqJSON, err := json.Marshal(uaaReq)
	if err != nil {
		return nil, interfaces.NewHTTPError(http.StatusInternalServerError, "Failed to serialize email")
	}

	// Make request to the UAA to invite the users
	req, err := http.NewRequest("POST", inviteURL, bytes.NewReader(uaaReqJSON))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "bearer "+token.AuthToken)
	req.Header.Set("Accept", "application/json")

	httpClient := invite.portalProxy.GetHttpClientForRequest(req, endpoint.SkipSSLValidation)
	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, interfaces.LogHTTPError(res, err)
	}

	// Read the response
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to request user invite links",
			"Failed to request user invite links: %v+",
			err,
		)
	}

	inviteResponse := &UserInviteResponse{}
	err = json.Unmarshal(body, inviteResponse)
	if err != nil {
		return nil, interfaces.NewHTTPError(http.StatusInternalServerError, "Failed to request invites for users")
	}

	return inviteResponse, nil
}

// CreateCloudFoundryUser will make the CF API call to create the user in CF
func (invite *UserInvite) CreateCloudFoundryUser(cnsiGUID, userID, newUserGUID string) (*CFError, error) {
	body := fmt.Sprintf("{\"guid\": \"%s\"}", newUserGUID)
	headers := make(http.Header, 0)
	headers.Set("Content-Type", "application/json")

	// Need to make the request as the privileged user, not the requesting user - cloud_controller.admin scope required
	res, err := invite.portalProxy.DoProxySingleRequest(cnsiGUID, UserInviteUserID, "POST", "/v2/users", headers, []byte(body))
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusCreated {
		cfError := parseCFError(res.Response)
		if cfError != nil && cfError.ErrorCode == "CF-UaaIdTaken" {
			log.Debug("CF User already created")
			return nil, nil
		}
		return parseCFError(res.Response), errors.New("Failed to create user in Cloud Foundry")
	}

	return nil, nil
}

// AssociateUserWithOrg will make the CF API call to associate the given user with the given ord
func (invite *UserInvite) AssociateUserWithOrg(cnsiGUID, userID, newUserGUID, orgGUID string) (*CFError, error) {
	url := fmt.Sprintf("/v2/organizations/%s/users/%s", orgGUID, newUserGUID)
	res, err := invite.portalProxy.DoProxySingleRequest(cnsiGUID, userID, "PUT", url, nil, nil)
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusCreated {
		return parseCFError(res.Response), errors.New("Failed to associate user with Org")
	}

	return nil, nil
}

// AssociateSpaceRoles will make the CF API call to associate the correct space roles for the user
func (invite *UserInvite) AssociateSpaceRoles(cnsiGUID, userID, newUserGUID string, inviteRequest *UserInviteReq) (*CFError, error) {
	if inviteRequest.SpaceRoles.Auditor {
		cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "auditors")
		if err != nil {
			return cfError, err
		}
	}

	if inviteRequest.SpaceRoles.Manager {
		cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "managers")
		if err != nil {
			return cfError, err
		}
	}

	if inviteRequest.SpaceRoles.Developer {
		cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "developers")
		if err != nil {
			return cfError, err
		}
	}

	return nil, nil
}

// AssociateSpaceRoleForUser associates a user in the space with the given role
func (invite *UserInvite) AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, spaceGUID, roleName string) (*CFError, error) {
	url := fmt.Sprintf("/v2/spaces/%s/%s/%s", spaceGUID, roleName, newUserGUID)
	res, err := invite.portalProxy.DoProxySingleRequest(cnsiGUID, userID, "PUT", url, nil, nil)
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusCreated {
		return parseCFError(res.Response), fmt.Errorf(fmt.Sprintf("Failed to associate user with Space Role (%s)", roleName))
	}

	return nil, nil
}

func parseCFError(response []byte) *CFError {
	cfError := &CFError{}
	err := json.Unmarshal(response, cfError)
	if err != nil {
		return nil
	}
	return cfError
}

func updateUserInviteRecordForError(user UserInviteUser, msg string, cfError *CFError) UserInviteUser {
	user.Success = false
	user.ErrorMessage = msg
	if cfError != nil {
		user.ErrorCode = cfError.ErrorCode
		user.ErrorMessage = user.ErrorMessage + " - " + cfError.Description
	}
	return user
}

func getReturnURL(c echo.Context) string {
	// Return URL is base URL of the request
	returnURL := c.Request().Header.Get("origin")
	if len(returnURL) == 0 {
		if c.Request().TLS != nil {
			returnURL = fmt.Sprintf("https://%s", c.Request().Host)
		} else {
			returnURL = fmt.Sprintf("http://%s", c.Request().Host)
		}
	}
	return returnURL
}
