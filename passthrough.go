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
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine"
	"github.com/labstack/echo/engine/standard"
)

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
	logger.Println("getEchoURL")
	u := c.Request().URL().(*standard.URL).URL

	// dereference so we get a copy
	return *u
}

func getEchoHeaders(c echo.Context) http.Header {
	logger.Println("getEchoHeaders")
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
	logger.Println("makeRequestURI")
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getPortalUserGUID(c echo.Context) (string, error) {
	logger.Println("getPortalUserGUID")
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (engine.Request, []byte, error) {
	logger.Println("getRequestParts")
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

func buildJSONResponse(cnsiList []string, responses map[string]CNSIRequest) map[string]*json.RawMessage {
	logger.Println("buildJSONResponse")
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
		if len(response) > 0 {
			jsonResponse[guid] = (*json.RawMessage)(&response)
		} else {
			jsonResponse[guid] = nil
		}
	}

	return jsonResponse
}

func (p *portalProxy) buildCNSIRequest(cnsiGUID string, userGUID string, req engine.Request, uri *url.URL, body []byte, header http.Header, passThrough bool) CNSIRequest {
	logger.Println("buildCNSIRequest")
	cnsiRequest := CNSIRequest{
		GUID:     cnsiGUID,
		UserGUID: userGUID,

		Method: req.Method(),
		Body:   body,
		Header: header,

		PassThrough: passThrough,
	}

	cnsiRec, ok := p.getCNSIRecord(cnsiGUID)
	if !ok {
		panic("REFACTOR ME")
	}

	cnsiRequest.URL = new(url.URL)
	*cnsiRequest.URL = *cnsiRec.APIEndpoint
	cnsiRequest.URL.Path = uri.Path
	cnsiRequest.URL.RawQuery = uri.RawQuery

	return cnsiRequest
}

func (p *portalProxy) validateCNSIList(cnsiList []string) error {
	logger.Println("validateCNSIList")
	for _, cnsiGUID := range cnsiList {
		if _, ok := p.getCNSIRecord(cnsiGUID); !ok {
			return errors.New("Invalid CNSI GUID")
		}
	}

	return nil
}

func fwdCNSIStandardHeaders(cnsiRequest CNSIRequest, req *http.Request) {
	logger.Println("fwdCNSIStandardHeaders")
	for k, v := range cnsiRequest.Header {
		switch {
		case k == "Cookie", k == "Referer", strings.HasPrefix(strings.ToLower(k), "x-cnap-"):
		// Skip these. Note: "Referer" causes HCF to fail with a 403
		default:
			// Forwarding everything else
			req.Header[k] = v
		}
	}
}

func (p *portalProxy) proxy(c echo.Context) error {
	logger.Println("proxy")
	cnsiList := strings.Split(c.Request().Header().Get("x-cnap-cnsi-list"), ",")
	shouldPassthrough := "true" == c.Request().Header().Get("x-cnap-passthrough")

	logger.Printf("shouldPassthru is: %t", shouldPassthrough)
	logger.Printf("shouldPassthru header value is: %s", c.Request().Header().Get("x-cnap-passthrough"))

	if err := p.validateCNSIList(cnsiList); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	uri := makeRequestURI(c)

	logger.Printf("URI: %+v\n", uri)

	header := getEchoHeaders(c)
	header.Del("Cookie")

	logger.Printf("--- Headers: %+v\n", header)

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	logger.Printf("portalUserGUID: %s", portalUserGUID)

	req, body, err := getRequestParts(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	logger.Println("--- Request")
	logger.Printf("%+v\n", req)
	logger.Println("--- BODY")
	logger.Printf("%+v\n", string(body))
	logger.Println(" ")

	// if the following header is found, add the GH Oauth code to the body
	if header.Get("x-cnap-vcs-token-required") != "" {
		logger.Println("--- x-cnap-vcs-token-required HEADER FOUND.....")
		body, err = p.addTokenToPayload(c, body)
		if err != nil {
			logger.Printf("Unable to add token to HCE payload: %+v\n", err)
			return err
		}
	}

	if shouldPassthrough {
		if len(cnsiList) > 1 {
			err := errors.New("Requested passthrough to multiple CNSIs. Only single CNSI passthroughs are supported.")
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		// TODO: Pass headers through in all cases, not just single pass through
		// https://jira.hpcloud.net/browse/TEAMFOUR-635
		//req.Header = header
	}

	// send the request to each CNSI
	done := make(chan CNSIRequest)
	kill := make(chan struct{})
	for _, cnsi := range cnsiList {
		cnsiRequest := p.buildCNSIRequest(cnsi, portalUserGUID, req, uri, body, header, shouldPassthrough)
		go p.doRequest(cnsiRequest, done, kill)
	}

	timeout := time.After(time.Duration(p.Config.HTTPClientTimeoutInSecs) * time.Second)
	responses := make(map[string]CNSIRequest)
	for range cnsiList {
		select {
		case res := <-done:
			responses[res.GUID] = res
		case <-timeout:
		}
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
		logger.Printf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func (p *portalProxy) addTokenToPayload(c echo.Context, body []byte) ([]byte, error) {
	logger.Println("addTokenToPayload")

	token, ok := p.getVCSOAuthToken(c)
	if !ok {
		msg := "Unable to retrieve VCS OAuth token to add to payload"
		logger.Println(msg)
		return nil, fmt.Errorf(msg)
	}

	var projData map[string]interface{}
	if err := json.Unmarshal(body, &projData); err != nil {
		logger.Printf("Unable to add Authorization token to project data: %+v\n", err)
		return nil, err
	}

	logger.Println("--- Unmarshal data in projData map")
	logger.Printf("%+v\n", projData)

	logger.Println("--- Adding token to map")
	projData["token"] = token
	b, _ := json.Marshal(projData)

	return b, nil
}

func (p *portalProxy) doRequest(cnsiRequest CNSIRequest, done chan<- CNSIRequest, kill <-chan struct{}) {
	logger.Println("doRequest")
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
		goto End
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

End:
	select {
	case done <- cnsiRequest:
	case <-kill:
	}
}

func (p *portalProxy) vcsProxy(c echo.Context) error {
	logger.Println("VCS proxy passthru ...")

	var (
		uri         *url.URL
		vcsEndpoint string
	)

	uri = makeRequestURI(c)
	vcsEndpoint = c.Request().Header().Get("x-cnap-vcs-api-url")
	url := fmt.Sprintf("%s/%s", vcsEndpoint, uri)
	logger.Printf("VCS Endpoint URL: %s", url)

	token, ok := p.getVCSOAuthToken(c)
	if !ok {
		msg := fmt.Sprintf("Token not found for endpoint %s", vcsEndpoint)
		return echo.NewHTTPError(http.StatusUnauthorized, msg)
	}

	tokenHeader := fmt.Sprintf("token %s", token)

	// Perform the request against the VCS endpoint
	req, err := http.NewRequest("GET", url, nil)
	logger.Printf("Request: %+v\n", req)
	req.Header.Add("Authorization", tokenHeader)
	resp, err := httpClient.Do(req)
	if err != nil {
		logger.Printf("Response from VCS contained an error: %v", err)
	}

	body, _ := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()

	// Forward all response headers
	for k, v := range resp.Header {
		c.Response().Header().Set(k, strings.Join(v, " "))
	}

	c.Response().WriteHeader(resp.StatusCode)

	// we don't care if this fails
	_, _ = c.Response().Write(body)

	return nil
}
