package vcs

import (
	"fmt"
	"io/ioutil"
	"strings"
	"encoding/json"
	"log"
	"github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"
)

func (p *portalProxy) vcsProxy(c echo.Context) error {
	log.Debug("VCS proxy passthrough...")

	tr, err := p.getVcsToken(c)
	if err != nil {
		msg := "Cannot find VCS token with matching guid"
		return echo.NewHTTPError(http.StatusBadRequest, msg)
	}

	vr, err := p.getVcs(tr.VcsGuid)
	if err != nil {
		msg := "Cannot find VCS record for this token"
		return echo.NewHTTPError(http.StatusBadRequest, msg)
	}

	fullUrl := fmt.Sprintf("%s/%s", vr.ApiUrl, makeRequestURI(c))
	log.Debug("VCS proxy passthrough to URL: %s", fullUrl)

	tokenHeader := fmt.Sprintf("token %s", tr.Token)

	// Perform the request against the VCS endpoint
	req, _ := http.NewRequest("GET", fullUrl, nil)
	req.Header.Add("Authorization", tokenHeader)

	var h http.Client
	if vr.SkipSslValidation {
		h = httpClientSkipSSL
	} else {
		h = httpClient
	}
	resp, err := h.Do(req)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Response from VCS contained an error",
			"Response from VCS contained an error: %v", err)
	}

	body, _ := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()

	// Forward all response headers
	for k, v := range resp.Header {
		c.Response().Header().Set(k, strings.Join(v, " "))
	}

	c.Response().WriteHeader(resp.StatusCode)

	// we don't care if this fails
	c.Response().Write(body)

	return nil
}

func (p *portalProxy) addTokenToPayload(c echo.Context, body []byte) ([]byte, error) {
	log.Debug("addTokenToPayload")

	tr, err := p.getVcsToken(c)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve VCS Token to add to payload %+v", err)
	}

	var projData map[string]interface{}
	if err := json.Unmarshal(body, &projData); err != nil {
		return nil, fmt.Errorf("Unable to parse body for adding Authorization token: %+v", err)
	}

	projData["token"] = tr.Token
	return json.Marshal(projData)
}