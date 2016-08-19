package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
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
	log.Println("getEchoURL")
	u := c.Request().URL().(*standard.URL).URL

	// dereference so we get a copy
	return *u
}

func getEchoHeaders(c echo.Context) http.Header {
	log.Println("getEchoHeaders")
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
	log.Println("makeRequestURI")
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getPortalUserGUID(c echo.Context) (string, error) {
	log.Println("getPortalUserGUID")
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (engine.Request, []byte, error) {
	log.Println("getRequestParts")
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
	log.Println("buildJSONResponse")
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
	log.Println("buildCNSIRequest")
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
	log.Println("validateCNSIList")
	for _, cnsiGUID := range cnsiList {
		if _, ok := p.getCNSIRecord(cnsiGUID); !ok {
			return errors.New("Invalid CNSI GUID")
		}
	}

	return nil
}

func fwdCNSIStandardHeaders(cnsiRequest CNSIRequest, req *http.Request) {
	log.Println("fwdCNSIStandardHeaders")
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
	log.Println("proxy")
	cnsiList := strings.Split(c.Request().Header().Get("x-cnap-cnsi-list"), ",")
	shouldPassthrough := "true" == c.Request().Header().Get("x-cnap-passthrough")

	log.Printf("shouldPassthru is: %t", shouldPassthrough)
	log.Printf("shouldPassthru header value is: %s", c.Request().Header().Get("x-cnap-passthrough"))

	if err := p.validateCNSIList(cnsiList); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	uri := makeRequestURI(c)

	log.Printf("URI: %+v\n", uri)

	header := getEchoHeaders(c)
	header.Del("Cookie")

	log.Printf("--- Headers: %+v\n", header)

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Printf("portalUserGUID: %s", portalUserGUID)

	req, body, err := getRequestParts(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Println("--- Request")
	log.Printf("%+v\n", req)
	log.Println("--- BODY")
	log.Printf("%+v\n", string(body))
	log.Println(" ")

	// if the following header is found, add the GH Oauth code to the body
	if header.Get("x-cnap-vcs-token-required") != "" {
		log.Println("--- x-cnap-vcs-token-required HEADER FOUND.....")
		body, err = p.addTokenToPayload(c, body)
		if err != nil {
			log.Printf("Unable to add token to HCE payload: %+v\n", err)
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
		log.Printf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func (p *portalProxy) addTokenToPayload(c echo.Context, body []byte) ([]byte, error) {
	log.Println("addTokenToPayload")

	token, ok := p.getVCSOAuthToken(c)
	if !ok {
		msg := "Unable to retrieve VCS OAuth token to add to payload"
		log.Println(msg)
		return nil, fmt.Errorf(msg)
	}

	var projData map[string]interface{}
	if err := json.Unmarshal(body, &projData); err != nil {
		log.Printf("Unable to add Authorization token to project data: %+v\n", err)
		return nil, err
	}

	log.Println("--- Unmarshal data in projData map")
	log.Printf("%+v\n", projData)

	log.Println("--- Adding token to map")
	projData["token"] = token
	b, _ := json.Marshal(projData)

	return b, nil
}

func (p *portalProxy) doRequest(cnsiRequest CNSIRequest, done chan<- CNSIRequest, kill <-chan struct{}) {
	log.Println("doRequest")
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
	log.Println("VCS proxy passthru ...")

	var (
		uri         *url.URL
		vcsEndpoint string
	)

	uri = makeRequestURI(c)

	vcsEndpoint = c.Request().Header().Get("x-cnap-vcs-api-url")

	url := fmt.Sprintf("%s/%s", vcsEndpoint, uri)
	log.Printf("VCS Endpoint URL: %s", url)

	token, ok := p.getVCSOAuthToken(c)
	if !ok {
		msg := fmt.Sprintf("Token not found for endpoint %s", vcsEndpoint)
		return echo.NewHTTPError(http.StatusBadRequest, msg)
	}

	tokenHeader := fmt.Sprintf("token %s", token)

	// Perform the request against the VCS endpoint
	req, err := http.NewRequest("GET", url, nil)
	log.Printf("Request: %+v\n", req)
	req.Header.Add("Authorization", tokenHeader)
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("Response from VCS contained an error: %v", err)
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
