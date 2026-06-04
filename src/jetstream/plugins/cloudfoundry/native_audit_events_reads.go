// src/jetstream/plugins/cloudfoundry/native_audit_events_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeAuditEvents handles GET /pp/v1/cf/audit_events/{cnsiGuid}.
//
// Returns one page of audit events on the foundation as flat StAuditEvent
// DTOs. Drives the CF-level Events tab and the org / space / app event
// tabs (which apply per-page filtering via the signal-config service's
// basePredicate). Read-only — there are no writes to surface.
//
// Wire-contract passthrough: ?per_page and ?page forward verbatim to a
// single /v3/audit_events CAPI call (V3 defaults applied when absent).
// Audit-event tables can carry tens of thousands of rows on busy
// foundations — the previous full-drain (capped at 25k) breached the
// gorouter ceiling. The frontend now drives paging via pagination links.
//
// ?return=counts fast path: per_page=1, returns just the totalResults so
// badges/summaries don't have to fetch a full page.
func (c *CloudFoundrySpecification) getNativeAuditEvents(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
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
		params := capi.NewQueryParams().WithPerPage(1)
		raw, lerr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StAuditEventsResponse{
			Resources:    []StAuditEvent{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	// Newest-first. Without this CF returns its default order and recent events
	// land on the last page; the per-app tab (which filters this foundation-wide
	// stream client-side) then never sees today's events unless it drains to the
	// end. Mirrors the org/space audit-event handlers.
	params := applyPagingParams(capi.NewQueryParams().WithOrderBy("-created_at"), perPage, page, present)
	reqCtx := ctx.Request().Context()
	raw, listErr := cfClient.AuditEvents().List(reqCtx, params)
	// The per-CF endpoint token has a ~20-minute life; a request that fires while
	// a token refresh is mid-flight loses the race and 401s (worst on this long
	// foundation-wide drain). By retry time the refresh has landed, so rebuild the
	// client to pick up the fresh token and retry the list once.
	if listErr != nil && statusFromCapiError(listErr) == http.StatusUnauthorized {
		if rc, rerr := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID); rerr == nil {
			raw, listErr = rc.AuditEvents().List(reqCtx, params)
		}
	}
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StAuditEvent, 0, len(raw.Resources))
	for _, ev := range raw.Resources {
		out = append(out, toStAuditEvent(ev, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StAuditEvent]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeOrgAuditEvents handles
// GET /pp/v1/cf/org/{cnsiGuid}/{orgGuid}/events.
//
// Org-scoped variant of getNativeAuditEvents — same passthrough +
// ?return=counts contract, with an additional organization_guids filter
// applied upstream so V3 returns only events scoped to the requested org.
// Sort is fixed to -created_at (newest first) since org-event consumers
// always show the most recent activity at the top.
func (c *CloudFoundrySpecification) getNativeOrgAuditEvents(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}
	if orgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "orgGuid is required")
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
			WithFilter("organization_guids", orgGUID)
		raw, lerr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StAuditEventsResponse{
			Resources:    []StAuditEvent{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(
		capi.NewQueryParams().
			WithFilter("organization_guids", orgGUID).
			WithOrderBy("-created_at"),
		perPage, page, present,
	)
	raw, listErr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StAuditEvent, 0, len(raw.Resources))
	for _, ev := range raw.Resources {
		out = append(out, toStAuditEvent(ev, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StAuditEvent]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeSpaceAuditEvents handles
// GET /pp/v1/cf/space/{cnsiGuid}/{spaceGuid}/events.
//
// Space-scoped variant — symmetric to getNativeOrgAuditEvents, filters
// upstream by space_guids instead. Same passthrough + ?return=counts
// contract.
func (c *CloudFoundrySpecification) getNativeSpaceAuditEvents(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}
	if spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "spaceGuid is required")
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
			WithFilter("space_guids", spaceGUID)
		raw, lerr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StAuditEventsResponse{
			Resources:    []StAuditEvent{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(
		capi.NewQueryParams().
			WithFilter("space_guids", spaceGUID).
			WithOrderBy("-created_at"),
		perPage, page, present,
	)
	raw, listErr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StAuditEvent, 0, len(raw.Resources))
	for _, ev := range raw.Resources {
		out = append(out, toStAuditEvent(ev, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StAuditEvent]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStAuditEvent maps a capi.AuditEvent onto a Stratos-shape
// StAuditEvent. Space/Organization are *T (nullable when the event
// isn't scoped to one — e.g. user.login); we coerce nil → "" for
// flat-string wire shape. Data marshals to a JSON string so the wire
// stays opaque-but-parseable; the future detail screen handles it.
func toStAuditEvent(ev capi.AuditEvent, cnsiGUID string) StAuditEvent {
	out := StAuditEvent{
		GUID:       ev.GUID,
		Type:       ev.Type,
		ActorGUID:  ev.Actor.GUID,
		ActorType:  ev.Actor.Type,
		ActorName:  ev.Actor.Name,
		TargetGUID: ev.Target.GUID,
		TargetType: ev.Target.Type,
		TargetName: ev.Target.Name,
		CnsiGUID:   cnsiGUID,
		CreatedAt:  ev.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:  ev.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if ev.Space != nil {
		out.SpaceGUID = ev.Space.GUID
		out.SpaceName = ev.Space.Name
	}
	if ev.Organization != nil {
		out.OrganizationGUID = ev.Organization.GUID
		out.OrganizationName = ev.Organization.Name
	}
	if data, err := json.Marshal(ev.Data); err == nil {
		out.Data = string(data)
	} else {
		out.Data = "{}"
	}
	return out
}
