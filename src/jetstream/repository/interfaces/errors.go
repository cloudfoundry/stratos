package interfaces

import (
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo"
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

func (e ErrHTTPShadow) Error() string {
	return fmt.Sprintf("HTTP Error: %v\nLog Message: %s", e.HTTPError, e.LogMessage)
}

func NewHTTPShadowError(status int, userFacingError string, fmtString string, args ...interface{}) error {
	shadowError := ErrHTTPShadow{
		UserFacingError: userFacingError,
		HTTPError:       echo.NewHTTPError(status, fmt.Sprintf(`{"error":%q}`, userFacingError)),
	}
	if len(fmtString) > 0 {
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
