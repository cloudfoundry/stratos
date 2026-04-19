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

	// Request per_page=1 — home card only needs the count. Detailed org data is
	// fetched separately (org detail handler) when the user navigates into one.
	params := capi.NewQueryParams().WithPerPage(1)
	raw, err := cfClient.Organizations().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	orgs := make([]StOrg, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		orgs = append(orgs, StOrg{
			GUID:        r.GUID,
			Name:        r.Name,
			Status:      "active",
			Labels:      metaLabels(r.Metadata),
			Annotations: metaAnnotations(r.Metadata),
			CreatedAt:   r.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   r.UpdatedAt.Format(time.RFC3339),
		})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StOrgsResponse{
		Resources:    orgs,
		TotalResults: raw.Pagination.TotalResults,
	})
}

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

	// Request per_page=10 with most-recent-first ordering — home card shows up to
	// 10 recent apps and the total count. Full app list is fetched separately
	// when the user navigates to the app wall.
	params := capi.NewQueryParams().WithPerPage(10).WithOrderBy("-updated_at")
	raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	apps := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		apps = append(apps, StApp{
			GUID:      r.GUID,
			Name:      r.Name,
			State:     r.State,
			SpaceGUID: relationshipGUID(r.Relationships.Space),
			CreatedAt: r.CreatedAt.Format(time.RFC3339),
			UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
		})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StAppsResponse{
		Resources:    apps,
		TotalResults: raw.Pagination.TotalResults,
	})
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

	params := capi.NewQueryParams().WithPerPage(5000).WithFilter("organization_guids", orgGUID)
	raw, err := cfClient.Spaces().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	spaces := make([]StSpace, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		spaces = append(spaces, StSpace{
			GUID:      r.GUID,
			Name:      r.Name,
			OrgGUID:   relationshipGUID(r.Relationships.Organization),
			CreatedAt: r.CreatedAt.Format(time.RFC3339),
			UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
		})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSpacesResponse{
		Resources:    spaces,
		TotalResults: raw.Pagination.TotalResults,
	})
}
