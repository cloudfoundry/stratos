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

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// CFError is the error info returned from the CF API
type CFError struct {
	Description string `json:"description"`
	ErrorCode   string `json:"error_code"`
	Code        int    `json:"code"`
}

// RetrieveOrgRolesResponse is the response from the CF GET Org Roles API
type RetrieveOrgRolesResponse struct {
	TotalResults int                `json:"total_results"`
	Resources    []OrgRolesResponse `json:"resources"`
}

type OrgRolesResponse struct {
	Metadata struct {
		GUID string `json:"guid"`
	} `json:"metadata"`
	Entity struct {
		OrgRoles []string `json:"organization_roles"`
	} `json:"entity"`
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

// UAAUserInviteReq is the structure to send to the UAA Invite Users API
type UAAUserInviteReq struct {
	Emails []string `json:"emails"`
}

// UserInviteUser is the individual response from the UAA Invite Users API
type UserInviteUser struct {
	Email        string `json:"email"`
	UserID       string `json:"userid"`
	Success      bool   `json:"success"`
	ErrorCode    string `json:"errorCode"`
	ErrorMessage string `json:"errorMessage"`
	InviteLink   string `json:"inviteLink"`
}

// UserInviteResponse is the response from the UAA Invite Users API
type UserInviteResponse struct {
	NewInvites    []UserInviteUser `json:"new_invites"`
	FailedInvites []UserInviteUser `json:"failed_invites"`
}

const orgManagerRoleName = "org_manager"

// Send an invite
func (invite *UserInvite) invite(c echo.Context) error {
	log.Debug("Invite User")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return api.NewHTTPError(http.StatusServiceUnavailable, "Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return api.NewHTTPError(http.StatusServiceUnavailable, "Not a Cloud Foundry endpoint")
	}

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return api.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	userInviteRequest := &UserInviteReq{}
	if err = json.Unmarshal(body, userInviteRequest); err != nil {
		return api.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}

	// Check we have at least one email address
	if len(userInviteRequest.Emails) == 0 {
		return api.NewHTTPError(http.StatusBadRequest, "Invalid request body - no email addresses provided")
	}

	// Must provide an Orgs
	if len(userInviteRequest.Org) == 0 {
		return api.NewHTTPError(http.StatusBadRequest, "Invalid request body - no org provided")
	}

	// Check user has correct permissions before making the call to the UAA
	if err = invite.checkPermissions(c, endpoint, userInviteRequest); err != nil {
		return api.NewHTTPError(http.StatusUnauthorized, "You are not authorized to invite users")
	}

	inviteResponse, err := invite.processUserInvites(c, endpoint, userInviteRequest)
	if err != nil {
		return err
	}

	// Send back the response to the client
	jsonString, err := json.Marshal(inviteResponse)
	if err != nil {
		return api.NewHTTPError(http.StatusInternalServerError, "Failed to serialize response")
	}
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (invite *UserInvite) processUserInvites(c echo.Context, endpoint api.CNSIRecord, userInviteRequest *UserInviteReq) (*UserInviteResponse, error) {
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

func (invite *UserInvite) processUserInvite(cfGUID, userGUID string, userInviteRequest *UserInviteReq, user UserInviteUser, endpoint api.CNSIRecord) (UserInviteUser, bool) {
	log.Debugf("Creating CF User for: %s", user.Email)
	// Create the user in Cloud Foundry
	if cfError, err := invite.CreateCloudFoundryUser(cfGUID, userGUID, user.UserID); err != nil {
		return updateUserInviteRecordForError(user, "Failed to create user in Cloud Foundry", cfError), true
	}

	// User created - add the user to org
	cfError, err := invite.AssociateUserWithOrg(cfGUID, userGUID, user.UserID, userInviteRequest.Org)
	if cfError, err := invite.AssociateUserWithOrg(cfGUID, userGUID, user.UserID, userInviteRequest.Org); err != nil {
		return updateUserInviteRecordForError(user, "Failed to associate user with Org", cfError), true
	}

	// Finally, add the user to the space, if one was specified
	if len(userInviteRequest.Space) > 0 {
		cfError, err = invite.AssociateSpaceRoles(cfGUID, userGUID, user.UserID, userInviteRequest)
		if err != nil {
			return updateUserInviteRecordForError(user, "Failed to associate user with Org", cfError), true
		}
	}
	if err == nil {
		// Send the email
		if err = invite.SendEmail(user.Email, user.InviteLink, endpoint); err != nil {
			user.Success = false
			user.ErrorMessage = "Unable to send invitation email to user"
			log.Warnf("Could not send user invite email: %v", err)
			user.ErrorCode = "Stratos-EmailSendFailure"
			return user, true
		}
	}
	return UserInviteUser{}, false
}

// UAAUserInvite makes the request to the UAA to create accounts and invite links
func (invite *UserInvite) UAAUserInvite(c echo.Context, endpoint api.CNSIRecord, uaaInviteReq *UserInviteReq) (*UserInviteResponse, error) {
	log.Debug("Requesting invite links from UAA")

	// See if we can get a token for the invite user
	token, ok := invite.portalProxy.GetCNSITokenRecord(endpoint.GUID, UserInviteUserID)
	if !ok {
		// Not configured
		return nil, api.NewHTTPError(http.StatusServiceUnavailable, "User Invite not available")
	}

	client := strings.Split(token.RefreshToken, ":")
	if len(client) != 2 {
		return nil, api.NewHTTPError(http.StatusBadRequest, "Invalid client ID and client Secret configuration")
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
			return nil, api.NewHTTPError(http.StatusServiceUnavailable, "User Invite not available - could not get token after refresh")
		}
	}

	uaaReq := &UAAUserInviteReq{}
	uaaReq.Emails = uaaInviteReq.Emails
	uaaReqJSON, err := json.Marshal(uaaReq)
	if err != nil {
		return nil, api.NewHTTPError(http.StatusInternalServerError, "Failed to serialize email")
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

	httpClient := invite.portalProxy.GetHttpClientForRequest(req, endpoint.SkipSSLValidation, endpoint.CACert)
	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, api.LogHTTPError(res, err)
	}

	// Read the response
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, api.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to request user invite links",
			"Failed to request user invite links: %+v",
			err,
		)
	}

	inviteResponse := &UserInviteResponse{}
	if err = json.Unmarshal(body, inviteResponse); err != nil {
		return nil, api.NewHTTPError(http.StatusInternalServerError, "Failed to request invites for users")
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

// AssociateUserWithOrg will make the CF API call to associate the given user with the given org
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
		if cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "auditors"); err != nil {
			return cfError, err
		}
	}

	if inviteRequest.SpaceRoles.Manager {
		if cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "managers"); err != nil {
			return cfError, err
		}
	}

	if inviteRequest.SpaceRoles.Developer {
		if cfError, err := invite.AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, inviteRequest.Space, "developers"); err != nil {
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
	if err := json.Unmarshal(response, cfError); err != nil {
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

// Check that the user has permissions required - i.e. is an Org Manager of the Org
func (invite *UserInvite) checkPermissions(c echo.Context, endpoint api.CNSIRecord, userInviteRequest *UserInviteReq) error {
	cfGUID := c.Param("id")
	userGUID := c.Get("user_id").(string)

	// Get the User information for the endpoint connection
	cfUser, ok := invite.portalProxy.GetCNSIUser(cfGUID, userGUID)
	if !ok {
		return errors.New("Can not find endpoint user")
	}

	if cfUser.Admin {
		// Admins can always invite users
		return nil
	}

	// User needs to be an admin or an Org Manager
	// Get the org name - if the user does not have access to the org, this API call won't succeed
	url := fmt.Sprintf("/v2/organizations/%s/user_roles?q=user_guid:%s", userInviteRequest.Org, cfUser.GUID)
	res, err := invite.portalProxy.DoProxySingleRequest(cfGUID, userGUID, "GET", url, nil, nil)
	if err != nil {
		return errors.New("Could not get user's roles in org")
	}

	orgResponse := RetrieveOrgRolesResponse{}
	if err = json.Unmarshal(res.Response, &orgResponse); err != nil {
		return errors.New("Could not decode response while trying to determine user's org roles")
	}

	if orgResponse.TotalResults != 1 {
		return errors.New("Too many results returned while trying to determine org roles for the user")
	}

	orgRoles := orgResponse.Resources[0]
	isOrgManager := arrayContainsString(orgRoles.Entity.OrgRoles, orgManagerRoleName)
	if !isOrgManager {
		return errors.New("User is not an org manager")
	}

	return nil
}
