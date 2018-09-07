package main

import (
	"errors"
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
)

// Endpoint - This represents the CNSI endpoint
type Endpoint struct {
	GUID     string                    `json:"guid"`
	Name     string                    `json:"name"`
	Version  string                    `json:"version"`
	User     *interfaces.ConnectedUser `json:"user"`
	CNSIType string                    `json:"type"`
}

func (p *portalProxy) info(c echo.Context) error {

	s, err := p.getInfo(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	return c.JSON(http.StatusOK, s)
}

func (p *portalProxy) getInfo(c echo.Context) (*interfaces.Info, error) {
	// get the version
	versions, err := p.getVersionsData()
	if err != nil {
		return nil, errors.New("Could not find database version")
	}

	// get the user
	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, errors.New("Could not find session user_id")
	}

	uaaUser, err := p.GetUAAUser(userGUID)
	if err != nil {
		return nil, errors.New("Could not load session user data")
	}

	// create initial info struct
	s := &interfaces.Info{
		Versions:     versions,
		User:         uaaUser,
		Endpoints:    make(map[string]map[string]*interfaces.EndpointDetail),
		CloudFoundry: p.Config.CloudFoundryInfo,
		PluginConfig: p.Config.PluginConfig,
	}

	// Only add diagnostics information if the user is an admin
	if uaaUser.Admin {
		s.Diagnostics = p.Diagnostics
	}

	// initialize the Endpoints maps
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}
		s.Endpoints[endpointPlugin.GetType()] = make(map[string]*interfaces.EndpointDetail)
	}

	// get the CNSI Endpoints
	cnsiList, _ := p.buildCNSIList(c)
	for _, cnsi := range cnsiList {
		// Extend the CNSI record
		endpoint := &interfaces.EndpointDetail{
			CNSIRecord:        cnsi,
			Metadata:          make(map[string]string),
			SystemSharedToken: false,
		}
		// try to get the user info for this cnsi for the user
		cnsiUser, token, ok := p.GetCNSIUserAndToken(cnsi.GUID, userGUID)
		if ok {
			endpoint.User = cnsiUser
			endpoint.TokenMetadata = token.Metadata
			endpoint.SystemSharedToken = token.SystemShared
		}
		cnsiType := cnsi.CNSIType
		s.Endpoints[cnsiType][cnsi.GUID] = endpoint
	}

	// Allow plugin to modify the info data
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err == nil {
			endpointPlugin.UpdateMetadata(s, userGUID, c)
		}
	}

	return s, nil
}
