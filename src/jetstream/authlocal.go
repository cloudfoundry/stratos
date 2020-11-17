package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
)

//More fields will be moved into here as global portalProxy struct is phased out
type localAuth struct {
	databaseConnectionPool *sql.DB
	localUserScope         string
	consoleAdminScope      string
	p                      *portalProxy
}

func (a *localAuth) ShowConfig(config *interfaces.ConsoleConfig) {
	log.Infof("... Local User              : %s", config.LocalUser)
	log.Infof("... Local User Scope        : %s", config.LocalUserScope)
}

//Login provides Local-auth specific Stratos login
func (a *localAuth) Login(c echo.Context) error {

	//This check will remain in until auth is factored down into its own package
	if interfaces.AuthEndpointTypes[a.p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Local {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Local Login is not enabled",
			"Local Login is not enabled")
		return err
	}

	//Perform the login and fetch session values if successful
	userGUID, username, err := a.localLogin(c)

	if err != nil {
		//Login failed, return response.
		errMessage := err.Error()
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"Login failed: %v", err)
		return err
	}

	err = a.generateLoginSuccessResponse(c, userGUID, username)

	return err
}

//Logout provides Local-auth specific Stratos login
func (a *localAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

//GetUsername gets the user name for the specified local user
func (a *localAuth) GetUsername(userid string) (string, error) {
	log.Debug("GetUsername")

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return "", err
	}

	localUser, err := localUsersRepo.FindUser(userid)
	if err != nil {
		log.Errorf("Error fetching username for local user %s: %v", userid, err)
		return "", err
	}

	return localUser.Username, nil
}

//GetUser gets the user guid for the specified local user
func (a *localAuth) GetUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("GetUser")

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return nil, err
	}

	user, err := localUsersRepo.FindUser(userGUID)
	if err != nil {
		return nil, err
	}

	uaaAdmin := (user.Scope == a.p.Config.ConsoleConfig.ConsoleAdminScope)

	var scopes []string
	scopes = make([]string, 3)
	scopes[0] = user.Scope
	scopes[1] = "password.write"
	scopes[2] = "scim.write"

	connectdUser := &interfaces.ConnectedUser{
		GUID:   userGUID,
		Name:   user.Username,
		Admin:  uaaAdmin,
		Scopes: scopes,
	}

	return connectdUser, nil
}

func (a *localAuth) BeforeVerifySession(c echo.Context) {}

//VerifySession verifies the session the specified local user, currently just verifies user exists
func (a *localAuth) VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return err
	}

	_, err = localUsersRepo.FindPasswordHash(sessionUser)
	return err
}

//localLogin verifies local user credentials against our DB
func (a *localAuth) localLogin(c echo.Context) (string, string, error) {
	log.Debug("doLocalLogin")

	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return "", username, errors.New("Needs usernameand password")
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return "", username, err
	}

	var scopeOK bool
	var hash []byte
	var authError error
	var localUserScope string

	// Get the GUID for the specified user
	guid, err := localUsersRepo.FindUserGUID(username)
	if err != nil {
		return guid, username, fmt.Errorf("Access Denied - Invalid username/password credentials")
	}

	//Attempt to find the password has for the given user
	if hash, authError = localUsersRepo.FindPasswordHash(guid); authError != nil {
		authError = fmt.Errorf("Access Denied - Invalid username/password credentials")
		//Check the password hash
	} else if authError = crypto.CheckPasswordHash(password, hash); authError != nil {
		authError = fmt.Errorf("Access Denied - Invalid username/password credentials")
	} else {
		//Ensure the local user has some kind of admin role configured and we check for it here
		localUserScope, authError = localUsersRepo.FindUserScope(guid)
		scopeOK = strings.Contains(localUserScope, a.localUserScope)
		if (authError != nil) || (!scopeOK) {
			authError = fmt.Errorf("Access Denied - User scope invalid")
		} else {
			//Update the last login time here if login was successful
			loginTime := time.Now()
			if updateLoginTimeErr := localUsersRepo.UpdateLastLoginTime(guid, loginTime); updateLoginTimeErr != nil {
				log.Error(updateLoginTimeErr)
				log.Errorf("Failed to update last login time for user: %s", guid)
			}
		}
	}
	return guid, username, authError
}

//generateLoginSuccessResponse
func (a *localAuth) generateLoginSuccessResponse(c echo.Context, userGUID string, username string) error {
	log.Debug("generateLoginResponse")

	var err error
	var expiry int64
	expiry = math.MaxInt64

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = userGUID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = a.p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	//Makes sure the client gets the right session expiry time
	if err = a.p.handleSessionExpiryHeader(c); err != nil {
		return err
	}

	resp := &interfaces.LoginRes{
		Account:     username,
		TokenExpiry: expiry,
		APIEndpoint: nil,
		Admin:       true,
	}

	if jsonString, err := json.Marshal(resp); err == nil {
		// Add XSRF Token
		a.p.ensureXSRFToken(c)
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return err
}

//logout
func (a *localAuth) logout(c echo.Context) error {
	log.Debug("logout")

	a.p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	a.p.unsetSessionValue(c, XSRFTokenSessionName)

	err := a.p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: a.p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}
