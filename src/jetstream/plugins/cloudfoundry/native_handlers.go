// src/jetstream/plugins/cloudfoundry/native_handlers.go
package cloudfoundry

import (
	"context"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

const stratosSchemaVersion = "1"

// nativeCFProxy is the narrow set of portal-proxy operations the native handlers need.
// Defined as an interface so tests can provide a stub without implementing all of api.PortalProxy.
type nativeCFProxy interface {
	GetCNSIRecord(guid string) (api.CNSIRecord, error)
	GetCNSITokenRecord(cnsiGUID string, userGUID string) (api.TokenRecord, bool)
	GetSessionStringValue(ctx echo.Context, key string) (string, error)
}

// getUserGUID extracts the logged-in user GUID from the session.
func (c *CloudFoundrySpecification) getUserGUID(ctx echo.Context) (string, error) {
	return c.nativeProxy().GetSessionStringValue(ctx, "user_id")
}

// nativeProxy returns the portal proxy cast to nativeCFProxy.
// Allows tests to replace it by setting c.testProxy.
func (c *CloudFoundrySpecification) nativeProxy() nativeCFProxy {
	if c.testProxy != nil {
		return c.testProxy
	}
	return c.portalProxy
}

// newCapiClient creates a capi client authenticated with Jetstream's stored token.
// Uses cfclient.NewWithToken so no UAA discovery occurs — the token is passed directly.
func newCapiClient(ctx context.Context, proxy nativeCFProxy, cnsiGUID, userGUID string) (capi.Client, error) {
	cnsiRecord, err := proxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}
	tokenRecord, ok := proxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
	}
	client, err := cfclient.NewWithToken(ctx, cnsiRecord.APIEndpoint.String(), tokenRecord.AuthToken)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	return client, nil
}

// normaliseStringMap ensures nil maps are returned as empty maps (not null in JSON).
func normaliseStringMap(m map[string]string) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return m
}

// metaLabels/metaAnnotations safely extract labels/annotations from a *capi.Metadata (may be nil).
func metaLabels(m *capi.Metadata) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return normaliseStringMap(m.Labels)
}

func metaAnnotations(m *capi.Metadata) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return normaliseStringMap(m.Annotations)
}

// relationshipGUID safely extracts a GUID from a capi.Relationship whose Data pointer may be nil.
func relationshipGUID(rel capi.Relationship) string {
	if rel.Data == nil {
		return ""
	}
	return rel.Data.GUID
}

// ---- handlers ----

// fullPagePerRequest is the page size used when draining every page of a CF
// list endpoint. The loop below walks Pagination.TotalPages so per_page is
// just an optimization hint; foundations smaller than this finish in one
// round trip. 5000 caused adepttech /v3/spaces to take ~27s per request —
// just under the 30s CAPI client timeout — so reduced to 500 for safety
// margin. Round trips scale linearly but each is well bounded.
const fullPagePerRequest = 500

// listAllOrgs loops every page of /v3/organizations and returns the full set
// plus the total count from the first response.
func listAllOrgs(ctx context.Context, cfClient capi.Client) ([]capi.Organization, int, error) {
	var all []capi.Organization
	totalResults := 0
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.Organizations().List(ctx, params)
		if err != nil {
			return nil, 0, err
		}
		if page == 1 {
			totalResults = raw.Pagination.TotalResults
			all = make([]capi.Organization, 0, totalResults)
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return all, totalResults, nil
}

// listAllApps loops every page of /v3/apps and returns the full set plus
// the total count.
func listAllApps(ctx context.Context, cfClient capi.Client) ([]capi.App, int, error) {
	var all []capi.App
	totalResults := 0
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.Apps().List(ctx, params)
		if err != nil {
			return nil, 0, err
		}
		if page == 1 {
			totalResults = raw.Pagination.TotalResults
			all = make([]capi.App, 0, totalResults)
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return all, totalResults, nil
}

// listAllSpaces loops every page of /v3/spaces and returns the full set plus
// the total count. Optional orgGUIDFilter narrows to spaces in the given orgs.
func listAllSpaces(ctx context.Context, cfClient capi.Client, orgGUIDFilter []string) ([]capi.Space, int, error) {
	var all []capi.Space
	totalResults := 0
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		if len(orgGUIDFilter) > 0 {
			params = params.WithFilter("organization_guids", orgGUIDFilter...)
		}
		params.Page = page
		raw, err := cfClient.Spaces().List(ctx, params)
		if err != nil {
			return nil, 0, err
		}
		if page == 1 {
			totalResults = raw.Pagination.TotalResults
			all = make([]capi.Space, 0, totalResults)
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return all, totalResults, nil
}

func toStOrg(r capi.Organization) StOrg {
	return StOrg{
		GUID:        r.GUID,
		Name:        r.Name,
		Status:      "active",
		Labels:      metaLabels(r.Metadata),
		Annotations: metaAnnotations(r.Metadata),
		CreatedAt:   r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   r.UpdatedAt.Format(time.RFC3339),
	}
}

func toStApp(r capi.App) StApp {
	return StApp{
		GUID:      r.GUID,
		Name:      r.Name,
		State:     r.State,
		SpaceGUID: relationshipGUID(r.Relationships.Space),
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}

func toStSpace(r capi.Space) StSpace {
	return StSpace{
		GUID:      r.GUID,
		Name:      r.Name,
		OrgGUID:   relationshipGUID(r.Relationships.Organization),
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}

// getNativeOrgs dispatches on ?return=
//   - counts: per_page=1, totalResults only
//   - (none): full list, paginated
func (c *CloudFoundrySpecification) getNativeOrgs(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
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
		raw, err := cfClient.Organizations().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		orgs := make([]StOrg, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			orgs = append(orgs, toStOrg(r))
		}
		return ctx.JSON(http.StatusOK, StOrgsResponse{Resources: orgs, TotalResults: raw.Pagination.TotalResults})
	}

	resources, totalResults, err := listAllOrgs(ctx.Request().Context(), cfClient)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	orgs := make([]StOrg, 0, len(resources))
	for _, r := range resources {
		orgs = append(orgs, toStOrg(r))
	}
	return ctx.JSON(http.StatusOK, StOrgsResponse{Resources: orgs, TotalResults: totalResults})
}

// getNativeApps dispatches on ?return=
//   - counts: per_page=1, totalResults only
//   - recent: per_page=10, order_by=-updated_at (top 10 most recently pushed)
//   - summary: Stratos-shape paged response with paging/sort/filter params
//     (WU 3 — see native_apps_summary.go for handler)
//   - (none): full list, paginated
func (c *CloudFoundrySpecification) getNativeApps(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	switch ctx.QueryParam("return") {
	case "counts":
		params := capi.NewQueryParams().WithPerPage(1)
		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		apps := make([]StApp, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			apps = append(apps, toStApp(r))
		}
		return ctx.JSON(http.StatusOK, StAppsResponse{Resources: apps, TotalResults: raw.Pagination.TotalResults})

	case "recent":
		params := capi.NewQueryParams().WithPerPage(10).WithOrderBy("-updated_at")
		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		apps := make([]StApp, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			apps = append(apps, toStApp(r))
		}
		return ctx.JSON(http.StatusOK, StAppsResponse{Resources: apps, TotalResults: raw.Pagination.TotalResults})

	case "summary":
		return c.getNativeAppsSummary(ctx, cfClient)
	}

	resources, totalResults, err := listAllApps(ctx.Request().Context(), cfClient)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	apps := make([]StApp, 0, len(resources))
	for _, r := range resources {
		apps = append(apps, toStApp(r))
	}
	return ctx.JSON(http.StatusOK, StAppsResponse{Resources: apps, TotalResults: totalResults})
}

// getNativeSpaces returns every space in the foundation, paginated.
func (c *CloudFoundrySpecification) getNativeSpaces(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	resources, totalResults, err := listAllSpaces(ctx.Request().Context(), cfClient, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	spaces := make([]StSpace, 0, len(resources))
	for _, r := range resources {
		spaces = append(spaces, toStSpace(r))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSpacesResponse{Resources: spaces, TotalResults: totalResults})
}

func (c *CloudFoundrySpecification) getNativeRouteCount(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	// Request per_page=1 — we only need the total count, not all resources.
	params := capi.NewQueryParams().WithPerPage(1)
	raw, err := cfClient.Routes().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StRoutesResponse{
		TotalResults: raw.Pagination.TotalResults,
	})
}

func (c *CloudFoundrySpecification) getNativeOrgDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	r, err := cfClient.Organizations().Get(ctx.Request().Context(), orgGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	detail := StOrgDetail{
		StOrg: StOrg{
			GUID:        r.GUID,
			Name:        r.Name,
			Status:      "active",
			Labels:      metaLabels(r.Metadata),
			Annotations: metaAnnotations(r.Metadata),
			CreatedAt:   r.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   r.UpdatedAt.Format(time.RFC3339),
		},
		Spaces: []StSpace{},
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, detail)
}

func (c *CloudFoundrySpecification) getNativeOrgSpaces(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	resources, totalResults, err := listAllSpaces(ctx.Request().Context(), cfClient, []string{orgGUID})
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	spaces := make([]StSpace, 0, len(resources))
	for _, r := range resources {
		spaces = append(spaces, toStSpace(r))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSpacesResponse{Resources: spaces, TotalResults: totalResults})
}
