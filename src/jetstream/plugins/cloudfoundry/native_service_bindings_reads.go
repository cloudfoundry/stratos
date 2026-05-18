// src/jetstream/plugins/cloudfoundry/native_service_bindings_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getAppServiceBindings handles
//
//	GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/service_bindings
//
// Returns the app's service-credential bindings (type=app only).
// Drives the app-detail Services tab + the delete-app picker.
//
// Four wire-shape tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//     Existing legacy shape preserved verbatim — counts probes
//     already wired across the frontend rely on it.
//   - base     — entity fields only; relationship refs are guid-only.
//     One CAPI call.
//   - summary  — base + serviceInstance.{name,type} + app.{name?} via
//     a single CAPI call with ?include=app,service_instance.
//     The included resources arrive on the v3 ListResponse
//     via ListResponse[T].Included (per the fork fix in
//     v3.216.4-fix-apps-delete.10).
//   - details  — TODO: B-fallback batch lookups for service_plan +
//     service_offering + service_broker (v3's binding
//     include only reaches `app, service_instance`, so the
//     broker chain needs a follow-up SI fetch with the full
//     include chain). Today details degrades to summary;
//     no consumer requests details on bindings yet.
//
// Soft-fail on the include join: a malformed entry is skipped and the
// row falls back to the binding's own name; the response still ships
// rather than 502'ing the whole tab.
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

	mode := parseReturnMode(ctx)

	if mode == ReturnCounts {
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("app_guids", appGUID).
			WithFilter("type", "app")
		raw, lerr := cfClient.ServiceCredentialBindings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		// Legacy flat envelope — preserved for ?return=counts callers.
		return ctx.JSON(http.StatusOK, struct {
			Resources    []StServiceCredentialBinding `json:"resources"`
			TotalResults int                          `json:"totalResults"`
		}{
			Resources:    []StServiceCredentialBinding{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	reqCtx := ctx.Request().Context()
	perPage, page, present := parsePerPageAndPage(ctx)
	primaryParams := applyPagingParams(
		capi.NewQueryParams().
			WithFilter("app_guids", appGUID).
			WithFilter("type", "app"),
		perPage, page, present,
	)
	// summary+ asks v3 to include `app, service_instance` so the joined
	// resources come back inline on the same call.
	if mode == ReturnSummary || mode == ReturnDetails {
		primaryParams = primaryParams.WithInclude("app", "service_instance")
	}

	rawBindings, listErr := cfClient.ServiceCredentialBindings().List(reqCtx, primaryParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	bindings := rawBindings.Resources

	// Decode the included joined resources for summary+.
	siByGUID := map[string]capi.ServiceInstance{}
	appByGUID := map[string]capi.App{}
	if mode == ReturnSummary || mode == ReturnDetails {
		siByGUID = serviceInstancesFromIncluded(rawBindings.Included)
		appByGUID = appsFromIncluded(rawBindings.Included)
	}

	out := make([]StServiceCredentialBinding, 0, len(bindings))
	for _, b := range bindings {
		out = append(out, toStServiceCredentialBinding(b, cnsiGUID, siByGUID, appByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceCredentialBinding]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, rawBindings.Pagination.TotalResults),
	})
}

// getServiceInstanceServiceBindings handles
//
//	GET /pp/v1/cf/service_instances/{cnsiGuid}/{instanceGuid}/service_bindings
//
// Inverse of getAppServiceBindings — returns the bindings *attached to a
// service instance* (type=app only). Drives the cf-spaces-service-instances
// table cell that lists the bound apps per service instance row, and the
// detach-apps modal that fans deletes out across the same set.
//
// Same four-tier ?return= contract as getAppServiceBindings:
//
//   - counts   — per_page=1 + flat {totalResults} envelope.
//   - base     — entity fields only.
//   - summary  — base + app.name + serviceInstance.{name,type} via
//     ?include=app,service_instance.
//   - details  — degrades to summary today (no consumer asks for details).
func (c *CloudFoundrySpecification) getServiceInstanceServiceBindings(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	instanceGUID := ctx.Param("instanceGuid")
	if cnsiGUID == "" || instanceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and instanceGuid are required")
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

	mode := parseReturnMode(ctx)

	if mode == ReturnCounts {
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("service_instance_guids", instanceGUID).
			WithFilter("type", "app")
		raw, lerr := cfClient.ServiceCredentialBindings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, struct {
			Resources    []StServiceCredentialBinding `json:"resources"`
			TotalResults int                          `json:"totalResults"`
		}{
			Resources:    []StServiceCredentialBinding{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	reqCtx := ctx.Request().Context()
	perPage, page, present := parsePerPageAndPage(ctx)
	primaryParams := applyPagingParams(
		capi.NewQueryParams().
			WithFilter("service_instance_guids", instanceGUID).
			WithFilter("type", "app"),
		perPage, page, present,
	)
	if mode == ReturnSummary || mode == ReturnDetails {
		primaryParams = primaryParams.WithInclude("app", "service_instance")
	}

	rawBindings, listErr := cfClient.ServiceCredentialBindings().List(reqCtx, primaryParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	bindings := rawBindings.Resources

	siByGUID := map[string]capi.ServiceInstance{}
	appByGUID := map[string]capi.App{}
	if mode == ReturnSummary || mode == ReturnDetails {
		siByGUID = serviceInstancesFromIncluded(rawBindings.Included)
		appByGUID = appsFromIncluded(rawBindings.Included)
	}

	out := make([]StServiceCredentialBinding, 0, len(bindings))
	for _, b := range bindings {
		out = append(out, toStServiceCredentialBinding(b, cnsiGUID, siByGUID, appByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceCredentialBinding]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, rawBindings.Pagination.TotalResults),
	})
}

// serviceInstancesFromIncluded decodes v3's `included.service_instances`
// block into a guid-keyed map. Set on summary+ requests via
// ?include=service_instance. Soft-fail on malformed entries.
func serviceInstancesFromIncluded(included map[string][]json.RawMessage) map[string]capi.ServiceInstance {
	out := map[string]capi.ServiceInstance{}
	if included == nil {
		return out
	}
	raws, ok := included["service_instances"]
	if !ok {
		return out
	}
	for _, raw := range raws {
		var si capi.ServiceInstance
		if err := json.Unmarshal(raw, &si); err == nil && si.GUID != "" {
			out[si.GUID] = si
		}
	}
	return out
}

// appsFromIncluded decodes v3's `included.apps` block into a guid-keyed
// map. Set on summary+ requests via ?include=app. Soft-fail on malformed
// entries.
func appsFromIncluded(included map[string][]json.RawMessage) map[string]capi.App {
	out := map[string]capi.App{}
	if included == nil {
		return out
	}
	raws, ok := included["apps"]
	if !ok {
		return out
	}
	for _, raw := range raws {
		var app capi.App
		if err := json.Unmarshal(raw, &app); err == nil && app.GUID != "" {
			out[app.GUID] = app
		}
	}
	return out
}

// toStServiceCredentialBinding maps a capi.ServiceCredentialBinding onto
// the Stratos-shape DTO at the requested tier. Tier policy mirrors the
// frontend type:
//
//   - base:    guid + cnsiGuid + type + serviceInstance.{guid} +
//     (app.{guid} for type=app) + createdAt
//   - summary: + name + serviceInstance.{name,type} + app.{name?} +
//     lastOperation + syslogDrainUrl
//   - details: + servicePlan / serviceOffering / broker (TODO — not
//     implemented; degrades to summary today).
func toStServiceCredentialBinding(
	b capi.ServiceCredentialBinding,
	cnsiGUID string,
	siByGUID map[string]capi.ServiceInstance,
	appByGUID map[string]capi.App,
	mode ReturnMode,
) StServiceCredentialBinding {
	siGUID := relationshipGUID(b.Relationships.ServiceInstance)
	out := StServiceCredentialBinding{
		GUID:            b.GUID,
		CnsiGUID:        cnsiGUID,
		Type:            b.Type,
		ServiceInstance: StServiceInstanceRef{GUID: siGUID},
		CreatedAt:       b.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if b.Relationships.App != nil {
		appGUID := relationshipGUID(*b.Relationships.App)
		if appGUID != "" {
			out.App = &StAppRef{GUID: appGUID}
		}
	}
	if mode == ReturnBase {
		return out
	}

	// summary+ adds the optional fields.
	out.Name = b.Name
	out.UpdatedAt = b.UpdatedAt.Format("2006-01-02T15:04:05Z")

	if si, ok := siByGUID[siGUID]; ok {
		out.ServiceInstance.Name = si.Name
		out.ServiceInstance.Type = si.Type
	}
	// Fall back to the binding's own name when the SI lookup fails so
	// the row still renders something the user can read.
	if out.ServiceInstance.Name == "" {
		out.ServiceInstance.Name = b.Name
	}

	if out.App != nil {
		if app, ok := appByGUID[out.App.GUID]; ok {
			out.App.Name = app.Name
		}
	}
	return out
}
