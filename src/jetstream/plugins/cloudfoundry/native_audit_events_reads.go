// src/jetstream/plugins/cloudfoundry/native_audit_events_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// maxAuditEventPages caps the pagination drain so a busy foundation
// doesn't lock up Jetstream for an unbounded period — at 500 events
// per page that's 25,000 events. The Events tab is approximated as
// "recent activity"; deep historical retrieval is a future detail-
// screen / search concern.
const maxAuditEventPages = 50

// getNativeAuditEvents handles GET /pp/v1/cf/audit_events/{cnsiGuid}.
//
// Returns recent audit events on the foundation as flat StAuditEvent
// DTOs. Drives the CF-level Events tab and the org / space / app event
// tabs (which apply per-page filtering via the signal-config service's
// basePredicate). Read-only — there are no writes to surface.
//
// Implementation: CF v3's audit events resource is served by GET
// /v3/audit_events. We page through results — capped at
// maxAuditEventPages so the drain stays bounded — mapping
// capi.AuditEvent → StAuditEvent along the way and stamping cnsiGuid
// on each row.
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

	resources := make([]capi.AuditEvent, 0)
	page := 1
	for page <= maxAuditEventPages {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, listErr := cfClient.AuditEvents().List(ctx.Request().Context(), params)
		if listErr != nil {
			return handleCapiError(ctx, listErr)
		}
		resources = append(resources, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}

	out := make([]StAuditEvent, 0, len(resources))
	for _, ev := range resources {
		out = append(out, toStAuditEvent(ev, cnsiGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StAuditEventsResponse{
		Resources:    out,
		TotalResults: len(out),
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
