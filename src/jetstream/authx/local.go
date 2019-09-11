package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"

	"golang.org/x/crypto/bcrypt"
)


func (a *AuthInterface) Login(c echo.Context) {
	return a.localLogin(c echo.Context)
}

func (a *AuthInterface) Logout(c echo.Context) {
	return a.logout(c echo.Context)
}

func (a *AuthInterface) localLogin(c echo.Context) error {
	log.Debug("localLogin")

	if interfaces.AuthEndpointTypes[p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Local {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Local Login is not enabled",
			"Local Login is not enabled")
		return err
	}

	//Perform the login and fetch session values if successful
	userGUID, username, err := p.doLocalLogin(c)
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
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	//Makes sure the client gets the right session expiry time
	if err = p.handleSessionExpiryHeader(c); err != nil {
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
		p.ensureXSRFToken(c)
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return err
}

func (a *AuthInterface) doLocalLogin(c echo.Context) (string, string, error) {
	log.Debug("doLocalLogin")

	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return "", username, errors.New("Needs usernameand password")
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
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
		scopeOK = strings.Contains(localUserScope, p.Config.ConsoleConfig.LocalUserScope)
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

func (a *AuthInterface) logout(c echo.Context) error {
	log.Debug("logout")

	p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	p.unsetSessionValue(c, XSRFTokenSessionName)

	err := p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}

//HashPassword accepts a plaintext password string and generates a salted hash
func HashPassword(password string) ([]byte, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return bytes, err
}

//CheckPasswordHash accepts a bcrypt salted hash and plaintext password.
//It verifies the password against the salted hash
func CheckPasswordHash(password string, hash []byte) error {
	err := bcrypt.CompareHashAndPassword(hash, []byte(password))
	return err
}



