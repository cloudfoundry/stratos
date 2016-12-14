package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/hpcloud/portal-proxy/repository/vcs"
	"github.com/hpcloud/portal-proxy/repository/vcstokens"

	"github.com/labstack/echo"
	"github.com/satori/go.uuid"
	"strings"
)

const (

	TOKEN_GUID_HEADER string = "x-cnap-vcs-token-guid"
)

var GITHUB_REQUIRED_SCOPES = [...]string{"admin:repo_hook", "repo"}

func (p *portalProxy) listVCSClients(c echo.Context) error {
	logger.Info("listVCSClients")

	vcsRepository, _ := vcs.NewPostgresVcsRepository(p.DatabaseConnectionPool)
	vrs, err := vcsRepository.List()
	if err != nil {
		return newHTTPShadowError(
			http.StatusInternalServerError,
			"Listing VCS clients failed",
			"Listing VCS clients failed: %v", err)
	}

	c.JSON(http.StatusOK, vrs)
	return nil
}

func (p *portalProxy) listVcsTokens(c echo.Context) error {
	logger.Info("listVcsTokens")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		// Shouldn't happen as caught by our session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}
	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	if list, err := vcsTokensRepository.ListVcsTokenByUser(userGuid, p.Config.EncryptionKeyInBytes); err != nil {
		return newHTTPShadowError(
			http.StatusInternalServerError,
			"Listing VCS tokens failed",
			"Listing VCS tokens failed: %v", err)
	} else {
		c.JSON(http.StatusOK, list)
		return nil
	}
}

func (p *portalProxy) getVcsToken(c echo.Context) (*vcstokens.VcsTokenRecord, error) {
	logger.Info("getVcsToken")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		/// Shouldn't happen as caught by our session middleware
		return nil, echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	vcsTokenGuid := c.Request().Header().Get(TOKEN_GUID_HEADER)
	if (vcsTokenGuid == "") {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Header '" + TOKEN_GUID_HEADER + "' is required")
	}

	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	return vcsTokensRepository.FindVcsToken(userGuid, vcsTokenGuid, p.Config.EncryptionKeyInBytes)
}

func (p *portalProxy) getVcs(vcsGuid string) (*vcs.VcsRecord, error) {
	logger.Info("getVcs")
	vcsRepository, _ := vcs.NewPostgresVcsRepository(p.DatabaseConnectionPool)
	return vcsRepository.Find(vcsGuid)
}

func (p *portalProxy) registerVcsToken(c echo.Context) error {
	logger.Info("registerVcsToken")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		// Shouldn't happen as caught by our session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	required := []string{"name", "vcs_guid", "token"}
	inputParams := make(map[string]string)
	for _, key := range required {
		paramValue := c.FormValue(key)
		if (paramValue == "") {
			return echo.NewHTTPError(http.StatusBadRequest, "Parameter '" + key + "' is required")
		}
		inputParams[key] = paramValue
	}

	tr := &vcstokens.VcsTokenRecord{
		Guid: uuid.NewV4().String(),
		UserGuid: userGuid,
		VcsGuid: inputParams["vcs_guid"],
		Name: inputParams["name"],
		Token: inputParams["token"],
	}

	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	if err := vcsTokensRepository.SaveVcsToken(tr, p.Config.EncryptionKeyInBytes); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	logger.Infof("registerVcsToken: successfully saved VCS Token: %s", tr.Name)
	return c.JSON(http.StatusCreated, tr)
}

func (p *portalProxy) renameVcsToken(c echo.Context) error {
	logger.Info("renameVcsToken")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		// Shouldn't happen as caught by our session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	tokenGuid := c.Param("tokenGuid")
	newTokenName := c.FormValue("name")

	// Find the token by guid
	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	if err := vcsTokensRepository.RenameVcsToken(userGuid, tokenGuid, newTokenName); err != nil {
		logger.Errorf("Failed to rename VCS token with id %s - %s", tokenGuid, err)
		if _, ok := err.(*vcstokens.TokenNotFound); ok {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		// Shouldn't happen
		return echo.NewHTTPError(http.StatusInternalServerError, "We found your token but failed to rename it")
	}

	logger.Infof("renameVcsToken: successfully renamed VCS Token: %s to %s", tokenGuid, newTokenName)
	return c.NoContent(http.StatusNoContent)
}

func (p *portalProxy) deleteVcsToken(c echo.Context) error {
	logger.Info("deleteVcsToken")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		// Shouldn't happen as caught by our session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	tokenGuid := c.Param("tokenGuid")

	// Find the token by guid
	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	if err := vcsTokensRepository.DeleteVcsToken(userGuid, tokenGuid); err != nil {
		logger.Errorf("Failed to delete VCS token with id %s - %s", tokenGuid, err)
		if _, ok := err.(*vcstokens.TokenNotFound); ok {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		// Shouldn't happen
		return echo.NewHTTPError(http.StatusInternalServerError, "We found your token but failed to delete it")
	}

	logger.Infof("deleteVcsToken: successfully deleted VCS Token: %s", tokenGuid)
	return c.NoContent(http.StatusNoContent)
}

// Used in the list call
type VcsTokenValid struct {
	Guid          string `json:"guid"`
	Name          string `json:"name"`
	Valid         bool `json:"valid"`
	InvalidReason string `json:"invalid_reason,omitempty"`
}

func (p *portalProxy) checkVcsToken(c echo.Context) error {
	logger.Info("checkVcsToken")
	userGuid, err := getPortalUserGUID(c)
	if err != nil {
		// Shouldn't happen as caught by our session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	tokenGuid := c.Param("tokenGuid")

	// Find the token by guid
	vcsTokensRepository, err := vcstokens.NewPgsqlVcsTokenRepository(p.DatabaseConnectionPool)
	tr, err := vcsTokensRepository.FindVcsToken(userGuid, tokenGuid, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// Find the VCS
	vcsRepository, err := vcs.NewPostgresVcsRepository(p.DatabaseConnectionPool)
	vr, err := vcsRepository.Find(tr.VcsGuid)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Cannot find VCS associated with token: %+v", tr))
	}

	valid, reason, err := _checkVcsToken(vr, tr)
	if err != nil {
		msg := "Error checking VCS token"
		return newHTTPShadowError(http.StatusInternalServerError, msg, msg + ": %v", err)
	}
	tokenValid := VcsTokenValid{
		Guid: tr.Guid,
		Name: tr.Name,
		Valid: valid,
		InvalidReason: reason,
	}

	return c.JSON(http.StatusOK, tokenValid)
}

func (p *portalProxy) autoRegisterCodeEngineVcs(c echo.Context, hceGuid string) error {

	userID, err := p.getSessionStringValue(c, "user_id")
	if err != nil {
		// Should not happen as we are protected by the session middleware
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	// Ask Code Engine for the list of VCS it knows about
	listVcsPath := &url.URL{Path: "v2/vcs"}
	var nilBody []byte
	cnsiRequest, buildErr := p.buildCNSIRequest(hceGuid, userID, "GET", listVcsPath, nilBody, make(http.Header))
	if buildErr != nil {
		return buildErr
	}
	p.doRequest(&cnsiRequest, nil /* Synchronous request */)

	if cnsiRequest.Error != nil {
		return cnsiRequest.Error
	}

	hceVcses := make([]vcs.VcsRecord, 0)
	if err = json.Unmarshal(cnsiRequest.Response, &hceVcses); err != nil {
		return fmt.Errorf("Failed to parse VCS from Code Engine! %#v", err)
	}
	// Ensure each VCS is of a supported type before registering
	vcsRepository, _ := vcs.NewPostgresVcsRepository(p.DatabaseConnectionPool)
	for _, aVcs := range hceVcses {
		checkedType, err := vcs.CheckVcsType(aVcs.VcsType)
		if err != nil {
			logger.Warnf("autoRegisterCodeEngineVcs: skipping VCS with unsupported type %#v", aVcs.VcsType)
			continue
		}
		aVcs.VcsType = checkedType
		if _, err = vcsRepository.FindMatching(aVcs); err != nil {
			aVcs.Guid = uuid.NewV4().String()
			if err = vcsRepository.Save(aVcs); err != nil {
				logger.Warnf("autoRegisterCodeEngineVcs: Failed to auto register new VCS from Code Engine! %#v - %#v", aVcs, err)
			} else {
				logger.Infof("autoRegisterCodeEngineVcs: New VCS from Code Engine registered! : %s", aVcs.BrowseUrl)
			}
		} else {
			logger.Infof("autoRegisterCodeEngineVcs: VCS from Code Engine was already registered: %s", aVcs.BrowseUrl)
		}
	}
	return nil
}

// _checkVcsToken - make an authenticated request against the Vcs to check if the Token is working and has the required scopes
func _checkVcsToken(vr *vcs.VcsRecord, tr *vcstokens.VcsTokenRecord) (bool, string, error) {
	var client http.Client
	if vr.SkipSslValidation {
		client = httpClientSkipSSL
	} else {
		client = httpClient
	}

	// Note: this URL is appropriate for both GitHub and BitBucket
	checkUrl := vr.ApiUrl + "/user"

	req, err := http.NewRequest(http.MethodGet, checkUrl, nil)
	if err != nil {
		return false, "Failed to create the check request", err
	}

	// Add the appropriate Authorization header
	var authorizationPrefix string
	if vr.VcsType == vcs.VCS_GITHUB {
		authorizationPrefix = "token "
	} else {
		authorizationPrefix = "bearer "
	}
	req.Header.Add("Authorization", authorizationPrefix + tr.Token)

	// Do the request
	res, err := client.Do(req)
	if err != nil {
		return false, "Failed to contact the VCS to make verify the token", err
	}

	valid := res.StatusCode == http.StatusOK

	if !valid {
		if res.StatusCode == 401 {
			return valid, "This token is not valid", nil
		}
		return valid, fmt.Sprintf("VCS responded with non-OK status code: %d", res.StatusCode), nil
	}

	// Get a map of all the scopes for the token
	// Ensure we check individual scopes for an exact match to avoid substring matches such as:
	// "admin:repo_hook" would also substring match "repo"
	scopesMap := make(map[string]bool)
	for _, v := range strings.Split(res.Header.Get("X-Oauth-Scopes"), ", ") {
		scopesMap[v] = true
	}

	var missingScopes []string
	for _, requiredScope := range GITHUB_REQUIRED_SCOPES {
		if !scopesMap[requiredScope] {
			valid = false
			missingScopes = append(missingScopes, "'" + requiredScope + "'")
		}
	}

	if valid {
		return valid, "", nil
	}

	var missingScopesString string
	if len(missingScopes) == 1 {
		missingScopesString = "This token lacks the required scope " + missingScopes[0]
	} else {
		missingScopesString = "This token lacks the following required scopes: ["
		missingScopesString += strings.Join(missingScopes, ", ")
		missingScopesString += "]"
	}

	return valid, missingScopesString, nil
}
