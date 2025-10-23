package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// API Host Prefix to replace if the custom header is supplied
const apiPrefix = "api."

const (
	longRunningTimeoutHeader = "x-cap-long-running"
	noTokenHeader            = "x-cap-no-token"
)

// Timeout for long-running requests, after which we will return indicating request it still active
// to prevent hitting the 2 minute browser timeout
const longRunningRequestTimeout = 30

type PassthroughErrorStatus struct {
	StatusCode int    `json:"statusCode"`
	Status     string `json:"status"`
}

func isv2EmulationDisabled() bool {
	s := strings.ToLower(strings.TrimSpace(os.Getenv("DISABLE_CF_V2_EMULATION")))
	return s == "true" || s == "1" || s == "yes"
}

type PassthroughError struct {
	Error         *PassthroughErrorStatus `json:"error"`
	ErrorResponse *json.RawMessage        `json:"errorResponse"`
}

func getEchoURL(c echo.Context) url.URL {
	log.Debug("getEchoURL")
	u := c.Request().URL

	// dereference so we get a copy
	return *u
}

func getEchoHeaders(c echo.Context) http.Header {
	log.Debug("getEchoHeaders")
	h := make(http.Header)
	originalHeader := c.Request().Header
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
	log.Debug("makeRequestURI")
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getPortalUserGUID(c echo.Context) (string, error) {
	log.Debug("getPortalUserGUID")
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (*http.Request, []byte, error) {
	log.Debug("getRequestParts")
	var body []byte
	var err error
	req := c.Request()
	if bodyReader := req.Body; bodyReader != nil {
		if body, err = io.ReadAll(bodyReader); err != nil {
			return nil, nil, errors.New("failed to read request body")
		}
	}
	return req, body, nil
}

func buildJSONResponse(cnsiList []string, responses map[string]*api.CNSIRequest) map[string]*json.RawMessage {
	log.Debug("buildJSONResponse")
	jsonResponse := make(map[string]*json.RawMessage)
	for _, guid := range cnsiList {
		var response []byte
		cnsiResponse, ok := responses[guid]
		var errorStatus = &PassthroughErrorStatus{
			StatusCode: -1,
		}
		var errorResponse []byte
		switch {
		case !ok:
			errorStatus.StatusCode = 500
			errorStatus.Status = "Request timed out"
		case cnsiResponse.Error != nil:
			errorStatus.StatusCode = 500
			errorStatus.Status = cnsiResponse.Error.Error()
		case cnsiResponse.Response != nil:
			response = cnsiResponse.Response
		}
		// Check the HTTP Status code to make sure that it is actually a valid response
		if cnsiResponse.StatusCode >= 400 {
			errorStatus.Status = cnsiResponse.Status
			errorStatus.StatusCode = cnsiResponse.StatusCode
			if errorStatus.StatusCode <= 0 {
				errorStatus.StatusCode = 500
				errorStatus.Status = "Failed to proxy request"
			}
			// Check that the error response was valid json - convert to string otherwise
			if !isValidJSON(cnsiResponse.Response) {
				errorResponse = []byte(fmt.Sprintf("%q", cnsiResponse.Response))
			} else {
				errorResponse = cnsiResponse.Response
			}
		}
		if errorStatus.StatusCode >= 0 {
			passthroughError := &PassthroughError{
				Error:         errorStatus,
				ErrorResponse: (*json.RawMessage)(&errorResponse),
			}
			res, _ := json.Marshal(passthroughError)
			jsonResponse[guid] = (*json.RawMessage)(&res)
		} else {
			if len(response) > 0 {
				jsonResponse[guid] = (*json.RawMessage)(&response)
			} else {
				jsonResponse[guid] = nil
			}
		}
	}

	return jsonResponse
}

// When we move to goland 1.9 we can use json.isValid()
func isValidJSON(data []byte) bool {
	var res interface{}
	err := json.Unmarshal(data, &res)
	return err == nil
}

func (p *portalProxy) buildCNSIRequest(cnsiGUID string, userGUID string, method string, uri *url.URL, body []byte, header http.Header) (api.CNSIRequest, error) {
	log.Debug("buildCNSIRequest")
	cnsiRequest := api.CNSIRequest{
		GUID:     cnsiGUID,
		UserGUID: userGUID,

		Method: method,
		Body:   body,
		Header: header,
	}

	cnsiRec, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return cnsiRequest, err
	}

	cnsiRequest.URL = new(url.URL)
	*cnsiRequest.URL = *cnsiRec.APIEndpoint
	// The APIEndpoint might have a path already - so join the request URI to it...
	// but ensure we don't escape parameters again
	extraPath := uri.Path
	if len(uri.RawPath) > 0 {
		extraPath = uri.RawPath
	}
	cnsiRequest.URL.RawPath = path.Join(cnsiRequest.URL.Path, extraPath)
	cnsiRequest.URL.Path, _ = url.PathUnescape(cnsiRequest.URL.RawPath)

	cnsiRequest.URL.RawQuery = uri.RawQuery

	return cnsiRequest, nil
}

func (p *portalProxy) validateCNSIList(cnsiList []string) error {
	log.Debug("validateCNSIList")
	for _, cnsiGUID := range cnsiList {
		if _, err := p.GetCNSIRecord(cnsiGUID); err != nil {
			return err
		}
	}

	return nil
}

func fwdCNSIStandardHeaders(cnsiRequest *api.CNSIRequest, req *http.Request) {
	log.Debug("fwdCNSIStandardHeaders")
	for k, v := range cnsiRequest.Header {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "X-Cap-*" and "Cookie" are consumed by us
		//  - "Accept-Encoding" must be excluded otherwise the transport will expect us to handle the encoding/compression
		//  - X-Forwarded-* headers - these will confuse Cloud Foundry in some cases (e.g. load balancers)
		case k == "Connection", k == "Cookie", k == "Referer", k == "Accept-Encoding",
			strings.HasPrefix(strings.ToLower(k), "x-cap-"),
			strings.HasPrefix(strings.ToLower(k), "x-forwarded-"):

		// Forwarding everything else
		default:
			req.Header[k] = v
		}
	}
}

func (p *portalProxy) proxy(c echo.Context) error {
	log.Debug("proxy")
	responses, err := p.ProxyRequest(c, makeRequestURI(c))
	if err != nil {
		return err
	}

	return p.SendProxiedResponse(c, responses)
}

func (p *portalProxy) ProxyRequest(c echo.Context, uri *url.URL) (map[string]*api.CNSIRequest, error) {
	log.Debug("ProxyRequest")

	// Detect if the path starts with /v2 or v2
	pathLower := strings.ToLower(strings.TrimSpace(uri.Path))
	if strings.HasPrefix(pathLower, "/v2") || strings.HasPrefix(pathLower, "v2") {
		log.Infof("ProxyRequest: Call to v2: Method=%s, Path=%s, RawPath=%s, RawQuery=%s", c.Request().Method, uri.Path, uri.RawPath, uri.RawQuery)
		if isv2EmulationDisabled() {
			log.Infof("ProxyRequest: v2 emulation disabled - passing through to CF")
		} else {
			// We have a v2 request - check if it is for Cloud Foundry and if we will emulate it
			// We only emulate CF v2 requests - not other types of v2 requests (e.g. K8s)
			// Check if this is a Cloud Foundry request that should be handled by v3 APIs
			cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
			if len(cnsiList) == 1 { // TODO: Support multiple CNSIs here
				cnsiGUID := cnsiList[0]
				cnsiRec, err := p.GetCNSIRecord(cnsiGUID)
				if err == nil && cnsiRec.CNSIType == "cf" {
					// This is a Cloud Foundry v2 request, check if we will emulate it
					skip_emulation_header := c.Request().Header.Get("x-skip-cf-v2-emulation")
					if skip_emulation_header != "" { // Skip emulation if the header is set for unimplemented v2 calls
						log.Debugf("ProxyRequest: v2 being passed through to CF: %s", skip_emulation_header)
					} else {
						log.Debugf("ProxyRequest: v2 being emulated from v3")
						return p.HandleCFv2Request(c, uri)
					}
				}
			}
		}
	}

	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
	shouldPassthrough := c.Request().Header.Get("x-cap-passthrough") == "true"
	longRunning := c.Request().Header.Get(longRunningTimeoutHeader) == "true"

	if err := p.validateCNSIList(cnsiList); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	header := getEchoHeaders(c)
	header.Del("Cookie")

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	req, body, err := getRequestParts(c)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if shouldPassthrough {
		if len(cnsiList) > 1 {
			err := errors.New("requested passthrough to multiple CNSIs. Only single CNSI passthroughs are supported")
			return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	// Only support one endpoint for long running operation (due to way we do timeout with the response channel)
	if longRunning {
		if len(cnsiList) > 1 {
			err := errors.New("requested long-running proxy to multiple CNSIs. Only single CNSI is supported for long running passthrough")
			return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	// send the request to each CNSI
	done := make(chan *api.CNSIRequest)
	for _, cnsi := range cnsiList {
		cnsiRequest, buildErr := p.buildCNSIRequest(cnsi, portalUserGUID, req.Method, uri, body, header)
		if buildErr != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
		}
		cnsiRequest.LongRunning = longRunning
		// Allow the host part of the API URL to be overridden
		apiHost := c.Request().Header.Get("x-cap-api-host")
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

	// Wait for all responses
	responses := make(map[string]*api.CNSIRequest)

	if !longRunning {
		for range cnsiList {
			res := <-done
			responses[res.GUID] = res
		}
	} else {
		// Long running has a timeout
		for range cnsiList {
			select {
			case res := <-done:
				responses[res.GUID] = res
			case <-time.After(longRunningRequestTimeout * time.Second):
				// For all those that have not completed, add a timeout response
				for _, id := range cnsiList {
					if _, ok := responses[id]; !ok {
						// Did not get a response for the endpoint
						responses[id] = &api.CNSIRequest{
							GUID:         id,
							UserGUID:     portalUserGUID,
							Method:       req.Method,
							StatusCode:   http.StatusAccepted,
							Status:       "Long Running Operation still active",
							Response:     makeLongRunningTimeoutError(),
							Error:        nil,
							ResponseGUID: id,
						}
					}
				}
				return responses, nil
			}
		}
	}

	return responses, nil
}

func makeLongRunningTimeoutError() []byte {
	description := "Long Running Operation still active"
	var errorStatus = &PassthroughErrorStatus{
		StatusCode: http.StatusAccepted,
		Status:     description,
	}
	errorResponse := []byte(fmt.Sprint("{\"longRunningTimeout\": true, \"description\": \"" + description + "\", \"error_code\": \"longRunningTimeout\"}"))
	passthroughError := &PassthroughError{}
	passthroughError.Error = errorStatus
	passthroughError.ErrorResponse = (*json.RawMessage)(&errorResponse)
	res, e := json.Marshal(passthroughError)
	if e != nil {
		log.Errorf("makeLongRunningTimeoutError: could not marshal JSON: %+v", e)
	}
	return res
}

// TODO: This should be used by the function above
func (p *portalProxy) DoProxyRequest(requests []api.ProxyRequestInfo) (map[string]*api.CNSIRequest, error) {
	log.Debug("DoProxyRequest")

	// send the request to each endpoint
	done := make(chan *api.CNSIRequest)
	for _, requestInfo := range requests {
		cnsiRequest, buildErr := p.buildCNSIRequest(requestInfo.EndpointGUID, requestInfo.UserGUID, requestInfo.Method, requestInfo.URI, requestInfo.Body, requestInfo.Headers)
		cnsiRequest.ResponseGUID = requestInfo.ResultGUID
		if buildErr != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
		}
		go p.doRequest(&cnsiRequest, done)
	}

	responses := make(map[string]*api.CNSIRequest)
	for range requests {
		res := <-done
		responses[res.ResponseGUID] = res
	}

	return responses, nil
}

// Convenience helper for a single request
func (p *portalProxy) DoProxySingleRequest(cnsiGUID, userGUID, method, requestUrl string, headers http.Header, body []byte) (*api.CNSIRequest, error) {
	requests := make([]api.ProxyRequestInfo, 0)

	proxyURL, err := url.Parse(requestUrl)
	if err != nil {
		return nil, err
	}

	req := api.ProxyRequestInfo{}
	req.UserGUID = userGUID
	req.ResultGUID = "REQ_" + cnsiGUID
	req.EndpointGUID = cnsiGUID
	req.Method = method
	req.URI = proxyURL

	if headers != nil {
		req.Headers = headers
	}

	if body != nil {
		req.Body = body
	}

	requests = append(requests, req)

	responses, err := p.DoProxyRequest(requests)
	if err != nil {
		return nil, err
	}

	return responses[req.ResultGUID], err
}

// Convenience helper for a single request using a token
func (p *portalProxy) DoProxySingleRequestWithToken(cnsiGUID string, token *api.TokenRecord, method, requestURL string, headers http.Header, body []byte) (*api.CNSIRequest, error) {
	proxyURL, err := url.Parse(requestURL)
	if err != nil {
		return nil, err
	}

	done := make(chan *api.CNSIRequest)
	cnsiRequest, buildErr := p.buildCNSIRequest(cnsiGUID, "", method, proxyURL, body, headers)
	if buildErr != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
	}
	cnsiRequest.Token = token
	go p.doRequest(&cnsiRequest, done)
	res := <-done
	return res, nil
}

func (p *portalProxy) SendProxiedResponse(c echo.Context, responses map[string]*api.CNSIRequest) error {
	shouldPassthrough := c.Request().Header.Get("x-cap-passthrough") == "true"

	var cnsiList []string
	for k := range responses {
		cnsiList = append(cnsiList, k)
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
		_, err := c.Response().Write(res.Response)
		if err != nil {
			log.Errorf("Failed to write passthrough response %v", err)
		}

		return nil
	}

	jsonResponse := buildJSONResponse(cnsiList, responses)
	e := json.NewEncoder(c.Response())
	err := e.Encode(jsonResponse)
	if err != nil {
		log.Errorf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func (p *portalProxy) doRequest(cnsiRequest *api.CNSIRequest, done chan<- *api.CNSIRequest) {
	log.Debugf("doRequest for URL: %s", cnsiRequest.URL.String())
	var body io.Reader
	var res *http.Response
	var req *http.Request
	var err error

	if len(cnsiRequest.Body) > 0 {
		body = bytes.NewReader(cnsiRequest.Body)
	}

	proxyURL := cnsiRequest.URL.String()

	req, err = http.NewRequest(cnsiRequest.Method, proxyURL, body)
	if err != nil {
		cnsiRequest.Error = err
		if done != nil {
			done <- cnsiRequest
		}
		return
	}

	var tokenRec api.TokenRecord
	if cnsiRequest.Token != nil {
		tokenRec = *cnsiRequest.Token
	} else {
		// get a cnsi token record and a cnsi record
		tokenRec, _, err = p.getCNSIRequestRecords(cnsiRequest)
		if err != nil {
			cnsiRequest.Error = err
			if done != nil {
				cnsiRequest.StatusCode = 400
				cnsiRequest.Status = "Unable to retrieve CNSI token record"
				done <- cnsiRequest
			}
			return
		}
	}

	// Copy original headers through, except custom portal-proxy Headers
	fwdCNSIStandardHeaders(cnsiRequest, req)

	// If this is a long running request, add a header which we can use at request time to change the timeout
	if cnsiRequest.LongRunning {
		req.Header.Set(longRunningTimeoutHeader, "true")
	}

	// Find the auth provider for the auth type - default ot oauthflow
	authHandler := p.GetAuthProvider(tokenRec.AuthType)
	if authHandler.Handler != nil {
		res, err = authHandler.Handler(cnsiRequest, req)
	} else {
		res, err = p.DoOAuthFlowRequest(cnsiRequest, req)
	}

	if err != nil {
		cnsiRequest.StatusCode = 500
		cnsiRequest.Status = "Error proxing request"
		cnsiRequest.Response = []byte(err.Error())
		cnsiRequest.Error = err
	} else if res.Body != nil {
		cnsiRequest.StatusCode = res.StatusCode
		cnsiRequest.Status = res.Status
		cnsiRequest.Response, cnsiRequest.Error = io.ReadAll(res.Body)
		defer res.Body.Close()
	}

	// If Status Code >=400, log this as a warning
	if cnsiRequest.StatusCode >= 400 {
		var contentType = "Unknown"
		var contentLength int64 = -1
		if res != nil {
			contentType = res.Header.Get("Content-Type")
			contentLength = res.ContentLength
		}
		log.Warnf("Passthrough response: URL: %s, Status Code: %d, Status: %s, Content Type: %s, Length: %d",
			cnsiRequest.URL.String(), cnsiRequest.StatusCode, cnsiRequest.Status, contentType, contentLength)
		log.Warn(string(cnsiRequest.Response))
	}

	if done != nil {
		done <- cnsiRequest
	}
}

func (p *portalProxy) ProxySingleRequest(c echo.Context) error {
	log.Debug("ProxySingleRequest")

	cnsi := c.Param("uuid")

	uri := url.URL{}
	// Ensure we don't escape parameters again
	uri.RawPath = c.Param("*")
	uri.Path, _ = url.PathUnescape(uri.RawPath)

	uri.RawQuery = c.Request().URL.RawQuery

	header := getEchoHeaders(c)
	header.Del("Cookie")
	header.Del(APIKeyHeader)

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	req, body, err := getRequestParts(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	done := make(chan *api.CNSIRequest)
	cnsiRequest, buildErr := p.buildCNSIRequest(cnsi, portalUserGUID, req.Method, &uri, body, header)
	if buildErr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
	}

	longRunning := c.Request().Header.Get(longRunningTimeoutHeader) == "true"
	noToken := c.Request().Header.Get(noTokenHeader) == "true"

	cnsiRequest.LongRunning = longRunning
	if noToken {
		// Fake a token record with no authentication
		cnsiRequest.Token = &api.TokenRecord{
			AuthType: api.AuthConnectTypeNone,
		}
	}

	go p.doRequest(&cnsiRequest, done)
	res := <-done

	// FIXME: cnsiRequest.Status info is lost for failures, only get a status code
	c.Response().WriteHeader(res.StatusCode)

	// we don't care if this fails
	_, writeErr := c.Response().Write(res.Response)
	if writeErr != nil {
		log.Errorf("Failed to write passthrough response %v", err)
	}

	return nil
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
	log.Debug("HandleCFv2Request")

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
	if strings.HasPrefix(pathLower, "v2/stacks/") {
		// Convert path to v3 equivalent
		parts := strings.Split(strings.TrimPrefix(uri.Path, "v2/stacks/"), "/")
		if len(parts) < 1 {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 stacks request")
		}
		stackGUID := parts[0]
		if stackGUID == "" {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 stacks request")
		}
		uri.Path = path.Join("v3/stacks", stackGUID)
		uri.RawQuery = "" // No query parameters for this call
		log.Debugf("Calling v3 stack API: %s", uri.Path)
		results, err := p.ProxyRequest(c, uri)
		if err != nil {
			return nil, err
		}
		result := results[cnsiList[0]]
		if result.Error != nil {
			return results, nil
		}
		v2_response_str, err := ConvertStackV3ToV2(string(result.Response))
		if err != nil {
			log.Errorf("HandleCFv2Request: could not convert v3 to v2: %+v", err)
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert v3 to v2")
		}
		// Convert the v3 response to v2
		result.Response = []byte(v2_response_str)
		results[cnsiList[0]] = result
		return results, nil
	} else {
		if strings.HasPrefix(pathLower, "v2/stacks") {
			uri.Path = "v3/stacks"
			uri.RawQuery = "order_by=name" // Need to convert the v2
			log.Debugf("Calling v3 stacks API: %s", uri.Path)
			results, err := p.ProxyRequest(c, uri)
			if err != nil {
				return nil, err
			}
			result := results[cnsiList[0]]
			if result.Error != nil {
				return results, nil
			}
			v2_response_str, err := ConvertStacksV3ToV2(string(result.Response))
			if err != nil {
				log.Errorf("HandleCFv2Request: could not convert v3 to v2: %+v", err)
				return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert v3 to v2")
			}
			// Convert the v3 response to v2
			result.Response = []byte(v2_response_str)
			results[cnsiList[0]] = result
			return results, nil
		} else {
			// Not Implemented to passhrough to CF
			// Set a header to skip emulation for this call
			// This will be removed once we implement all the v2 calls we care about
			// This allows us to avoid breaking functionality in the meantime
			log.Debugf("HandleCFv2Request: v2 being passed through to CF")
			// Set a header to skip emulation for this call
			// This will be removed once we implement all the v2 calls we care about
			c.Request().Header.Set("x-skip-cf-v2-emulation", "true")
			return p.ProxyRequest(c, uri)
		}
	}
	return nil, echo.ErrBadRequest
}

// ResourceV3 represents a resource in the V3 API response
type StackResourceV3 struct {
	GUID             string `json:"guid"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	BuildRootfsImage string `json:"build_rootfs_image"`
	RunRootfsImage   string `json:"run_rootfs_image"`
	Links            struct {
		Self struct {
			Href string `json:"href"`
		} `json:"self"`
	} `json:"links"`
}

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

// ResponseV3 represents the V3 API response
type StackResponseV3 struct {
	Pagination PaginationV3      `json:"pagination"`
	Resources  []StackResourceV3 `json:"resources"`
}

// MetadataV2 represents metadata in the V2 API response
type MetadataV2 struct {
	GUID      string `json:"guid"`
	URL       string `json:"url"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// EntityV2 represents an entity in the V2 API response
type StackEntityV2 struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	BuildRootfsImage string `json:"build_rootfs_image"`
	RunRootfsImage   string `json:"run_rootfs_image"`
}

// ResourceV2 represents a resource in the V2 API response
type ResourceV2 struct { // This is generic for all v2 resources
	Metadata MetadataV2    `json:"metadata"`
	Entity   StackEntityV2 `json:"entity"`
}

// ResponseV2 represents the V2 API response
type ResponseV2 struct { // This is generic for all v2 resources
	TotalResults int          `json:"total_results"`
	TotalPages   int          `json:"total_pages"`
	PrevURL      *string      `json:"prev_url"`
	NextURL      *string      `json:"next_url"`
	Resources    []ResourceV2 `json:"resources"`
}

// ConvertStackV3ToV2 converts a single V3 API response to a V2 API response
func ConvertStackV3ToV2(v3Response string) (string, error) {
	var v3Resp StackResourceV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	metadata, entity, err := convertStackResource(v3Resp)
	if err != nil {
		return "", err
	}
	v2Resp := ResourceV2{
		Metadata: metadata,
		Entity:   entity,
	}

	// Marshal the V2 response to JSON
	jsonBytes, err := json.Marshal(v2Resp)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
}

// ConvertStacksV3ToV2 converts a V3 API response to a V2 API response
func ConvertStacksV3ToV2(v3Response string) (string, error) {
	var v3Resp StackResponseV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	// Initialize the V2 response
	v2Resp := ResponseV2{
		TotalResults: v3Resp.Pagination.TotalResults,
		TotalPages:   v3Resp.Pagination.TotalPages,
	}

	// Convert pagination links
	if v3Resp.Pagination.Previous != nil {
		prevURL, err := convertLink(*v3Resp.Pagination.Previous)
		if err != nil {
			return "", err
		}
		v2Resp.PrevURL = &prevURL
	} else {
		v2Resp.PrevURL = nil
	}

	if v3Resp.Pagination.Next != nil {
		nextURL, err := convertLink(*v3Resp.Pagination.Next)
		if err != nil {
			return "", err
		}
		v2Resp.NextURL = &nextURL
	} else {
		v2Resp.NextURL = nil
	}

	// Convert resources
	for _, resource := range v3Resp.Resources {
		metadata, entity, err := convertStackResource(resource)
		if err != nil {
			return "", err
		}
		v2Resp.Resources = append(v2Resp.Resources, ResourceV2{
			Metadata: metadata,
			Entity:   entity,
		})
	}

	// Marshal the V2 response to JSON
	jsonBytes, err := json.Marshal(v2Resp)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
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

// convertStackResource converts a single resource from the V3 API format to the V2 API format
func convertStackResource(resource StackResourceV3) (MetadataV2, StackEntityV2, error) {
	metadata := MetadataV2{
		GUID:      resource.GUID,
		CreatedAt: resource.CreatedAt,
		UpdatedAt: resource.UpdatedAt,
	}
	// Convert the link to the V2 format
	v2Link, err := convertLink(resource.Links.Self.Href)
	if err != nil {
		return MetadataV2{}, StackEntityV2{}, err
	}
	metadata.URL = v2Link

	entity := StackEntityV2{
		Name:             resource.Name,
		Description:      resource.Description,
		BuildRootfsImage: resource.BuildRootfsImage,
		RunRootfsImage:   resource.RunRootfsImage,
	}

	return metadata, entity, nil
}
