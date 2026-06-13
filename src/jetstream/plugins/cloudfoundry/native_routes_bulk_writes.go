// src/jetstream/plugins/cloudfoundry/native_routes_bulk_writes.go
package cloudfoundry

import (
	"context"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// bulkDeleteNativeRoutes handles POST /pp/v1/cf/routes/{cnsiGuid}/bulk/delete
// — body {"guids": [...]}. CF v3 has no batch delete, so the handler fans out
// one DELETE /v3/routes/{guid} per item (bounded at bulkMaxConcurrency) and
// reports per-item outcomes in a single 200 BulkResult envelope; the HTTP
// status never expresses item failures.
//
// Each item rides the same async-job contract as deleteNativeRoute: CF
// returns 202 + a job reference, which is run through the stratosjobs
// fast-path. An item that resolves inside the window is COMPLETE or FAILED
// (with the CF job errors mapped); one that outlives it is PENDING with the
// handoff job for frontend polling. When the async-job contract is unwired
// (plugin ordering / tests), an accepted delete is reported as PENDING with
// no job — the CF-side outcome is unknowable without the tracker, and
// PENDING is the honest analogue of deleteNativeRoute's bare-202 fallback.
func (cf *CloudFoundrySpecification) bulkDeleteNativeRoutes(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	guids, err := decodeBulkGUIDs(c)
	if err != nil {
		return err
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

	result := bulkFanout(reqCtx, guids, bulkMaxConcurrency, func(ctx context.Context, guid string) BulkItemResult {
		job, deleteErr := cfClient.Routes().Delete(ctx, guid)
		if deleteErr != nil {
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: bulkItemErrorsFromCapi(deleteErr)}
		}
		if job == nil || job.GUID == "" {
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: []BulkItemError{
				{Code: "CF_ERROR", Message: "route delete: no job id returned from CF"},
			}}
		}

		if cf.asyncTracker == nil || cf.asyncTranslator == nil {
			return BulkItemResult{GUID: guid, State: bulkStatePending}
		}

		ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
		res := stratosjobs.RunFastPath(ctx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
			Kind: "cf.route.delete",
		})
		if !res.Resolved {
			return BulkItemResult{GUID: guid, State: bulkStatePending, Job: res.HandoffJob}
		}
		if res.State == stratosjobs.JobStateFailed {
			itemErrors := make([]BulkItemError, 0, len(res.Errors))
			for _, e := range res.Errors {
				itemErrors = append(itemErrors, BulkItemError{Code: e.Code, Message: e.Message})
			}
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: itemErrors}
		}
		return BulkItemResult{GUID: guid, State: bulkStateComplete}
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, result)
}

// bulkUnmapNativeRoutes handles POST /pp/v1/cf/routes/{cnsiGuid}/bulk/unmap
// — body {"guids": [...]}. Per route, the handler issues a synchronous
// PATCH /v3/routes/{guid}/destinations with an empty destinations array —
// CF's atomic "replace all destinations" — which unmaps every app from the
// route in one call. Outcomes are per-item: COMPLETE on 200, FAILED with the
// CF error envelope mapped (never failing the whole request); the response
// is always a 200 BulkResult envelope.
func (cf *CloudFoundrySpecification) bulkUnmapNativeRoutes(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	guids, err := decodeBulkGUIDs(c)
	if err != nil {
		return err
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

	result := bulkFanout(reqCtx, guids, bulkMaxConcurrency, func(ctx context.Context, guid string) BulkItemResult {
		if _, replaceErr := cfClient.Routes().ReplaceDestinations(ctx, guid, []capi.RouteDestination{}); replaceErr != nil {
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: bulkItemErrorsFromCapi(replaceErr)}
		}
		return BulkItemResult{GUID: guid, State: bulkStateComplete}
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, result)
}

// unmapAllRouteDestinations handles
// POST /pp/v1/cf/routes/{cnsiGuid}/{routeGuid}/unmap_all — the single-route
// "unmap everything" action. One synchronous PATCH
// /v3/routes/{routeGuid}/destinations with an empty array replaces the
// per-destination DELETE fan-out the frontend would otherwise have to do
// (unmapRouteFromApp once per bound app). 204 on success; upstream errors
// flow through handleCapiError to preserve CF's error envelope.
func (cf *CloudFoundrySpecification) unmapAllRouteDestinations(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	routeGUID := c.Param("routeGuid")
	if cnsiGUID == "" || routeGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and routeGuid are required")
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

	if _, replaceErr := cfClient.Routes().ReplaceDestinations(reqCtx, routeGUID, []capi.RouteDestination{}); replaceErr != nil {
		return handleCapiError(c, replaceErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	c.Response().WriteHeader(http.StatusNoContent)
	return nil
}
