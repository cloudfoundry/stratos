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

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
)

type localAuth struct {
	databaseConnectionPool *sql.DB
	localUserScope         string
	p                      *portalProxy
}

func (a *localAuth) Login(c echo.Context) error {
	return a.localLogin(c)
}

func (a *localAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

func (a *localAuth) localLogin(c echo.Context) error {
	log.Debug("localLogin")

	//Perform the login and fetch session values if successful
	userGUID, username, err := a.doLocalLogin(c)
	if err != nil {
		//Login failed, return response.
		errMessage := err.Error()
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"Login failed: %s: %v", errMessage, err)
		return err
	}

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

func (a *localAuth) doLocalLogin(c echo.Context) (string, string, error) {
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
		return guid, username, fmt.Errorf("Can not find user")
	}

	//Attempt to find the password has for the given user
	if hash, authError = localUsersRepo.FindPasswordHash(guid); authError != nil {
		authError = fmt.Errorf("User not found.")
		//Check the password hash
	} else if authError = CheckPasswordHash(password, hash); authError != nil {
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
