package main

import (
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo"
)

type errHTTPShadow struct {
	HTTPError  *echo.HTTPError
	LogMessage string
}

type errHTTPRequest struct {
	Status     int
	InnerError error
	Response   string
}

func (e errHTTPShadow) Error() string {
	return fmt.Sprintf("HTTP Error: %v\nLog Message: %s", e.HTTPError, e.LogMessage)
}

func newHTTPShadowError(status int, userFacingError string, fmtString string, args ...interface{}) error {
	return errHTTPShadow{
		HTTPError:  echo.NewHTTPError(status, fmt.Sprintf(`{"error":%q}`, userFacingError)),
		LogMessage: fmt.Sprintf(fmtString, args...),
	}
}

func (e errHTTPRequest) Error() string {
	body := "No request body"
	if len(e.Response) != 0 {
		body = e.Response
	}
	return fmt.Sprintf("Error: %v\nStatus: %d\nResponse: %s", e.InnerError, e.Status, body)
}

func logHTTPError(r *http.Response, innerErr error) error {
	b := []byte("No request body")
	status := 0
	if r != nil {
		defer r.Body.Close()
		if bb, err := ioutil.ReadAll(r.Body); err == nil {
			b = bb
		}
		status = r.StatusCode
	}

	return errHTTPRequest{
		Status:     status,
		InnerError: innerErr,
		Response:   string(b),
	}

}
