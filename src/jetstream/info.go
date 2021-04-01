package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
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

	uaaUser, err := p.StratosAuthService.GetUser(userGUID)
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

	s.Configuration.TechPreview = p.Config.EnableTechPreview
	s.Configuration.ListMaxSize = p.Config.UIListMaxSize
	s.Configuration.ListAllowLoadMaxed = p.Config.UIListAllowLoadMaxed
	s.Configuration.APIKeysEnabled = string(p.Config.APIKeysEnabled)
	s.Configuration.HomeViewShowFavoritesOnly = p.Config.HomeViewShowFavoritesOnly
	s.Configuration.UserEndpointsEnabled = string(p.Config.UserEndpointsEnabled)

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
		// Empty Type can be used if a plugin just wants to implement UpdateMetadata
		if len(endpointPlugin.GetType()) > 0 {
			s.Endpoints[endpointPlugin.GetType()] = make(map[string]*interfaces.EndpointDetail)
		}
	}

	// get the CNSI Endpoints
	cnsiList, _ := p.buildCNSIList(c)
	for _, cnsi := range cnsiList {
		// Extend the CNSI record
		endpoint := &interfaces.EndpointDetail{
			CNSIRecord:        cnsi,
			EndpointMetadata:  marshalEndpointMetadata(cnsi.Metadata),
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

		// set the creator preemptively as admin, if no id is found
		endpoint.Creator = &interfaces.CreatorInfo{
			Name:   "system",
			Admin:  false,
			System: true,
		}

		// assume it's a user when len != 0
		if len(cnsi.Creator) != 0 {
			endpoint.Creator.System = false
			u, err := p.StratosAuthService.GetUser(cnsi.Creator)
			// add an anonymous user if no user is found
			if err != nil {
				endpoint.Creator.Name = "user"
				endpoint.Creator.Admin = false
			} else {
				endpoint.Creator.Name = u.Name
				endpoint.Creator.Admin = u.Admin
			}
		}

		cnsiType := cnsi.CNSIType

		_, ok = s.Endpoints[cnsiType]
		if ok {
			s.Endpoints[cnsiType][cnsi.GUID] = endpoint
		} else {
			// definitions of YAML-defined plugins may be removed
			log.Warnf("Unknown endpoint type %q encountered in the DB", cnsiType)
		}
	}

	// Allow plugin to modify the info data
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err == nil {
			endpointPlugin.UpdateMetadata(s, userGUID, c)
		}
	}

	s.Plugins = p.PluginsStatus

	return s, nil
}

func marshalEndpointMetadata(metadata string) interface{} {
	if len(metadata) > 2 && strings.Index(metadata, "{") == 0 {
		var anyJSON map[string]interface{}
		json.Unmarshal([]byte(metadata), &anyJSON)
		return anyJSON
	} else {
		return metadata
	}
}
