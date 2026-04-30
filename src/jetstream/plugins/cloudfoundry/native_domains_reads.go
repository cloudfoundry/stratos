// src/jetstream/plugins/cloudfoundry/native_domains_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeDomains handles GET /pp/v1/cf/domains/{cnsiGuid}.
// Bounded list with ?guids batch + ?return=counts fast path. Single
// CAPI call per request — no auto-drain.
func (c *CloudFoundrySpecification) getNativeDomains(ctx echo.Context) error {
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
		raw, lerr := cfClient.Domains().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StDomainsResponse{
			Resources:    []StDomain{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)

	if rawGuids := ctx.QueryParam("guids"); rawGuids != "" {
		guids := splitNonEmpty(rawGuids, ",")
		if len(guids) > 0 {
			params = params.WithFilter("guids", guids...)
		}
	}

	raw, lerr := cfClient.Domains().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resources := make([]StDomain, 0, len(raw.Resources))
	for _, d := range raw.Resources {
		resources = append(resources, toStDomain(d, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StDomain]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeOrgDomains handles GET /pp/v1/cf/org/{cnsiGuid}/{orgGuid}/private_domains.
// Returns only private domains (owned by the org) — V3 collapses
// `/v2/organizations/:guid/private_domains` into `/v3/domains?organization_guids=:guid`,
// which mixes owned + shared. Server-side filter to OwningOrgGUID==orgGuid.
func (c *CloudFoundrySpecification) getNativeOrgDomains(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	if cnsiGUID == "" || orgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and orgGuid are required")
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

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(
		capi.NewQueryParams().WithFilter("organization_guids", orgGUID),
		perPage, page, present,
	)

	raw, lerr := cfClient.Domains().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resources := make([]StDomain, 0, len(raw.Resources))
	for _, d := range raw.Resources {
		st := toStDomain(d, cnsiGUID)
		if st.OwningOrgGUID == orgGUID {
			resources = append(resources, st)
		}
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StDomain]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, len(resources)),
	})
}

// getNativeDomainDetail handles GET /pp/v1/cf/domains/{cnsiGuid}/{domainGuid}.
// Single-resource sibling for detail views.
func (c *CloudFoundrySpecification) getNativeDomainDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	domainGUID := ctx.Param("domainGuid")
	if cnsiGUID == "" || domainGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and domainGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	d, gerr := cfClient.Domains().Get(ctx.Request().Context(), domainGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStDomain(*d, cnsiGUID))
}

// toStDomain flattens a capi.Domain into the Stratos-shape DTO. The v3
// envelope's nested relationships and router_group sub-blocks become
// flat top-level fields.
func toStDomain(d capi.Domain, cnsiGUID string) StDomain {
	owningOrgGUID := ""
	if d.Relationships.Organization != nil {
		owningOrgGUID = relationshipGUID(*d.Relationships.Organization)
	}

	sharedOrgGUIDs := []string{}
	if d.Relationships.SharedOrganizations != nil {
		for _, s := range d.Relationships.SharedOrganizations.Data {
			if s.GUID != "" {
				sharedOrgGUIDs = append(sharedOrgGUIDs, s.GUID)
			}
		}
	}

	routerGroupGUID := ""
	if d.RouterGroup != nil {
		routerGroupGUID = d.RouterGroup.GUID
	}

	supportedProtocols := d.SupportedProtocols
	if supportedProtocols == nil {
		supportedProtocols = []string{}
	}

	return StDomain{
		GUID:               d.GUID,
		Name:               d.Name,
		Internal:           d.Internal,
		RouterGroupGUID:    routerGroupGUID,
		SupportedProtocols: supportedProtocols,
		OwningOrgGUID:      owningOrgGUID,
		SharedOrgGUIDs:     sharedOrgGUIDs,
		Labels:             metaLabels(d.Metadata),
		Annotations:        metaAnnotations(d.Metadata),
		CnsiGUID:           cnsiGUID,
		CreatedAt:          d.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          d.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
