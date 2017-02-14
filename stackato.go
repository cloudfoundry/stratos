package main

import (
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

// StackatoInfo - this represents user specific Stackato info
type StackatoInfo struct {
	Versions  *Versions                               `json:"version"`
	User      *ConnectedUser                          `json:"user"`
	Endpoints map[cnsis.CNSIType]map[string]*Endpoint `json:"endpoints"`
}

func (p *portalProxy) stackatoInfo(c echo.Context) error {
	// get the version
	versions, err := p.getVersionsData()
	if err != nil {
		msg := "Could not find database version"
		logger.Error(msg)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}

	// get the user
	userGUID, err := p.getSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find session user_id"
		logger.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	uaaUser, err := p.getUAAUser(userGUID)
	if err != nil {
		msg := "Could not load session user data"
		logger.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// create initial info struct
	s := &StackatoInfo{
		Versions:  versions,
		User:      uaaUser,
		Endpoints: make(map[cnsis.CNSIType]map[string]*Endpoint),
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

	return c.JSON(http.StatusOK, s)
}
