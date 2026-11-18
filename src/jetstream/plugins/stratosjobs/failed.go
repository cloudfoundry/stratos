package stratosjobs

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

// ErrorReasonHeader carries a machine-readable classification of a failed
// request to the frontend, which decides from it what to tell the user
// (an endpoint fault gets an endpoint banner; anything else is left to the
// component that made the call). Values name where the failure happened:
// the CF plugin sets "unreachable" and "auth_expired" for endpoint faults.
const ErrorReasonHeader = "X-Stratos-Error-Reason"

// ReasonOperationFailed: the upstream answered, and the operation it ran
// failed (a CF job FAILED because a broker rejected a provision, say). The
// endpoint is healthy; the reason belongs to the operation.
const ReasonOperationFailed = "operation_failed"

// WriteFailed answers a write whose job reached FAILED inside the fast-path
// window: the same {state, errors} envelope a polled job ends with, as 422
// with the operation_failed reason. Not 502: the upstream did not fail as a
// gateway, so the response must not read as an endpoint fault.
func WriteFailed(c *echo.Context, errs []StratosError) error {
	c.Response().Header().Set(ErrorReasonHeader, ReasonOperationFailed)
	return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
		"state":  JobStateFailed,
		"errors": errs,
	})
}
