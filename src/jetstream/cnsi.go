package main

import (
	"crypto/x509"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"crypto/sha1"
	"encoding/base64"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites/userfavoritesendpoints"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
)

const dbReferenceError = "Unable to establish a database reference: '%v'"

func isSSLRelatedError(err error) (bool, string) {
	if urlErr, ok := err.(*url.Error); ok {
		if x509Err, ok := urlErr.Err.(x509.UnknownAuthorityError); ok {
			return true, x509Err.Error()
		}
		if x509Err, ok := urlErr.Err.(x509.HostnameError); ok {
			return true, x509Err.Error()
		}
		if x509Err, ok := urlErr.Err.(x509.CertificateInvalidError); ok {
			return true, x509Err.Error()
		}
	}
	return false, ""
}

func (p *portalProxy) RegisterEndpoint(c echo.Context, fetchInfo interfaces.InfoFunc) error {
	log.Debug("registerEndpoint")

	params := new(interfaces.RegisterEndpointParams)
	err := interfaces.BindOnce(params, c)
	if err != nil {
		return err
	}

	skipSSLValidation, err := strconv.ParseBool(params.SkipSSLValidation)
	if err != nil {
		log.Errorf("Failed to parse skip_ssl_validation value: %s", err)
		// default to false
		skipSSLValidation = false
	}

	ssoAllowed, err := strconv.ParseBool(params.SSOAllowed)
	if err != nil {
		// default to false
		ssoAllowed = false
	}

	cnsiClientId := params.CNSIClientID
	cnsiClientSecret := params.CNSIClientSecret
	subType := params.SubType

	createUserEndpoint, err := strconv.ParseBool(params.CreateUserEndpoint)
	if err != nil {
		// default to false
		createUserEndpoint = false
	}

	if cnsiClientId == "" {
		cnsiClientId = p.GetConfig().CFClient
		cnsiClientSecret = p.GetConfig().CFClientSecret
	}

	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to get session user",
			"Failed to get session user: %v", err)
	}

	newCNSI, err := p.DoRegisterEndpoint(params.CNSIName, params.APIEndpoint, skipSSLValidation, cnsiClientId, cnsiClientSecret, userID, ssoAllowed, subType, createUserEndpoint, fetchInfo)
	if err != nil {
		return err
	}

	c.JSON(http.StatusCreated, newCNSI)
	return nil
}

func (p *portalProxy) DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, userId string, ssoAllowed bool, subType string, createUserEndpoint bool, fetchInfo interfaces.InfoFunc) (interfaces.CNSIRecord, error) {
	log.Debug("DoRegisterEndpoint")

	if len(cnsiName) == 0 || len(apiEndpoint) == 0 {
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Needs CNSI Name and API Endpoint",
			"CNSI Name or Endpoint were not provided when trying to register an CF Cluster")
	}

	apiEndpoint = strings.TrimRight(apiEndpoint, "/")

	// Remove trailing slash, if there is one
	apiEndpointURL, err := url.Parse(apiEndpoint)
	if err != nil {
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get API Endpoint",
			"Failed to get API Endpoint: %v", err)
	}

	isAdmin := true

	// anonymous admin?
	if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.Disabled && len(userId) != 0 {
		currentCreator, err := p.StratosAuthService.GetUser(userId)
		if err != nil {
			return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
				http.StatusInternalServerError,
				"Failed to get user information",
				"Failed to get user information: %v", err)
		}
		isAdmin = currentCreator.Admin
	}

	if p.GetConfig().UserEndpointsEnabled == config.UserEndpointsConfigEnum.Disabled {
		// check if we've already got this endpoint in the DB
		ok := p.adminCNSIRecordExists(apiEndpoint)
		if ok {
			// a record with the same api endpoint was found
			return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
				http.StatusBadRequest,
				"Can not register same endpoint multiple times",
				"Can not register same endpoint multiple times",
			)
		}
	} else {
		// get all endpoints determined by the APIEndpoint
		duplicateEndpoints, err := p.listCNSIByAPIEndpoint(apiEndpoint)
		if err != nil {
			return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
				http.StatusBadRequest,
				"Failed to check other endpoints",
				"Failed to check other endpoints: %v",
				err)
		}
		// check if we've already got this APIEndpoint in this DB
		for _, duplicate := range duplicateEndpoints {
			// cant create same system endpoint
			if len(duplicate.Creator) == 0 && isAdmin && !createUserEndpoint {
				return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Can not register same system endpoint multiple times",
					"Can not register same system endpoint multiple times",
				)
			}

			// cant create same user endpoint
			if duplicate.Creator == userId {
				return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Can not register same endpoint multiple times",
					"Can not register same endpoint multiple times",
				)
			}
		}
	}

	h := sha1.New()
	// see why its generated this way in Issue #4753 / #3031
	if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.Disabled && (!isAdmin || createUserEndpoint) {
		// Make the new guid unique per api url AND user id
		h.Write([]byte(apiEndpointURL.String() + userId))
	} else {
		h.Write([]byte(apiEndpointURL.String()))
	}
	guid := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	newCNSI, _, err := fetchInfo(apiEndpoint, skipSSLValidation)
	if err != nil {
		if ok, detail := isSSLRelatedError(err); ok {
			return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
				http.StatusForbidden,
				"SSL error - "+detail,
				"There is a problem with the server Certificate - %s",
				detail)
		}
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to validate endpoint",
			"Failed to validate endpoint: %v",
			err)
	}

	newCNSI.Name = cnsiName
	newCNSI.APIEndpoint = apiEndpointURL
	newCNSI.SkipSSLValidation = skipSSLValidation
	newCNSI.ClientId = clientId
	newCNSI.ClientSecret = clientSecret
	newCNSI.SSOAllowed = ssoAllowed
	newCNSI.SubType = subType

	// admins currently can't create user endpoints
	if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.Disabled && (!isAdmin || createUserEndpoint) {
		newCNSI.Creator = userId
	}

	err = p.setCNSIRecord(guid, newCNSI)

	// set the guid on the object so it's returned in the response
	newCNSI.GUID = guid

	// Notify plugins if they support the notification interface
	for _, plugin := range p.Plugins {
		if notifier, ok := plugin.(interfaces.EndpointNotificationPlugin); ok {
			notifier.OnEndpointNotification(interfaces.EndpointRegisterAction, &newCNSI)
		}
	}

	return newCNSI, err
}

// unregisterCluster godoc
// @Summary Unregister endpoint
// @Description
// @Tags admin
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Param id path string true "Endpoint GUID"
// @Success 200
// @Failure 400 {object} interfaces.ErrorResponseBody "Error response"
// @Failure 401 {object} interfaces.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /endpoints/{id} [delete]
// TODO (wchrisjohnson) We need do this as a TRANSACTION, vs a set of single calls
func (p *portalProxy) unregisterCluster(c echo.Context) error {
	cnsiGUID := c.Param("id")
	log.WithField("cnsiGUID", cnsiGUID).Debug("unregisterCluster")

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	return p.doUnregisterCluster(cnsiGUID)
}

func (p *portalProxy) doUnregisterCluster(cnsiGUID string) error {
	log.Debug("doUnregisterCluster")

	// Should check for errors?
	p.unsetCNSIRecord(cnsiGUID)

	p.unsetCNSITokenRecords(cnsiGUID)

	ufe := userfavoritesendpoints.Constructor(p, cnsiGUID)
	ufe.RemoveFavorites()

	return nil
}

func (p *portalProxy) buildCNSIList(c echo.Context) ([]*interfaces.CNSIRecord, error) {
	log.Debug("buildCNSIList")

	if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.Disabled {
		userID, err := p.GetSessionValue(c, "user_id")
		if err != nil {
			return nil, err
		}

		u, err := p.StratosAuthService.GetUser(userID.(string))
		if err != nil {
			return nil, err
		}

		if u.Admin {
			return p.ListEndpoints()
		}

		if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.AdminOnly {
			// if endpoint with same url exists as system and user endpoint, hide the system endpoint
			unfilteredList, err := p.ListAdminEndpoints(userID.(string))
			if err != nil {
				return unfilteredList, err
			}

			filteredList := []*interfaces.CNSIRecord{}

			for _, endpoint := range unfilteredList {
				duplicateSystemEndpoint := false
				duplicateEndpointIndex := -1

				for i := 0; i < len(filteredList); i++ {
					if filteredList[i].APIEndpoint.String() == endpoint.APIEndpoint.String() {
						duplicateSystemEndpoint = len(filteredList[i].Creator) == 0
						duplicateEndpointIndex = i
					}
				}

				if duplicateEndpointIndex != -1 && !u.Admin {
					if duplicateSystemEndpoint {
						filteredList[duplicateEndpointIndex] = endpoint
					}
				} else {
					filteredList = append(filteredList, endpoint)
				}
			}

			return filteredList, err
		}
	}
	return p.ListAdminEndpoints("")
}

func (p *portalProxy) ListEndpoints() ([]*interfaces.CNSIRecord, error) {
	log.Debug("ListEndpoints")
	var cnsiList []*interfaces.CNSIRecord
	var err error

	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		return cnsiList, fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	cnsiList, err = cnsiRepo.List(p.Config.EncryptionKeyInBytes)
	if err != nil {
		return cnsiList, err
	}

	return cnsiList, nil
}

// ListAdminEndpoints - return a CNSI list with endpoints created by the current user and all admins
func (p *portalProxy) ListAdminEndpoints(userID string) ([]*interfaces.CNSIRecord, error) {
	log.Debug("ListAdminEndpoints")
	// Initialise cnsiList to ensure empty struct (marshals to null) is not returned
	cnsiList := []*interfaces.CNSIRecord{}
	var userList []string
	var err error

	userList = append(userList, userID)
	if len(userID) != 0 {
		userList = append(userList, "")
	}

	//get a cnsi list from every admin found and given userID
	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		return cnsiList, fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	for _, id := range userList {
		creatorList, err := cnsiRepo.ListByCreator(id, p.Config.EncryptionKeyInBytes)
		if err != nil {
			return creatorList, err
		}
		cnsiList = append(cnsiList, creatorList...)
	}
	return cnsiList, nil
}

// listCNSIByAPIEndpoint - receives a URL as string
func (p *portalProxy) listCNSIByAPIEndpoint(apiEndpoint string) ([]*interfaces.CNSIRecord, error) {
	log.Debug("listCNSIByAPIEndpoint")

	var err error
	cnsiList := []*interfaces.CNSIRecord{}

	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		return cnsiList, fmt.Errorf("listCNSIByAPIEndpoint: %s", err)
	}

	cnsiList, err = cnsiRepo.ListByAPIEndpoint(apiEndpoint, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return cnsiList, err
	}

	for _, cnsi := range cnsiList {
		// Ensure that trailing slash is removed from the API Endpoint
		cnsi.APIEndpoint.Path = strings.TrimRight(cnsi.APIEndpoint.Path, "/")
	}

	return cnsiList, nil
}

// listCNSIs godoc
// @Summary List endpoints
// @Description
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Success 200 {array}  interfaces.CNSIRecord "List of endpoints"
// @Failure 400 {object} interfaces.ErrorResponseBody "Error response"
// @Failure 401 {object} interfaces.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /endpoints [get]
func (p *portalProxy) listCNSIs(c echo.Context) error {
	log.Debug("listCNSIs")
	cnsiList, err := p.buildCNSIList(c)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}

	jsonString, err := marshalCNSIlist(cnsiList)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) listRegisteredCNSIs(c echo.Context) error {
	log.Debug("listRegisteredCNSIs")
	userGUIDIntf, err := p.GetSessionValue(c, "user_id")
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"User session could not be found",
			"User session could not be found: %v", err,
		)
	}
	userGUID := userGUIDIntf.(string)

	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		return fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	var jsonString []byte
	var clusterList []*interfaces.ConnectedEndpoint

	clusterList, err = cnsiRepo.ListByUser(userGUID)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of clusters",
			"Failed to retrieve list of clusters: %v", err,
		)
	}

	jsonString, err = marshalClusterList(clusterList)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func marshalCNSIlist(cnsiList []*interfaces.CNSIRecord) ([]byte, error) {
	log.Debug("marshalCNSIlist")
	jsonString, err := json.Marshal(cnsiList)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}
	return jsonString, nil
}

func marshalClusterList(clusterList []*interfaces.ConnectedEndpoint) ([]byte, error) {
	log.Debug("marshalClusterList")
	jsonString, err := json.Marshal(clusterList)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of clusters",
			"Failed to retrieve list of clusters: %v", err,
		)
	}
	return jsonString, nil
}

func (p *portalProxy) UpdateEndpointMetadata(guid string, metadata string) error {
	log.Debug("UpdateEndpointMetadata")

	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = cnsiRepo.UpdateMetadata(guid, metadata)
	if err != nil {
		msg := "Unable to update endpoint metadata: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) GetCNSIRecord(guid string) (interfaces.CNSIRecord, error) {
	log.Debug("GetCNSIRecord")
	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		return interfaces.CNSIRecord{}, err
	}

	rec, err := cnsiRepo.Find(guid, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.CNSIRecord{}, err
	}

	// Ensure that trailing slash is removed from the API Endpoint
	rec.APIEndpoint.Path = strings.TrimRight(rec.APIEndpoint.Path, "/")

	return rec, nil
}

func (p *portalProxy) GetAdminCNSIRecordByEndpoint(endpoint string) (interfaces.CNSIRecord, error) {
	log.Debug("GetAdminCNSIRecordByEndpoint")
	var rec *interfaces.CNSIRecord

	endpointList, err := p.listCNSIByAPIEndpoint(endpoint)
	if err != nil {
		return interfaces.CNSIRecord{}, err
	}

	// search for endpoint created by an admin
	for _, endpoint := range endpointList {
		if len(endpoint.Creator) == 0 {
			rec = endpoint
		}
	}

	if rec == nil {
		return interfaces.CNSIRecord{}, fmt.Errorf("Can not find admin CNSIRecord by given endpoint")
	}

	// Ensure that trailing slash is removed from the API Endpoint
	rec.APIEndpoint.Path = strings.TrimRight(rec.APIEndpoint.Path, "/")

	return *rec, nil
}

func (p *portalProxy) adminCNSIRecordExists(apiEndpoint string) bool {
	log.Debug("adminCNSIRecordExists")

	_, err := p.GetAdminCNSIRecordByEndpoint(apiEndpoint)
	return err == nil
}

func (p *portalProxy) setCNSIRecord(guid string, c interfaces.CNSIRecord) error {
	log.Debug("setCNSIRecord")
	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = cnsiRepo.Save(guid, c, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSIRecord(guid string) error {
	log.Debug("unsetCNSIRecord")
	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	// Lookup the endpoint, so can pass the information to the plugins
	endpoint, lookupErr := cnsiRepo.Find(guid, p.Config.EncryptionKeyInBytes)

	// Delete the endpoint
	err = cnsiRepo.Delete(guid)
	if err != nil {
		msg := "Unable to delete a CNSI record: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	if lookupErr == nil {
		// Notify plugins if they support the notification interface
		for _, plugin := range p.Plugins {
			if notifier, ok := plugin.(interfaces.EndpointNotificationPlugin); ok {
				notifier.OnEndpointNotification(interfaces.EndpointUnregisterAction, &endpoint)
			}
		}
	}

	return nil
}

func (p *portalProxy) SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord) error {
	log.Debug("SaveEndpointToken")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		return err
	}

	return tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, tokenRecord, p.Config.EncryptionKeyInBytes)
}

func (p *portalProxy) DeleteEndpointToken(cnsiGUID string, userGUID string) error {
	log.Debug("DeleteEndpointToken")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		return err
	}

	return tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
}

func (p *portalProxy) GetCNSITokenRecord(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool) {
	log.Debug("GetCNSITokenRecord")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSIToken(cnsiGUID, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) GetCNSITokenRecordWithDisconnected(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool) {
	log.Debug("GetCNSITokenRecordWithDisconnected")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSITokenIncludeDisconnected(cnsiGUID, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) ListEndpointsByUser(userGUID string) ([]*interfaces.ConnectedEndpoint, error) {
	log.Debug("ListCEndpointsByUser")
	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return nil, fmt.Errorf(dbReferenceError, err)
	}

	cnsiList, err := cnsiRepo.ListByUser(userGUID)
	if err != nil {
		log.Debugf("Error was: %+v", err)
		return nil, err
	}

	return cnsiList, nil
}

// Uopdate the Access Token, Refresh Token and Token Expiry for a token
func (p *portalProxy) updateTokenAuth(userGUID string, t interfaces.TokenRecord) error {
	log.Debug("updateTokenAuth")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = tokenRepo.UpdateTokenAuth(userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to update Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) setCNSITokenRecord(cnsiGUID string, userGUID string, t interfaces.TokenRecord) error {
	log.Debug("setCNSITokenRecord")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSITokenRecord(cnsiGUID string, userGUID string) error {
	log.Debug("unsetCNSITokenRecord")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to delete a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSITokenRecords(cnsiGUID string) error {
	log.Debug("unsetCNSITokenRecord")
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.DeleteCNSITokens(cnsiGUID)
	if err != nil {
		msg := "Unable to delete a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

// updateEndpoint godoc
// @Summary Edit endpoint
// @Description
// @Tags admin
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Param id path string true "Endpoint GUID"
// @Param name formData string true "Endpoint name"
// @Param skipSSL formData string false "Skip SSL" Enums(true, false)
// @Param setClientInfo formData string false "Set client info" Enums(true, false)
// @Param clientID formData string false "Client ID"
// @Param clientSecret formData string false "Client secret"
// @Param allowSSO formData string false "Allow SSO" Enums(true, false)
// @Success 200
// @Failure 400 {object} interfaces.ErrorResponseBody "Error response"
// @Failure 401 {object} interfaces.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /endpoints/{id} [post]
func (p *portalProxy) updateEndpoint(ec echo.Context) error {
	log.Debug("updateEndpoint")

	params := new(interfaces.UpdateEndpointParams)
	if err := ec.Bind(params); err != nil {
		return err
	}

	// Check we have an ID
	if len(params.ID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint ID")
	}

	cnsiRepo, err := p.GetStoreFactory().EndpointStore()
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	endpoint, err := cnsiRepo.Find(params.ID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Could not find the endpoint %s: '%v'", params.ID, err)
	}

	updates := false

	// Update name
	name := params.Name
	if len(name) > 0 {
		endpoint.Name = name
		updates = true
	}

	// Skip SSL validation
	skipSSL := params.SkipSSL
	if len(skipSSL) > 0 {
		v, err := strconv.ParseBool(skipSSL)
		if err == nil {
			if v != endpoint.SkipSSLValidation {
				// SSL Validation value changed
				endpoint.SkipSSLValidation = v
				updates = true
				if !v {
					// Skip SSL validation is OFF - so check we can communicate with the endpoint
					plugin, err := p.GetEndpointTypeSpec(endpoint.CNSIType)
					if err != nil {
						return fmt.Errorf("Can not get endpoint type for %s: '%v'", endpoint.CNSIType, err)
					}
					_, _, err = plugin.Info(endpoint.APIEndpoint.String(), endpoint.SkipSSLValidation)
					if err != nil {
						if ok, detail := isSSLRelatedError(err); ok {
							return interfaces.NewHTTPShadowError(
								http.StatusForbidden,
								"SSL error - "+detail,
								"There is a problem with the server Certificate - %s",
								detail)
						}
						return interfaces.NewHTTPShadowError(
							http.StatusBadRequest,
							fmt.Sprintf("Could not validate endpoint: %v", err),
							"Could not validate endpoint: %v",
							err)
					}
				}
			}
		}
	}

	// Client ID and Client Secret
	setClientInfo := params.SetClientInfo
	isSet, err := strconv.ParseBool(setClientInfo)
	if err == nil && isSet {
		clientID := params.ClientID
		clientSecret := params.ClientSecret
		endpoint.ClientId = clientID
		endpoint.ClientSecret = clientSecret
		updates = true
	}

	// Allow SSO
	allowSSO := params.AllowSSO
	if len(allowSSO) > 0 {
		v, err := strconv.ParseBool(allowSSO)
		if err == nil {
			if v != endpoint.SSOAllowed {
				// Allow SSO value changed
				endpoint.SSOAllowed = v
				updates = true
			}
		}
	}

	// Apply updates
	if updates {
		err := cnsiRepo.Update(endpoint, p.Config.EncryptionKeyInBytes)
		if err != nil {
			return fmt.Errorf("Could not update the endpoint %s: '%v'", params.ID, err)
		}
	}

	// Notify plugins if they support the notification interface
	for _, plugin := range p.Plugins {
		if notifier, ok := plugin.(interfaces.EndpointNotificationPlugin); ok {
			notifier.OnEndpointNotification(interfaces.EndpointUpdateAction, &endpoint)
		}
	}

	return nil
}
