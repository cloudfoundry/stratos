// src/jetstream/plugins/cloudfoundry/native_isolation_segments_reads.go
package cloudfoundry

import (
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeIsolationSegments handles GET /pp/v1/cf/isolation_segments/{cnsiGuid}.
//
// Returns every isolation segment registered on the foundation as flat
// StIsolationSegment DTOs. Foundations expose at most a handful of
// segments (often just the built-in `shared`) — single page is the
// common case — but the handler still honors the wire-contract paging
// passthrough.
func (c *CloudFoundrySpecification) getNativeIsolationSegments(ctx echo.Context) error {
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
		raw, lerr := cfClient.IsolationSegments().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StIsolationSegmentsResponse{
			Resources:    []StIsolationSegment{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.IsolationSegments().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StIsolationSegment, 0, len(raw.Resources))
	for _, seg := range raw.Resources {
		out = append(out, toStIsolationSegment(seg, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StIsolationSegment]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeIsolationSegmentDetail handles
// GET /pp/v1/cf/isolation_segments/{cnsiGuid}/{segmentGuid}.
//
// Returns a single isolation segment by GUID as a flat
// StIsolationSegment — the name-resolution lookup for anywhere a space
// or org surfaces its assigned segment GUID.
func (c *CloudFoundrySpecification) getNativeIsolationSegmentDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	segmentGUID := ctx.Param("segmentGuid")
	if cnsiGUID == "" || segmentGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and segmentGuid are required")
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

	seg, getErr := cfClient.IsolationSegments().Get(ctx.Request().Context(), segmentGUID)
	if getErr != nil {
		return handleCapiError(ctx, getErr)
	}

	return ctx.JSON(http.StatusOK, toStIsolationSegment(*seg, cnsiGUID))
}

// toStIsolationSegment maps a capi.IsolationSegment onto the Stratos-
// shape DTO. cnsiGUID is stamped onto the row for multi-CNSI keying,
// matching every other St* mapper.
func toStIsolationSegment(seg capi.IsolationSegment, cnsiGUID string) StIsolationSegment {
	return StIsolationSegment{
		GUID:      seg.GUID,
		Name:      seg.Name,
		CnsiGUID:  cnsiGUID,
		CreatedAt: seg.CreatedAt.Format(time.RFC3339),
		UpdatedAt: seg.UpdatedAt.Format(time.RFC3339),
	}
}
