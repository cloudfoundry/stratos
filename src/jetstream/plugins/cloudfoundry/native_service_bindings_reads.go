// src/jetstream/plugins/cloudfoundry/native_service_bindings_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getAppServiceBindings handles GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/service_bindings.
//
// Returns every app-type service credential binding currently attached to
// the app, joined with the referenced service instance's name and type.
// Used by the signal-native delete stepper's AppServiceBindingsPickerComponent
// to let the user opt into unbinding services alongside the app delete.
//
// Two-step join:
//  1. /v3/service_credential_bindings?app_guids={app}&types=app — drain all pages.
//  2. /v3/service_instances?guids={…collected unique GUIDs…} — one batched
//     fetch. CF v3 ListResponse doesn't model the `included` response field,
//     so an include= query won't help; we issue a follow-up filter-by-guids
//     call instead.
//
// If the bindings fetch succeeds but the service-instance fetch fails, the
// picker still renders — names fall back to the binding's own Name (or
// GUID) so the user isn't blocked from completing the unbind.
func (c *CloudFoundrySpecification) getAppServiceBindings(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "counts" {
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("app_guids", appGUID).
			WithFilter("type", "app")
		raw, lerr := cfClient.ServiceCredentialBindings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, StAppServiceBindingsResponse{
			Resources:    []StServiceBinding{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	reqCtx := ctx.Request().Context()

	// Wire-contract passthrough on the primary fetch: forward client
	// per_page+page to a single /v3/service_credential_bindings call. When
	// the caller omits per_page, V3 server defaults apply.
	perPage, page, present := parsePerPageAndPage(ctx)
	primaryParams := applyPagingParams(
		capi.NewQueryParams().
			WithFilter("app_guids", appGUID).
			WithFilter("type", "app"),
		perPage, page, present,
	)
	rawBindings, listErr := cfClient.ServiceCredentialBindings().List(reqCtx, primaryParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	bindings := rawBindings.Resources

	// Collect the unique service-instance GUIDs referenced by this page of
	// bindings. The follow-up SI fetch is naturally bounded by perPage.
	siGUIDSet := make(map[string]struct{}, len(bindings))
	for _, b := range bindings {
		if guid := relationshipGUID(b.Relationships.ServiceInstance); guid != "" {
			siGUIDSet[guid] = struct{}{}
		}
	}
	siGUIDs := make([]string, 0, len(siGUIDSet))
	for g := range siGUIDSet {
		siGUIDs = append(siGUIDs, g)
	}

	// Batch-fetch service instances so the picker can display names + types.
	// Failure here is soft — fall back to rendering the binding's own name.
	siByGUID := make(map[string]capi.ServiceInstance, len(siGUIDs))
	if len(siGUIDs) > 0 {
		siParams := capi.NewQueryParams().
			WithPerPage(len(siGUIDs)).
			WithFilter("guids", siGUIDs...)
		if raw, sListErr := cfClient.ServiceInstances().List(reqCtx, siParams); sListErr == nil {
			for _, si := range raw.Resources {
				siByGUID[si.GUID] = si
			}
		}
	}

	out := make([]StServiceBinding, 0, len(bindings))
	for _, b := range bindings {
		out = append(out, toStServiceBinding(b, siByGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceBinding]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, rawBindings.Pagination.TotalResults),
	})
}

func toStServiceBinding(b capi.ServiceCredentialBinding, siByGUID map[string]capi.ServiceInstance) StServiceBinding {
	var appGUID string
	if b.Relationships.App != nil {
		appGUID = relationshipGUID(*b.Relationships.App)
	}
	siGUID := relationshipGUID(b.Relationships.ServiceInstance)
	siName := ""
	siType := ""
	if si, ok := siByGUID[siGUID]; ok {
		siName = si.Name
		siType = si.Type
	}
	// Fall back to the binding's own name if the SI name lookup failed.
	if siName == "" {
		siName = b.Name
	}
	return StServiceBinding{
		GUID:                b.GUID,
		Name:                b.Name,
		BindingType:         b.Type,
		AppGUID:             appGUID,
		ServiceInstanceGUID: siGUID,
		ServiceInstanceName: siName,
		ServiceInstanceType: siType,
		CreatedAt:           b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:           b.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
