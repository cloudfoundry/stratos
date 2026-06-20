// src/jetstream/plugins/cloudfoundry/native_associate_user.go
package cloudfoundry

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

type associateUserRequest struct {
	Username string `json:"username"`
	Origin   string `json:"origin"`
}

// associateUser handles POST /pp/v1/cf/users/:cnsiGuid/associate.
// It resolves username+origin to a CF user GUID via the existing findUserGUID
// helper (GET /v3/users), then POSTs {"guid": <guid>} to /v3/users to
// associate the user with the foundation (roleless association).
//
// Already-associated (CF returns 422 / capi.ErrUnprocessable) is treated as a
// benign success — the user is already a member. Only a hard failure (any
// other error from the capi client) is surfaced as an error.
func (cf *CloudFoundrySpecification) associateUser(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req associateUserRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil || req.Username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	// Resolve username+origin to a CF user GUID. The user must already exist
	// in UAA (created via `cf create-user` or invited). If it does not resolve,
	// return 404 so the frontend can surface a clear "user not found" message.
	guid, err := findUserGUID(reqCtx, cfClient, req.Username, req.Origin)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// Associate the user with the foundation via POST /v3/users {"guid": <guid>}.
	// This is a roleless association — roles are assigned separately.
	_, createErr := cfClient.Users().Create(reqCtx, &capi.UserCreateRequest{GUID: guid})
	associated := true
	if createErr != nil {
		if !errors.Is(createErr, capi.ErrUnprocessable) {
			return echo.NewHTTPError(http.StatusBadGateway, "failed to associate user: "+createErr.Error())
		}
		// 422 = already associated, which is a benign idempotent success.
		associated = false
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, map[string]interface{}{"guid": guid, "associated": associated})
}
