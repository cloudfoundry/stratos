package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine"
	"github.com/labstack/echo/engine/standard"
)

// API Host Prefix to replace if the custom header is supplied
const apiPrefix = "api."

// CNSIRequest - <TBD>
type CNSIRequest struct {
	GUID     string
	UserGUID string

	Method      string
	Body        []byte
	Header      http.Header
	URL         *url.URL
	StatusCode  int
	PassThrough bool

	Response []byte
	Error    error
}

func getEchoURL(c echo.Context) url.URL {
	logger.Debug("getEchoURL")
	u := c.Request().URL().(*standard.URL).URL

	// dereference so we get a copy
	return *u
}

func getEchoHeaders(c echo.Context) http.Header {
	logger.Debug("getEchoHeaders")
	h := make(http.Header)
	originalHeader := c.Request().Header().(*standard.Header).Header
	for k, v := range originalHeader {
		if k == "Cookie" {
			continue
		}
		vCopy := make([]string, len(v))
		copy(vCopy, v)
		h[k] = vCopy
	}

	return h
}

func makeRequestURI(c echo.Context) *url.URL {
	logger.Debug("makeRequestURI")
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getPortalUserGUID(c echo.Context) (string, error) {
	logger.Debug("getPortalUserGUID")
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (engine.Request, []byte, error) {
	logger.Debug("getRequestParts")
	var body []byte
	var err error
	req := c.Request()
	if bodyReader := req.Body(); bodyReader != nil {
		if body, err = ioutil.ReadAll(bodyReader); err != nil {
			return nil, nil, errors.New("Failed to read request body")
		}
	}
	return req, body, nil
}

func buildJSONResponse(cnsiList []string, responses map[string]*CNSIRequest) map[string]*json.RawMessage {
	logger.Debug("buildJSONResponse")
	jsonResponse := make(map[string]*json.RawMessage)
	for _, guid := range cnsiList {
		var response []byte
		cnsiResponse, ok := responses[guid]
		switch {
		case !ok:
			response = []byte(`{"error": "Request timed out"}`)
		case cnsiResponse.Error != nil:
			response = []byte(fmt.Sprintf(`{"error": %q}`, cnsiResponse.Error.Error()))
		case cnsiResponse.Response != nil:
			response = cnsiResponse.Response
		}
		// Check the HTTP Status code to make sure that it is actually a valid response
		if cnsiResponse.StatusCode >= 400 {
			response = []byte(fmt.Sprintf(`{"error": "Unexpected HTTP status code: %d"}`, cnsiResponse.StatusCode))
		}
		if len(response) > 0 {
			jsonResponse[guid] = (*json.RawMessage)(&response)
		} else {
			jsonResponse[guid] = nil
		}
	}

	return jsonResponse
}

func (p *portalProxy) buildCNSIRequest(cnsiGUID string, userGUID string, method string, uri *url.URL, body []byte, header http.Header) (CNSIRequest, error) {
	logger.Debug("buildCNSIRequest")
	cnsiRequest := CNSIRequest{
		GUID:     cnsiGUID,
		UserGUID: userGUID,

		Method: method,
		Body:   body,
		Header: header,
	}

	cnsiRec, err := p.getCNSIRecord(cnsiGUID)
	if err != nil {
		return cnsiRequest, err
	}

	cnsiRequest.URL = new(url.URL)
	*cnsiRequest.URL = *cnsiRec.APIEndpoint
	cnsiRequest.URL.Path = uri.Path
	cnsiRequest.URL.RawQuery = uri.RawQuery

	return cnsiRequest, nil
}

func (p *portalProxy) validateCNSIList(cnsiList []string) error {
	logger.Debug("validateCNSIList")
	for _, cnsiGUID := range cnsiList {
		if _, err := p.getCNSIRecord(cnsiGUID); err != nil {
			return err
		}
	}

	return nil
}

func fwdCNSIStandardHeaders(cnsiRequest *CNSIRequest, req *http.Request) {
	logger.Debug("fwdCNSIStandardHeaders")
	for k, v := range cnsiRequest.Header {
		switch {
		// Skip these
		//  - "Referer" causes HCF to fail with a 403
		//  - "Connection", "X-Cnap-*" and "Cookie" are consumed by us
		case k == "Connection", k == "Cookie", k == "Referer", strings.HasPrefix(strings.ToLower(k), "x-cnap-"):

		// Forwarding everything else
		default:
			req.Header[k] = v
		}
	}
}

func (p *portalProxy) proxy(c echo.Context) error {
	logger.Debug("proxy")
	cnsiList := strings.Split(c.Request().Header().Get("x-cnap-cnsi-list"), ",")
	shouldPassthrough := "true" == c.Request().Header().Get("x-cnap-passthrough")

	if err := p.validateCNSIList(cnsiList); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	uri := makeRequestURI(c)
	header := getEchoHeaders(c)
	header.Del("Cookie")

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	req, body, err := getRequestParts(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// if the following header is found, add the GH Oauth code to the body
	if header.Get(TOKEN_GUID_HEADER) != "" {
		logger.Debug("--- " + TOKEN_GUID_HEADER + " HEADER FOUND.....")
		body, err = p.addTokenToPayload(c, body)
		if err != nil {
			logger.Errorf("Unable to add token to HCE payload: %+v", err)
			return err
		}
	}

	if shouldPassthrough {
		if len(cnsiList) > 1 {
			err := errors.New("Requested passthrough to multiple CNSIs. Only single CNSI passthroughs are supported.")
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	// send the request to each CNSI
	done := make(chan *CNSIRequest)
	for _, cnsi := range cnsiList {
		cnsiRequest, buildErr := p.buildCNSIRequest(cnsi, portalUserGUID, req.Method(), uri, body, header)
		if buildErr != nil {
			return echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
		}
		// Allow the host part of the API URL to be overridden
		apiHost := c.Request().Header().Get("x-cnap-api-host")
		// Don't allow any '.' chars in the api name
		if apiHost != "" && !strings.ContainsAny(apiHost, ".") {
			// Add trailing . for when we replace
			apiHost = apiHost + "."
			// Override the API URL if needed
			if strings.HasPrefix(cnsiRequest.URL.Host, apiPrefix) {
				// Replace 'api.' prefix with supplied prefix
				cnsiRequest.URL.Host = strings.Replace(cnsiRequest.URL.Host, apiPrefix, apiHost, 1)
			} else {
				// Add supplied prefix to the domain
				cnsiRequest.URL.Host = apiHost + cnsiRequest.URL.Host
			}
		}
		go p.doRequest(&cnsiRequest, done)
	}

	responses := make(map[string]*CNSIRequest)
	for range cnsiList {
		res := <-done
		responses[res.GUID] = res
	}

	if shouldPassthrough {
		cnsiGUID := cnsiList[0]
		res, ok := responses[cnsiGUID]
		if !ok {
			return echo.NewHTTPError(http.StatusRequestTimeout, "Request timed out")
		}

		// in passthrough mode, set the status code to that of the single response
		c.Response().WriteHeader(res.StatusCode)

		// we don't care if this fails
		_, _ = c.Response().Write(res.Response)

		return nil
	}

	jsonResponse := buildJSONResponse(cnsiList, responses)
	e := json.NewEncoder(c.Response())
	err = e.Encode(jsonResponse)
	if err != nil {
		logger.Errorf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func (p *portalProxy) addTokenToPayload(c echo.Context, body []byte) ([]byte, error) {
	logger.Debug("addTokenToPayload")

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

func (p *portalProxy) doRequest(cnsiRequest *CNSIRequest, done chan <- *CNSIRequest) {
	logger.Debug("doRequest")
	var body io.Reader
	var res *http.Response
	var req *http.Request
	var err error

	if len(cnsiRequest.Body) > 0 {
		body = bytes.NewReader(cnsiRequest.Body)
	}
	req, err = http.NewRequest(cnsiRequest.Method, cnsiRequest.URL.String(), body)
	if err != nil {
		cnsiRequest.Error = err
		if (done != nil) {
			done <- cnsiRequest
		}
		return
	}

	// Copy original headers through, except custom portal-proxy Headers
	fwdCNSIStandardHeaders(cnsiRequest, req)

	res, err = p.doOauthFlowRequest(cnsiRequest, req)
	if err != nil {
		cnsiRequest.StatusCode = 500
		cnsiRequest.Response = []byte(err.Error())
		cnsiRequest.Error = err
	} else if res.Body != nil {
		cnsiRequest.StatusCode = res.StatusCode
		cnsiRequest.Response, cnsiRequest.Error = ioutil.ReadAll(res.Body)
		defer res.Body.Close()
	}

	if (done != nil) {
		done <- cnsiRequest
	}

}

func (p *portalProxy) vcsProxy(c echo.Context) error {
	logger.Debug("VCS proxy passthrough...")


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
	logger.Debug("VCS proxy passthrough to URL: %s", fullUrl)

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
		return newHTTPShadowError(
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
