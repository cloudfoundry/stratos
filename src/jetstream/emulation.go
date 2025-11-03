package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func isv2EmulationDisabled() bool { 
	s := strings.ToLower(strings.TrimSpace(os.Getenv("DISABLE_CF_V2_EMULATION")))
	if s == "" { // Default to true during development
		return true
	}
	return s == "true" || s == "1" || s == "yes"
}

// WIP: Experimenting with v2 emulation for CF
// Currently only supports /v2/stacks and /v2/stacks/GUID
// Other v2 calls are passed through to CF
// This will be expanded over time to support other v2 calls we care about
// Note: This is may be a temporary measure until all clients have moved to v3
// and could be removed at that point

// Refactor the Handler to better detect the different v2 calls
// Possibly move the definitions to a separate file or use an available upstream version
func (p *portalProxy) HandleCFv2Request(c echo.Context, uri *url.URL) (map[string]*api.CNSIRequest, error) {
	log.Infof("HandleCFv2Request for '%s'", uri.Path)

	// Get the CNSI GUID from the header
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
	if len(cnsiList) != 1 {
		err := errors.New("Emulated CF call to multiple CNSIs. Only single CNSI Emulated call are supported currently")
		return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	//cnsiGUID := cnsiList[0]
	header := getEchoHeaders(c)
	header.Del("Cookie")

	pathLower := strings.ToLower(strings.TrimSpace(uri.Path))
	if strings.HasPrefix(pathLower, "v2/stacks") {
		return convertV2Stacks(p, c, uri)
	}
		if strings.HasPrefix(pathLower, "v2/buildpacks") {
		return convertV2Buildpacks(p, c, uri)
	}
	// Not Implemented to passhrough to CF
	// Set a header to skip emulation for this call
	// This will be removed once we implement all the v2 calls we care about
	// This allows us to avoid breaking functionality in the meantime
	log.Debugf("HandleCFv2Request: v2 being passed through to CF: %s", pathLower)
	// Set a header to skip emulation for this call
	// This will be removed once we implement all the v2 calls we care about
	c.Request().Header.Set("x-skip-cf-v2-emulation", "true")
	return p.ProxyRequest(c, uri)
}

// Common structs between emulation files

// PaginationV3 represents pagination information in the V3 API response
type PaginationV3 struct {
	TotalResults int `json:"total_results"`
	TotalPages   int `json:"total_pages"`
	First        struct {
		Href string `json:"href"`
	} `json:"first"`
	Last struct {
		Href string `json:"href"`
	} `json:"last"`
	Next     *string `json:"next"`
	Previous *string `json:"previous"`
}

// MetadataV2 represents metadata in the V2 API response
type MetadataV2 struct {
	GUID      string `json:"guid"`
	URL       string `json:"url"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// convertLink converts a link from the V3 API format to the V2 API format
func convertLink(link string) (string, error) {
	// Replace https://hostname/v3 with /v2
	// Link will come as format https://hostname/v3/*
	parsedURL, err := url.Parse(link)
	if err != nil {
		return "", err
	}
	// check the path contains /v3
	if !strings.Contains(parsedURL.Path, "/v3") {
		return "", fmt.Errorf("invalid V3 link format: %s", link)
	}
	// Extract the hostname from the link
	cf_api_hostname := parsedURL.Hostname()

	v2Link := strings.ReplaceAll(link, "https://"+cf_api_hostname+"/v3", "/v2")
	return v2Link, nil
}





