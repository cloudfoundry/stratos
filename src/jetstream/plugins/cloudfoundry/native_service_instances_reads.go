// src/jetstream/plugins/cloudfoundry/native_service_instances_reads.go
package cloudfoundry

import (
	"context"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceInstances handles GET /pp/v1/cf/service_instances/{cnsiGuid}.
//
// Returns every service instance visible to the user — both managed (broker-
// provisioned) and user-provided — across the foundation. Drives the Stratos
// /services list page.
//
// CF v3 returns both kinds in a single /v3/service_instances list, each
// carrying a `type` discriminator ("managed" or "user-provided"); the
// handler keeps both and stamps the type on each row so the UI can label /
// colour them differently.
//
// Two response shapes, dispatched on ?return=
//   - summary: Stratos-shape paged response (StratosPagedResponse[StServiceInstance]).
//     Used by CnsiServiceInstancesSource via the CnsiEntitySource base class,
//     which expects a `pagination` envelope to determine when to stop paging.
//     We drain CAPI server-side and synthesise a single fully-populated page
//     so the frontend's first iteration completes the load — same shape as
//     native_service_offerings_reads.go.
//   - (none): flat StServiceInstancesResponse with totalResults only.
//     Reserved for future direct callers that don't need pagination meta.
//
// Two-step join — service_plan -> service_offering — to resolve the
// offering NAME (e.g. "redis") for managed instances:
//  1. /v3/service_instances — drain all pages (managed + UPS together).
//  2. Collect unique service-plan GUIDs from managed instances and fetch
//     /v3/service_plans?guids=… — gives us the plan -> offering relationship.
//  3. Collect unique service-offering GUIDs from those plans and fetch
//     /v3/service_offerings?guids=… — gives us the offering name.
//
// Both join fetches are soft-fail: if either errors, the offering name
// renders empty rather than 502'ing the whole page. User-provided
// instances never carry a plan/offering and always render with empty
// offering name (the UI labels them "User Provided" instead).
func (c *CloudFoundrySpecification) getNativeServiceInstances(ctx echo.Context) error {
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

	instances, err := listAllServiceInstances(ctx.Request().Context(), cfClient)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	// Collect unique service-plan GUIDs from the managed instances.
	planGUIDSet := make(map[string]struct{}, len(instances))
	for _, si := range instances {
		if si.Relationships.ServicePlan == nil {
			continue
		}
		if guid := relationshipGUID(*si.Relationships.ServicePlan); guid != "" {
			planGUIDSet[guid] = struct{}{}
		}
	}
	planGUIDs := make([]string, 0, len(planGUIDSet))
	for g := range planGUIDSet {
		planGUIDs = append(planGUIDs, g)
	}

	// Batch-fetch service plans so we can resolve plan -> offering. Soft-fail:
	// if the plan-list errors, managed instances render with empty offering
	// name rather than the whole /services page failing.
	planByGUID := make(map[string]capi.ServicePlan, len(planGUIDs))
	if len(planGUIDs) > 0 {
		planParams := capi.NewQueryParams().
			WithPerPage(fullPagePerRequest).
			WithFilter("guids", planGUIDs...)
		if raw, listErr := cfClient.ServicePlans().List(ctx.Request().Context(), planParams); listErr == nil {
			for _, p := range raw.Resources {
				planByGUID[p.GUID] = p
			}
		}
	}

	// Collect the unique offering GUIDs referenced by the plans we resolved.
	offeringGUIDSet := make(map[string]struct{}, len(planByGUID))
	for _, p := range planByGUID {
		if guid := relationshipGUID(p.Relationships.ServiceOffering); guid != "" {
			offeringGUIDSet[guid] = struct{}{}
		}
	}
	offeringGUIDs := make([]string, 0, len(offeringGUIDSet))
	for g := range offeringGUIDSet {
		offeringGUIDs = append(offeringGUIDs, g)
	}

	// Batch-fetch offerings to grab the name. Same soft-fail policy.
	offeringByGUID := make(map[string]capi.ServiceOffering, len(offeringGUIDs))
	if len(offeringGUIDs) > 0 {
		offeringParams := capi.NewQueryParams().
			WithPerPage(fullPagePerRequest).
			WithFilter("guids", offeringGUIDs...)
		if raw, listErr := cfClient.ServiceOfferings().List(ctx.Request().Context(), offeringParams); listErr == nil {
			for _, o := range raw.Resources {
				offeringByGUID[o.GUID] = o
			}
		}
	}

	out := make([]StServiceInstance, 0, len(instances))
	for _, si := range instances {
		out = append(out, toStServiceInstance(si, cnsiGUID, planByGUID, offeringByGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "summary" {
		// Single-page Stratos paged response. CnsiEntitySource pages until
		// pagination.next is nil; emitting one fully-drained page = one
		// frontend iteration = done.
		response := StratosPagedResponse[StServiceInstance]{
			Resources:  out,
			Pagination: BuildPaginationMeta(ctx, 1, len(out), len(out)),
		}
		return ctx.JSON(http.StatusOK, response)
	}

	return ctx.JSON(http.StatusOK, StServiceInstancesResponse{
		Resources:    out,
		TotalResults: len(out),
	})
}

// listAllServiceInstances drains /v3/service_instances and returns every
// instance — managed and user-provided. Uses sequential pagination; the
// catalog of instances is small enough at typical CF scale that parallel
// fetches aren't worth the added complexity. Mirrors the offerings drain.
func listAllServiceInstances(ctx context.Context, cfClient capi.Client) ([]capi.ServiceInstance, error) {
	all := make([]capi.ServiceInstance, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.ServiceInstances().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}
	return all, nil
}

// toStServiceInstance maps a capi.ServiceInstance onto the Stratos-shape DTO,
// resolving offering name via the plan -> offering chain. cnsiGUID is stamped
// onto the row so multi-CNSI rows + favorites/links can be keyed by
// (cnsi, instance) without threading the endpoint through every closure.
//
// Tags is normalised to a non-nil slice so JSON marshals as `[]` rather than
// `null` for instances the broker tagged with nothing — same convention as
// StServiceOffering.
func toStServiceInstance(
	si capi.ServiceInstance,
	cnsiGUID string,
	planByGUID map[string]capi.ServicePlan,
	offeringByGUID map[string]capi.ServiceOffering,
) StServiceInstance {
	spaceGUID := relationshipGUID(si.Relationships.Space)
	planGUID := ""
	if si.Relationships.ServicePlan != nil {
		planGUID = relationshipGUID(*si.Relationships.ServicePlan)
	}

	offeringGUID := ""
	offeringName := ""
	if planGUID != "" {
		if plan, ok := planByGUID[planGUID]; ok {
			offeringGUID = relationshipGUID(plan.Relationships.ServiceOffering)
			if offering, ok := offeringByGUID[offeringGUID]; ok {
				offeringName = offering.Name
			}
		}
	}

	tags := si.Tags
	if tags == nil {
		tags = []string{}
	}

	dashboardURL := ""
	if si.DashboardURL != nil {
		dashboardURL = *si.DashboardURL
	}

	syslogDrainURL := ""
	if si.SyslogDrainURL != nil {
		syslogDrainURL = *si.SyslogDrainURL
	}
	routeServiceURL := ""
	if si.RouteServiceURL != nil {
		routeServiceURL = *si.RouteServiceURL
	}

	lastOpType := ""
	lastOpState := ""
	lastOpDescription := ""
	lastOpUpdatedAt := ""
	if si.LastOperation != nil {
		lastOpType = si.LastOperation.Type
		lastOpState = si.LastOperation.State
		lastOpDescription = si.LastOperation.Description
		if si.LastOperation.UpdatedAt != nil {
			lastOpUpdatedAt = si.LastOperation.UpdatedAt.Format(time.RFC3339)
		}
	}

	updatedAt := ""
	if !si.UpdatedAt.IsZero() {
		updatedAt = si.UpdatedAt.Format(time.RFC3339)
	}

	return StServiceInstance{
		GUID:                si.GUID,
		Name:                si.Name,
		Type:                si.Type,
		CnsiGUID:            cnsiGUID,
		SpaceGUID:           spaceGUID,
		ServicePlanGUID:     planGUID,
		ServiceOfferingGUID: offeringGUID,
		ServiceOfferingName: offeringName,
		Tags:                tags,
		DashboardURL:        dashboardURL,
		SyslogDrainURL:      syslogDrainURL,
		RouteServiceURL:     routeServiceURL,
		LastOpType:          lastOpType,
		LastOpState:         lastOpState,
		LastOpDescription:   lastOpDescription,
		LastOpUpdatedAt:     lastOpUpdatedAt,
		CreatedAt:           si.CreatedAt.Format(time.RFC3339),
		UpdatedAt:           updatedAt,
	}
}
