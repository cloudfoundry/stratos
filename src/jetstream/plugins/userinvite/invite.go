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

// CFError is the user-facing error info, populated from a CF v3 error envelope.
type CFError struct {
	Description string `json:"description"`
	ErrorCode   string `json:"error_code"`
	Code        int    `json:"code"`
}

// v3ErrorDetail mirrors the per-error entry in a CF v3 error envelope.
type v3ErrorDetail struct {
	Detail string `json:"detail"`
	Title  string `json:"title"`
	Code   int    `json:"code"`
}

// v3ErrorEnvelope is the top-level CF v3 error shape: {errors: [...]}.
type v3ErrorEnvelope struct {
	Errors []v3ErrorDetail `json:"errors"`
}

// v3RoleResource is the minimal role shape needed for the org-manager check.
type v3RoleResource struct {
	GUID string `json:"guid"`
	Type string `json:"type"`
}

// v3RolesResponse is the paged list response from GET /v3/roles.
type v3RolesResponse struct {
	Resources []v3RoleResource `json:"resources"`
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

// orgManagerRoleName is the CF v3 role type for an Org Manager.
const orgManagerRoleName = "organization_manager"

// v2ToV3SpaceRole maps the legacy v2 space-role plural names accepted by
// AssociateSpaceRoleForUser callers to v3 role types.
var v2ToV3SpaceRole = map[string]string{
	"auditors":   "space_auditor",
	"managers":   "space_manager",
	"developers": "space_developer",
}

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
	if err != nil {
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

// CreateCloudFoundryUser creates a CF user via POST /v3/users. A 422 response
// whose error envelope indicates the user already exists is treated as success
// (idempotent re-invite).
func (invite *UserInvite) CreateCloudFoundryUser(cnsiGUID, userID, newUserGUID string) (*CFError, error) {
	body := fmt.Sprintf(`{"guid": "%s"}`, newUserGUID)
	headers := make(http.Header, 0)
	headers.Set("Content-Type", "application/json")

	// Need to make the request as the privileged user, not the requesting user - cloud_controller.admin scope required
	res, err := invite.proxy().DoProxySingleRequest(cnsiGUID, UserInviteUserID, "POST", "/v3/users", headers, []byte(body))
	if err != nil {
		return nil, err
	}

	if res.StatusCode == http.StatusCreated {
		return nil, nil
	}

	cfError := parseCFError(res.Response)
	if res.StatusCode == http.StatusUnprocessableEntity && isAlreadyExistsError(cfError) {
		log.Debug("CF User already created")
		return nil, nil
	}
	return cfError, errors.New("Failed to create user in Cloud Foundry")
}

// AssociateUserWithOrg assigns the organization_user role via POST /v3/roles.
// A 422 response whose error envelope indicates the role already exists is
// treated as success.
func (invite *UserInvite) AssociateUserWithOrg(cnsiGUID, userID, newUserGUID, orgGUID string) (*CFError, error) {
	body := buildOrgRoleBody("organization_user", newUserGUID, orgGUID)
	res, err := invite.proxy().DoProxySingleRequest(cnsiGUID, userID, "POST", "/v3/roles", jsonHeaders(), body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode == http.StatusCreated {
		return nil, nil
	}

	cfError := parseCFError(res.Response)
	if res.StatusCode == http.StatusUnprocessableEntity && isAlreadyExistsError(cfError) {
		log.Debug("CF user already in org")
		return nil, nil
	}
	return cfError, errors.New("Failed to associate user with Org")
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

// AssociateSpaceRoleForUser assigns a v3 space_<role> via POST /v3/roles. The
// roleName argument accepts the legacy v2 plural form ("auditors",
// "managers", "developers") and is mapped to the v3 role type. A 422 response
// whose error envelope indicates the role already exists is treated as success.
func (invite *UserInvite) AssociateSpaceRoleForUser(cnsiGUID, userID, newUserGUID, spaceGUID, roleName string) (*CFError, error) {
	v3Role, ok := v2ToV3SpaceRole[roleName]
	if !ok {
		return nil, fmt.Errorf("Unknown space role: %s", roleName)
	}
	body := buildSpaceRoleBody(v3Role, newUserGUID, spaceGUID)
	res, err := invite.proxy().DoProxySingleRequest(cnsiGUID, userID, "POST", "/v3/roles", jsonHeaders(), body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode == http.StatusCreated {
		return nil, nil
	}

	cfError := parseCFError(res.Response)
	if res.StatusCode == http.StatusUnprocessableEntity && isAlreadyExistsError(cfError) {
		log.Debugf("CF user already has space role %s", v3Role)
		return nil, nil
	}
	return cfError, fmt.Errorf("Failed to associate user with Space Role (%s)", roleName)
}

func jsonHeaders() http.Header {
	h := make(http.Header, 1)
	h.Set("Content-Type", "application/json")
	return h
}

// buildOrgRoleBody builds the v3 POST /v3/roles body for an organization role.
func buildOrgRoleBody(roleType, userGUID, orgGUID string) []byte {
	return []byte(fmt.Sprintf(
		`{"type":"%s","relationships":{"user":{"data":{"guid":"%s"}},"organization":{"data":{"guid":"%s"}}}}`,
		roleType, userGUID, orgGUID,
	))
}

// buildSpaceRoleBody builds the v3 POST /v3/roles body for a space role.
func buildSpaceRoleBody(roleType, userGUID, spaceGUID string) []byte {
	return []byte(fmt.Sprintf(
		`{"type":"%s","relationships":{"user":{"data":{"guid":"%s"}},"space":{"data":{"guid":"%s"}}}}`,
		roleType, userGUID, spaceGUID,
	))
}

// parseCFError unmarshals a CF v3 error envelope and projects the first
// detail into the user-facing CFError shape consumed by the invite UI.
func parseCFError(response []byte) *CFError {
	env := &v3ErrorEnvelope{}
	if err := json.Unmarshal(response, env); err != nil || len(env.Errors) == 0 {
		return nil
	}
	first := env.Errors[0]
	return &CFError{
		Description: first.Detail,
		ErrorCode:   first.Title,
		Code:        first.Code,
	}
}

// isAlreadyExistsError reports whether a CF v3 error indicates the resource
// (user or role) already exists. Treat as a success signal for idempotent
// re-invites. Matches by v3 numeric code where known and falls back to a
// substring scan on title/detail for forward-compatibility.
func isAlreadyExistsError(cfError *CFError) bool {
	if cfError == nil {
		return false
	}
	// Known v3 codes: 10016 = UniquenessError (e.g. user GUID already taken,
	// duplicate role assignment).
	if cfError.Code == 10016 {
		return true
	}
	title := strings.ToLower(cfError.ErrorCode)
	desc := strings.ToLower(cfError.Description)
	if strings.Contains(title, "uniqueness") || strings.Contains(title, "uaaidtaken") {
		return true
	}
	if strings.Contains(desc, "already exists") || strings.Contains(desc, "already has") {
		return true
	}
	return false
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
	cfUser, ok := invite.proxy().GetCNSIUser(cfGUID, userGUID)
	if !ok {
		return errors.New("Can not find endpoint user")
	}

	if cfUser.Admin {
		// Admins can always invite users
		return nil
	}

	return invite.requireOrgManager(cfGUID, userGUID, userInviteRequest.Org, cfUser.GUID)
}

// requireOrgManager returns nil iff cfUserGUID has the organization_manager
// role in orgGUID. Filters by org+user GUID server-side via GET /v3/roles.
func (invite *UserInvite) requireOrgManager(cnsiGUID, requestingUserGUID, orgGUID, cfUserGUID string) error {
	url := fmt.Sprintf("/v3/roles?organization_guids=%s&user_guids=%s", orgGUID, cfUserGUID)
	res, err := invite.proxy().DoProxySingleRequest(cnsiGUID, requestingUserGUID, "GET", url, nil, nil)
	if err != nil {
		return errors.New("Could not get user's roles in org")
	}
	if res.StatusCode != http.StatusOK {
		return errors.New("Could not get user's roles in org")
	}

	roles := v3RolesResponse{}
	if err = json.Unmarshal(res.Response, &roles); err != nil {
		return errors.New("Could not decode response while trying to determine user's org roles")
	}

	for _, r := range roles.Resources {
		if r.Type == orgManagerRoleName {
			return nil
		}
	}
	return errors.New("User is not an org manager")
}
