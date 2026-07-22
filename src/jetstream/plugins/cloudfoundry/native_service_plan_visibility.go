// src/jetstream/plugins/cloudfoundry/native_service_plan_visibility.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServicePlanVisibility handles
//
//	GET /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}/visibility.
//
// Reads the current visibility envelope for one plan and returns a
// flat Stratos-shape record. No filters, no drain — single CAPI call.
func (c *CloudFoundrySpecification) getNativeServicePlanVisibility(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	planGUID := ctx.Param("planGuid")
	if cnsiGUID == "" || planGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and planGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	vis, gerr := cfClient.ServicePlans().GetVisibility(ctx.Request().Context(), planGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServicePlanVisibility(*vis))
}

// applyNativeServicePlanVisibility handles two HTTP methods at the same path:
//
//   - POST  /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}/visibility →
//     replace existing visibility (CAPI: POST /v3/service_plans/{guid}/visibility).
//   - PATCH /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}/visibility →
//     apply/merge visibility on top of existing (CAPI: PATCH).
//
// One Echo handler, dispatched on method, so the routes can share a
// path and the wire shape mirrors CAPI's two-mode semantics.
func (c *CloudFoundrySpecification) applyNativeServicePlanVisibility(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	planGUID := ctx.Param("planGuid")
	if cnsiGUID == "" || planGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and planGuid are required")
	}

	var body StServicePlanVisibilityRequest
	if berr := ctx.Bind(&body); berr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body: "+berr.Error())
	}
	if body.Type == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "type is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	// fw-capi's method names are inverted relative to CAPI HTTP semantics:
	//   ApplyVisibility  -> POST  (CAPI: replace existing visibility)
	//   UpdateVisibility -> PATCH (CAPI: apply/merge onto existing)
	// We dispatch by inbound HTTP method and call the fw-capi method
	// that issues the matching CAPI HTTP method.
	var vis *capi.ServicePlanVisibility
	var verr error
	switch ctx.Request().Method {
	case http.MethodPost:
		vis, verr = cfClient.ServicePlans().ApplyVisibility(ctx.Request().Context(), planGUID, &capi.ServicePlanVisibilityApplyRequest{
			Type:          body.Type,
			Organizations: body.Organizations,
		})
	case http.MethodPatch:
		vis, verr = cfClient.ServicePlans().UpdateVisibility(ctx.Request().Context(), planGUID, &capi.ServicePlanVisibilityUpdateRequest{
			Type:          body.Type,
			Organizations: body.Organizations,
		})
	default:
		return echo.NewHTTPError(http.StatusMethodNotAllowed, "use POST (replace) or PATCH (apply/merge)")
	}
	if verr != nil {
		return handleCapiError(ctx, verr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServicePlanVisibility(*vis))
}

// removeOrgFromNativeServicePlanVisibility handles
//
//	DELETE /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}/visibility/{orgGuid}.
//
// Removes one org from the plan's organization-scoped visibility list.
// Returns 204 on success.
func (c *CloudFoundrySpecification) removeOrgFromNativeServicePlanVisibility(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	planGUID := ctx.Param("planGuid")
	orgGUID := ctx.Param("orgGuid")
	if cnsiGUID == "" || planGUID == "" || orgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid, planGuid and orgGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	if rerr := cfClient.ServicePlans().RemoveOrgFromVisibility(ctx.Request().Context(), planGUID, orgGUID); rerr != nil {
		return handleCapiError(ctx, rerr)
	}

	return ctx.NoContent(http.StatusNoContent)
}

// toStServicePlanVisibility flattens CAPI's visibility shape onto the
// Stratos-shape DTO. Org/space sub-records are passed through verbatim
// — there's no flattening to do at this level, the structure is already
// shallow.
func toStServicePlanVisibility(v capi.ServicePlanVisibility) StServicePlanVisibility {
	out := StServicePlanVisibility{
		Type: v.Type,
	}
	if len(v.Organizations) > 0 {
		out.Organizations = make([]StServicePlanVisibilityOrg, 0, len(v.Organizations))
		for _, o := range v.Organizations {
			out.Organizations = append(out.Organizations, StServicePlanVisibilityOrg{
				GUID: o.GUID,
				Name: o.Name,
			})
		}
	}
	if v.Space != nil {
		out.Space = &StServicePlanVisibilitySpace{
			GUID: v.Space.GUID,
			Name: v.Space.Name,
		}
	}
	return out
}
