package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// JetstreamError is standard error response from JetSteam for REST APIs
type JetstreamError struct {
	Status          int    `json:"statusCode"`
	StatusMesssage  string `json:"status"`
	LogMessage      string `json:"-"`
	UserFacingError string `json:"message"`
	Method          string `json:"method"`
}

// JetstreamErrorResponse  formats a Jetstream error in the same way as a passthrough error
type JetstreamErrorResponse struct {
	Error         JetstreamError `json:"error"`
	ErrorResponse struct {
		Method string `json:"method"`
	} `json:"errorResponse"`
}

func (e JetstreamError) Error() string {
	return fmt.Sprintf("HTTP Error: Status %d -> Log Message: %s", e.Status, e.LogMessage)
}

// HTTPError formats the error as an echo HTTPError
func (e JetstreamError) HTTPError() *echo.HTTPError {
	if len(e.StatusMesssage) == 0 {
		e.StatusMesssage = "Failed"
	}

	wrapper := JetstreamErrorResponse{
		Error: e,
	}

	jsonString, err := json.Marshal(wrapper)
	if err != nil {
		return echo.NewHTTPError(e.Status, e.UserFacingError)
	}
	return echo.NewHTTPError(e.Status, string(jsonString))
}

// HTTPErrorInContext formats the error as an echo HTTPError filling in missing params from the contexts
func (e JetstreamError) HTTPErrorInContext(c echo.Context) *echo.HTTPError {
	e.finalize(c)
	return e.HTTPError()
}

// Finalize will fill in missing fields from the context before the error is sent to the client
func (e *JetstreamError) finalize(c echo.Context) {
	if len(e.StatusMesssage) == 0 {
		e.StatusMesssage = http.StatusText(e.Status)
	}
	if len(e.Method) == 0 {
		log.Warn(c.Request().Method)
		e.Method = c.Request().Method
	}
}

// NewJetstreamError creates a new JetStream error
func NewJetstreamError(userFacingError string) JetstreamError {
	shadowError := JetstreamError{
		Status:          http.StatusInternalServerError,
		UserFacingError: userFacingError,
	}
	return shadowError
}

// NewJetstreamErrorf creates a new JetStream error
func NewJetstreamErrorf(userFacingError string, args ...interface{}) JetstreamError {
	message := fmt.Sprintf(userFacingError, args...)
	return NewJetstreamError(message)
}

// NewJetstreamUserError creates a new JetStream error indicating that the error is a user error
func NewJetstreamUserError(userFacingError string) JetstreamError {
	e := NewJetstreamError(userFacingError)
	e.Status = http.StatusBadRequest
	return e
}

// NewJetstreamUserErrorf creates a new JetStream error indicating that the error is a user error
func NewJetstreamUserErrorf(userFacingError string, args ...interface{}) JetstreamError {
	message := fmt.Sprintf(userFacingError, args...)
	return NewJetstreamUserError(message)
}
