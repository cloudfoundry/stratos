package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo/v4"
)

type ErrHTTPShadow struct {
	HTTPError       *echo.HTTPError
	LogMessage      string
	UserFacingError string
}

type ErrHTTPRequest struct {
	Status     int
	InnerError error
	Response   string
}

type ErrorResponseBody struct {
	Status string `json:"status"`
	Error  string `json:"error"`
}

func (e ErrHTTPShadow) Error() string {
	return fmt.Sprintf("HTTP Error: %v\nLog Message: %s", e.HTTPError, e.LogMessage)
}

func NewHTTPError(status int, userFacingError string) error {
	return NewHTTPShadowError(status, userFacingError, "")
}

func NewHTTPShadowError(status int, userFacingError string, fmtString string, args ...interface{}) error {
	//Only set the HTTPError field of the ErrHTTPShadow struct if we have been passed an error message intended for logging
	httpErrorMsg := ""
	if len(userFacingError) > 0 {
		errBody := ErrorResponseBody{Status: "error", Error: userFacingError}
		bytes, _ := json.Marshal(errBody)
		httpErrorMsg = string(bytes)
	}
	shadowError := ErrHTTPShadow{
		UserFacingError: userFacingError,
		HTTPError:       echo.NewHTTPError(status, httpErrorMsg),
	}
	if args != nil {
		shadowError.LogMessage = fmt.Sprintf(fmtString, args...)
	}
	return shadowError
}

func (e ErrHTTPRequest) Error() string {
	body := "No request body"
	if len(e.Response) != 0 {
		body = e.Response
	}
	return fmt.Sprintf("Error: %v\nStatus: %d\nResponse: %s", e.InnerError, e.Status, body)
}

func LogHTTPError(r *http.Response, innerErr error) error {
	b := []byte("No request body")
	status := 0
	if r != nil {
		defer r.Body.Close()
		if bb, err := ioutil.ReadAll(r.Body); err == nil {
			b = bb
		}
		status = r.StatusCode
	}

	return ErrHTTPRequest{
		Status:     status,
		InnerError: innerErr,
		Response:   string(b),
	}

}
