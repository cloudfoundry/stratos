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

	"github.com/davecgh/go-spew/spew"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine"
	"github.com/labstack/echo/engine/standard"
)

type CNSIRequest struct {
	GUID     string
	UserGUID string

	Method string
	Body   []byte
	Header http.Header
	URL    *url.URL

	Response []byte
	Error    error
}

func getEchoURL(c echo.Context) url.URL {
	u := c.Request().URL().(*standard.URL).URL

	// dereference so we get a copy
	return *u
}

func getEchoHeaders(c echo.Context) http.Header {
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
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getPortalUserGUID(c echo.Context) (string, error) {
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func getRequestParts(c echo.Context) (engine.Request, []byte, error) {
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

func (p *portalProxy) buildCNSIRequest(cnsiGUID string, userGUID string, req engine.Request, uri *url.URL, body []byte, header http.Header) CNSIRequest {
	cnsiRequest := CNSIRequest{
		GUID:     cnsiGUID,
		UserGUID: userGUID,

		Method: req.Method(),
		Body:   body,
		Header: header,
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
	for _, cnsiGUID := range cnsiList {
		if _, ok := p.getCNSIRecord(cnsiGUID); !ok {
			return errors.New("Invalid CNSI GUID")
		}
	}

	return nil
}

func (p *portalProxy) hcf(c echo.Context) error {
	cnsiList := strings.Split(c.Request().Header().Get("x-cnap-cnsi-list"), ",")
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

	// send the request to each CNSI
	done := make(chan CNSIRequest)
	kill := make(chan struct{})
	for _, cnsi := range cnsiList {
		cnsiRequest := p.buildCNSIRequest(cnsi, portalUserGUID, req, uri, body, header)
		go p.doRequest(cnsiRequest, done, kill)
	}

	timeout := time.After(5 * time.Second)
	responses := make(map[string]CNSIRequest)
	for range cnsiList {
		select {
		case res := <-done:
			responses[res.GUID] = res
		case <-timeout:
		}
	}

	jsonResponse := buildJSONResponse(cnsiList, responses)
	e := json.NewEncoder(c.Response())
	err = e.Encode(jsonResponse)
	if err != nil {
		log.Printf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func (p *portalProxy) hce(c echo.Context) error {
	return nil
}

func (p *portalProxy) doRequest(cnsiRequest CNSIRequest, done chan<- CNSIRequest, kill <-chan struct{}) {
	var body io.Reader
	var res *http.Response
	var req *http.Request
	var err error

	if len(cnsiRequest.Body) > 0 {
		body = bytes.NewReader(cnsiRequest.Body)
	}
	spew.Dump(cnsiRequest.URL.String())
	req, err = http.NewRequest(cnsiRequest.Method, cnsiRequest.URL.String(), body)
	if err != nil {
		cnsiRequest.Error = err
		goto End
	}

	res, err = p.doOauthFlowRequest(cnsiRequest, req)
	if err != nil {
		cnsiRequest.Error = err
	} else if res.Body != nil {
		cnsiRequest.Response, cnsiRequest.Error = ioutil.ReadAll(res.Body)
		defer res.Body.Close()
	}

End:
	select {
	case done <- cnsiRequest:
	case <-kill:
	}
}
