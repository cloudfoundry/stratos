package main

import (
	"errors"
	"net/http"

	"github.com/hpcloud/portal-proxy/repository/cnsis"

	"github.com/labstack/echo"
)

// Endpoint - This represents the CNSI endpoint
type Endpoint struct {
	GUID     string         `json:"guid"`
	Name     string         `json:"name"`
	Version  string         `json:"version"`
	User     *ConnectedUser `json:"user"`
	CNSIType string         `json:"type"`
}

// Info - this represents user specific info
type Info struct {
	Versions     *Versions                               `json:"version"`
	User         *ConnectedUser                          `json:"user"`
	Endpoints    map[cnsis.CNSIType]map[string]*Endpoint `json:"endpoints"`
	CloudFoundry *CFInfo                                 `json:"cloud-foundry"`
}

func (p *portalProxy) info(c echo.Context) error {

	s, err := p.getInfo(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	return c.JSON(http.StatusOK, s)
}

func (p *portalProxy) getInfo(c echo.Context) (*Info, error) {
	// get the version
	versions, err := p.getVersionsData()
	if err != nil {
		return nil, errors.New("Could not find database version")
	}

	// get the user
	userGUID, err := p.getSessionStringValue(c, "user_id")
	if err != nil {
		return nil, errors.New("Could not find session user_id")
	}

	uaaUser, err := p.getUAAUser(userGUID)
	if err != nil {
		return nil, errors.New("Could not load session user data")
	}

	// create initial info struct
	s := &Info{
		Versions:     versions,
		User:         uaaUser,
		Endpoints:    make(map[cnsis.CNSIType]map[string]*Endpoint),
		CloudFoundry: p.CloudFoundry,
	}
	// initialize the Endpoints maps
	s.Endpoints[cnsis.CNSIHCF] = make(map[string]*Endpoint)
	s.Endpoints[cnsis.CNSIHCE] = make(map[string]*Endpoint)
	s.Endpoints[cnsis.CNSIHSM] = make(map[string]*Endpoint)

	// get the CNSI Endpoints
	cnsiList, _ := p.buildCNSIList(c)
	for _, cnsi := range cnsiList {
		endpoint := &Endpoint{
			GUID: cnsi.GUID,
			Name: cnsi.Name,
		}
		// try to get the user info for this cnsi for the user
		cnsiUser, ok := p.getCNSIUser(cnsi.GUID, userGUID)
		if ok {
			endpoint.User = cnsiUser
		}
		cnsiType := cnsi.CNSIType
		s.Endpoints[cnsiType][cnsi.GUID] = endpoint
	}

	return s, nil
}
