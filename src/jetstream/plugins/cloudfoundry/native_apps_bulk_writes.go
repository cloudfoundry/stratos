// src/jetstream/plugins/cloudfoundry/native_apps_bulk_writes.go
package cloudfoundry

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// bulkDeleteNativeApps handles POST /pp/v1/cf/apps/{cnsiGuid}/bulk/delete
// — body {"guids": [...]}. CF v3 has no batch delete, so the handler fans out
// one DELETE /v3/apps/{guid} per item (bounded at bulkMaxConcurrency) and
// reports per-item outcomes in a single 200 BulkResult envelope; the HTTP
// status never expresses item failures.
//
// Each item rides the same async-job contract as deleteNativeApp: CF
// returns 202 + a job reference, which is run through the stratosjobs
// fast-path. An item that resolves inside the window is COMPLETE or FAILED
// (with the CF job errors mapped); one that outlives it is PENDING with the
// handoff job for frontend polling. When the async-job contract is unwired
// (plugin ordering / tests), an accepted delete is reported as PENDING with
// no job — the CF-side outcome is unknowable without the tracker, and
// PENDING is the honest analogue of deleteNativeApp's bare-202 fallback.
func (cf *CloudFoundrySpecification) bulkDeleteNativeApps(c *echo.Context) error {
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
		job, deleteErr := cfClient.Apps().Delete(ctx, guid)
		if deleteErr != nil {
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: bulkItemErrorsFromCapi(deleteErr)}
		}
		if job == nil || job.GUID == "" {
			return BulkItemResult{GUID: guid, State: bulkStateFailed, Errors: []BulkItemError{
				{Code: "CF_ERROR", Message: "app delete: no job id returned from CF"},
			}}
		}

		if cf.asyncTracker == nil || cf.asyncTranslator == nil {
			return BulkItemResult{GUID: guid, State: bulkStatePending}
		}

		ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
		res := stratosjobs.RunFastPath(ctx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
			Kind: "cf.app.delete",
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
