package autoscaler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

// EndpointType is the endpoint type the Cloud Foundry Autoscaler tile
// registers.
const EndpointType = "autoscaler"

// endpointLink ties an autoscaler endpoint to the Cloud Foundry it serves
// and, when known, to its service broker there. It is stored as the
// endpoint's metadata.
type endpointLink struct {
	CFGUID     string `json:"cf_guid"`
	BrokerGUID string `json:"broker_guid,omitempty"`
	BrokerName string `json:"broker_name,omitempty"`
	Build      string `json:"build,omitempty"`
}

func (a *Autoscaler) GetType() string {
	return EndpointType
}

// Info checks that the URL answers like an autoscaler.
func (a *Autoscaler) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (api.CNSIRecord, interface{}, error) {
	rec := api.CNSIRecord{CNSIType: EndpointType}
	build, err := checkAutoscaler(a.portalProxy.GetHttpClient(skipSSLValidation, caCert), apiEndpoint)
	return rec, build, err
}

// Register registers an autoscaler for a Cloud Foundry the user can use.
// The autoscaler must be on that Cloud Foundry's domain, as the autoscaler
// CLI requires, because calls to it carry the user's Cloud Foundry token.
func (a *Autoscaler) Register(c *echo.Context) error {
	params := new(api.RegisterEndpointParams)
	if err := api.BindOnce(params, c); err != nil {
		return err
	}
	userID, err := a.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return api.NewHTTPShadowError(http.StatusInternalServerError,
			"Failed to get session user", "Failed to get session user: %v", err)
	}

	cf, err := a.linkedCF(c.FormValue("cf_guid"), userID)
	if err != nil {
		return err
	}
	cfURL := cf.APIEndpoint.String()
	if !sameDomain(cfURL, params.APIEndpoint) {
		return api.NewHTTPError(http.StatusBadRequest, fmt.Sprintf(
			"%s is not on the domain of the Cloud Foundry at %s: the autoscaler must be on the Cloud Foundry's domain",
			params.APIEndpoint, cfURL))
	}

	skip, _ := strconv.ParseBool(params.SkipSSLValidation)
	build, err := checkAutoscaler(a.portalProxy.GetHttpClient(skip, params.CACert), params.APIEndpoint)
	if err != nil {
		return api.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("%s is not an autoscaler: %v", params.APIEndpoint, err))
	}

	createSystem, err := strconv.ParseBool(params.CreateSystemEndpoint)
	if err != nil {
		createSystem = true
	}
	rec, err := a.portalProxy.DoRegisterEndpoint(params.CNSIName, params.APIEndpoint, skip, "", "",
		userID, false, "", createSystem, params.CACert, a.Info)
	if err != nil {
		return err
	}

	link, _ := json.Marshal(endpointLink{
		CFGUID:     cf.GUID,
		BrokerGUID: c.FormValue("broker_guid"),
		BrokerName: c.FormValue("broker_name"),
		Build:      build,
	})
	if err := a.portalProxy.UpdateEndpointMetadata(rec.GUID, string(link)); err != nil {
		return err
	}
	rec.Metadata = string(link)
	return c.JSON(http.StatusCreated, rec)
}

// linkedCF is the Cloud Foundry endpoint an autoscaler is registered for:
// a system endpoint or the user's own.
func (a *Autoscaler) linkedCF(guid, userID string) (api.CNSIRecord, error) {
	if guid == "" {
		return api.CNSIRecord{}, api.NewHTTPError(http.StatusBadRequest,
			"Choose the Cloud Foundry this autoscaler serves")
	}
	cf, err := a.portalProxy.GetCNSIRecord(guid)
	if err != nil || cf.CNSIType != "cf" || (cf.Creator != "" && cf.Creator != userID) || cf.APIEndpoint == nil {
		return api.CNSIRecord{}, api.NewHTTPError(http.StatusBadRequest,
			"The Cloud Foundry chosen for this autoscaler is not one you can use")
	}
	return cf, nil
}

// Connect is refused: an autoscaler takes the user's Cloud Foundry token.
func (a *Autoscaler) Connect(*echo.Context, api.CNSIRecord, string) (*api.TokenRecord, bool, error) {
	return nil, false, errors.New("Autoscaler endpoints do not take a connection: calls use your Cloud Foundry connection")
}

func (a *Autoscaler) Validate(string, api.CNSIRecord, api.TokenRecord) error {
	return nil
}

func (a *Autoscaler) UpdateMetadata(*api.Info, string, *echo.Context) {}
