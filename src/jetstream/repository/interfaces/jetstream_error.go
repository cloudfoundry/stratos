package interfaces

import (
	"fmt"

	"github.com/labstack/echo"
)

// JetstreamError is standard error response from JetSteam for REST APIs
type JetstreamError struct {
	Status          int
	LogMessage      string
	UserFacingError string
}

func (e JetstreamError) Error() string {
	return fmt.Sprintf("HTTP Error: Status %d -> Log Message: %s", e.Status, e.LogMessage)
}

// HTTPError formats the error as an echo HTTPError
func (e JetstreamError) HTTPError() *echo.HTTPError {
	return echo.NewHTTPError(e.Status, fmt.Sprintf(`{"error":%q}`, e.UserFacingError))
}

// NewJetstreamError creates a new JetStream error
func NewJetstreamError(status int, userFacingError string) error {
	shadowError := JetstreamError{
		Status:          status,
		UserFacingError: userFacingError,
	}
	return shadowError
}
