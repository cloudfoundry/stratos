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
	"path"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// API Host Prefix to replace if the custom header is supplied
const apiPrefix = "api."

const longRunningTimeoutHeader = "x-cap-long-running"

// Timeout for long-running requests, after which we will return indicating request it still active
// to prevent hitting the 2 minute browser timeout
const longRunningRequestTimeout = 30

type PassthroughErrorStatus struct {
	StatusCode int    `json:"statusCode"`
	Status     string `json:"status"`
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
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (*http.Request, []byte, error) {
	log.Debug("getRequestParts")
	var body []byte
	var err error
	req := c.Request()
	if bodyReader := req.Body; bodyReader != nil {
		if body, err = ioutil.ReadAll(bodyReader); err != nil {
			return nil, nil, errors.New("Failed to read request body")
		}
	}
	return req, body, nil
}

func buildJSONResponse(cnsiList []string, responses map[string]*interfaces.CNSIRequest) map[string]*json.RawMessage {
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

func (p *portalProxy) buildCNSIRequest(cnsiGUID string, userGUID string, method string, uri *url.URL, body []byte, header http.Header) (interfaces.CNSIRequest, error) {
	log.Debug("buildCNSIRequest")
	cnsiRequest := interfaces.CNSIRequest{
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
	// The APIEndpoint might have a path already - so join the request URI to it
	cnsiRequest.URL.Path = path.Join(cnsiRequest.URL.Path, uri.Path)
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

func fwdCNSIStandardHeaders(cnsiRequest *interfaces.CNSIRequest, req *http.Request) {
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

func (p *portalProxy) ProxyRequest(c echo.Context, uri *url.URL) (map[string]*interfaces.CNSIRequest, error) {
	log.Debug("ProxyRequest")
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
	shouldPassthrough := "true" == c.Request().Header.Get("x-cap-passthrough")
	longRunning := "true" == c.Request().Header.Get(longRunningTimeoutHeader)

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
			err := errors.New("Requested passthrough to multiple CNSIs. Only single CNSI passthroughs are supported")
			return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	// Only support one endpoint for long running operation (due to way we do timeout with the response channel)
	if longRunning {
		if len(cnsiList) > 1 {
			err := errors.New("Requested long-running proxy to multiple CNSIs. Only single CNSI is supported for long running passthrough")
			return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	// send the request to each CNSI
	done := make(chan *interfaces.CNSIRequest)
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
	responses := make(map[string]*interfaces.CNSIRequest)

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
						responses[id] = &interfaces.CNSIRequest{
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
				break
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
func (p *portalProxy) DoProxyRequest(requests []interfaces.ProxyRequestInfo) (map[string]*interfaces.CNSIRequest, error) {
	log.Debug("DoProxyRequest")

	// send the request to each endpoint
	done := make(chan *interfaces.CNSIRequest)
	for _, requestInfo := range requests {
		cnsiRequest, buildErr := p.buildCNSIRequest(requestInfo.EndpointGUID, requestInfo.UserGUID, requestInfo.Method, requestInfo.URI, requestInfo.Body, requestInfo.Headers)
		cnsiRequest.ResponseGUID = requestInfo.ResultGUID
		if buildErr != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
		}
		go p.doRequest(&cnsiRequest, done)
	}

	responses := make(map[string]*interfaces.CNSIRequest)
	for range requests {
		res := <-done
		responses[res.ResponseGUID] = res
	}

	return responses, nil
}

// Convenience helper for a single request
func (p *portalProxy) DoProxySingleRequest(cnsiGUID, userGUID, method, requestUrl string, headers http.Header, body []byte) (*interfaces.CNSIRequest, error) {
	requests := make([]interfaces.ProxyRequestInfo, 0)

	proxyURL, err := url.Parse(requestUrl)
	if err != nil {
		return nil, err
	}

	req := interfaces.ProxyRequestInfo{}
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
func (p *portalProxy) DoProxySingleRequestWithToken(cnsiGUID string, token *interfaces.TokenRecord, method, requestURL string, headers http.Header, body []byte) (*interfaces.CNSIRequest, error) {
	proxyURL, err := url.Parse(requestURL)
	if err != nil {
		return nil, err
	}

	done := make(chan *interfaces.CNSIRequest)
	cnsiRequest, buildErr := p.buildCNSIRequest(cnsiGUID, "", method, proxyURL, body, headers)
	if buildErr != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
	}
	cnsiRequest.Token = token
	go p.doRequest(&cnsiRequest, done)
	res := <-done
	return res, nil
}

func (p *portalProxy) SendProxiedResponse(c echo.Context, responses map[string]*interfaces.CNSIRequest) error {
	shouldPassthrough := "true" == c.Request().Header.Get("x-cap-passthrough")

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

func (p *portalProxy) doRequest(cnsiRequest *interfaces.CNSIRequest, done chan<- *interfaces.CNSIRequest) {
	log.Debugf("doRequest for URL: %s", cnsiRequest.URL.String())
	var body io.Reader
	var res *http.Response
	var req *http.Request
	var err error

	if len(cnsiRequest.Body) > 0 {
		body = bytes.NewReader(cnsiRequest.Body)
	}

	// cnsiRequest.URL.String() uses encoded version of path.. which re-encodes content when it shouldn't
	// (for example gitlab intentionally encoded path of `projects/richard-cox%2Fcf-quick-app` becomes
	// `projects/richard-cox%252Fcf-quick-app` which results in 404). Provide a way to override this functionality with UnescapePath
	url := cnsiRequest.URL.String()
	if cnsiRequest.UnescapePath {
		url = strings.ReplaceAll(url, cnsiRequest.URL.EscapedPath(), cnsiRequest.URL.Path)
	}

	req, err = http.NewRequest(cnsiRequest.Method, url, body)
	if err != nil {
		cnsiRequest.Error = err
		if done != nil {
			done <- cnsiRequest
		}
		return
	}

	var tokenRec interfaces.TokenRecord
	var noToken bool
	if cnsiRequest.Token != nil {
		tokenRec = *cnsiRequest.Token
	} else {
		// get a cnsi token record and a cnsi record
		tokenRec, _, err = p.getCNSIRequestRecords(cnsiRequest)
		if err != nil {
			if cnsiRequest.AllowNoToken {
				noToken = true
			} else {
				cnsiRequest.Error = err
				if done != nil {
					cnsiRequest.StatusCode = 400
					cnsiRequest.Status = "Unable to retrieve CNSI token record"
					done <- cnsiRequest
				}
				return
			}
		}
	}

	// Copy original headers through, except custom portal-proxy Headers
	fwdCNSIStandardHeaders(cnsiRequest, req)

	// If this is a long running request, add a header which we can use at request time to change the timeout
	if cnsiRequest.LongRunning {
		req.Header.Set(longRunningTimeoutHeader, "true")
	}

	if noToken {
		var client http.Client
		var cnsi interfaces.CNSIRecord
		cnsi, err = p.GetCNSIRecord(cnsiRequest.GUID)
		if err != nil {
			cnsiRequest.Error = err
			if done != nil {
				cnsiRequest.StatusCode = 400
				cnsiRequest.Status = "Unable to retrieve CNSI record"
				done <- cnsiRequest
			}
			return
		}
		client = p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
		res, err = client.Do(req)
	} else {
		// Find the auth provider for the auth type - default ot oauthflow
		authHandler := p.GetAuthProvider(tokenRec.AuthType)
		if authHandler.Handler != nil {
			res, err = authHandler.Handler(cnsiRequest, req)
		} else {
			res, err = p.DoOAuthFlowRequest(cnsiRequest, req)
		}
	}

	if err != nil {
		cnsiRequest.StatusCode = 500
		cnsiRequest.Status = "Error proxing request"
		cnsiRequest.Response = []byte(err.Error())
		cnsiRequest.Error = err
	} else if res.Body != nil {
		cnsiRequest.StatusCode = res.StatusCode
		cnsiRequest.Status = res.Status
		cnsiRequest.Response, cnsiRequest.Error = ioutil.ReadAll(res.Body)
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
	uri.Path = c.Param("*")
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

	done := make(chan *interfaces.CNSIRequest)
	cnsiRequest, buildErr := p.buildCNSIRequest(cnsi, portalUserGUID, req.Method, &uri, body, header)
	if buildErr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
	}
	cnsiRequest.LongRunning = false // FIXME: Should come from header. Would this have knock on effects (only handled in other cases)?
	cnsiRequest.UnescapePath = true // TODO: RC should this come from a header?
	cnsiRequest.AllowNoToken = true // TODO: RC should this come from a header?

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
