// src/jetstream/plugins/cloudfoundry/native_apps_revisions_v3.go
//
// V3-native handler for the App Revisions tab. The frontend renders one
// merged view from three CAPI sources, so Jetstream fans them out
// concurrently and projects a single response — latency is max(three),
// not sum(three).
//
//   - GET /v3/apps/:guid/revisions          — paginated list of all revisions
//   - GET /v3/apps/:guid/revisions/deployed — currently deployed revision(s);
//     normally one, but rolling/canary deployments can briefly show two
//   - GET /v3/apps/:guid/features/revisions — boolean feature flag (whether
//     CF should record a new revision on every droplet/env change)
//
// Soft-fail policy: only the LIST is load-bearing. Failure of `deployed`
// or `features` degrades to partial-data flags so the page still renders.
// Hard-fail of LIST surfaces via handleCapiError.
package cloudfoundry

import (
	"context"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"
)

// RevisionsResponse is the JSON envelope returned by
// GET /pp/v1/cf/apps/:cnsiGuid/:appGuid/revisions.
//
// Revisions is the full list (all pages drained) with a deployed flag
// merged from the deployed-set call. FeatureEnabled mirrors the app's
// `revisions` feature flag. Partial signals which sub-calls degraded —
// the frontend uses these to render greyed-out tristate cells with
// "Not Available" messaging instead of falsely zeroed data.
type RevisionsResponse struct {
	Revisions      []RevisionWithDeployed `json:"revisions"`
	FeatureEnabled bool                   `json:"featureEnabled"`
	Partial        PartialFlags           `json:"partial"`
}

// RevisionWithDeployed wraps a capi.Revision with a Deployed flag set
// from membership in /v3/apps/:guid/revisions/deployed. Embedded so the
// wire shape is the standard v3 revision envelope plus the one extra
// field — frontend code can decode revisions through the existing capi
// type with a thin top-level wrapper.
type RevisionWithDeployed struct {
	*capi.Revision
	Deployed bool `json:"deployed"`
}

// PartialFlags reports which optional CAPI sub-calls failed. The frontend
// keys tristate "Not Available" rendering off these — DeployedUnknown=true
// means we couldn't determine which revision is live (Deployed flag is
// false on every row but that's "unknown" not "no"); FeatureUnknown=true
// means we couldn't tell whether the feature is on (FeatureEnabled is
// false but treat as unknown).
type PartialFlags struct {
	DeployedUnknown bool `json:"deployedUnknown"`
	FeatureUnknown  bool `json:"featureUnknown"`
}

// getAppRevisions handles GET /pp/v1/cf/apps/:cnsiGuid/:appGuid/revisions.
//
// Extracts cnsiGuid+appGuid from echo, builds an authenticated capi
// client, and delegates to assembleRevisions for the orchestration.
// Route registration lives in native_routes.go (Task 9).
func (c *CloudFoundrySpecification) getAppRevisions(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing cnsiGuid")
	}
	appGUID := ctx.Param("appGuid")
	if appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing appGuid")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	resp, err := assembleRevisions(reqCtx, cfClient, appGUID)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, resp)
}

// assembleRevisions runs the three CAPI calls concurrently via errgroup
// and merges the results into the RevisionsResponse shape. Pulled out
// of the echo handler so tests can drive it with a mocked CAPI server
// and a real capi.Client without round-tripping echo.
//
// Hard-fail policy:
//   - LIST is load-bearing: a non-nil error from listAllRevisionsForApp
//     short-circuits and is returned to the caller.
//   - DEPLOYED and FEATURE are soft: errors flip the corresponding
//     PartialFlags bit and the response is still returned successfully.
//
// All three calls run on goroutines from a single errgroup. Because we
// only return the LIST error from g.Wait, soft-fail paths set their
// flags directly and return nil so peers don't get cancelled. The
// inverse case — a LIST failure cancels in-flight DEPLOYED and FEATURE
// calls via gctx — is harmless: their PartialFlags are populated from
// the closure-scoped err vars but discarded, since listErr trumps
// everything and is the value returned to the caller.
func assembleRevisions(ctx context.Context, client capi.Client, appGUID string) (*RevisionsResponse, error) {
	var (
		listResources []capi.Revision
		deployedSet   map[string]struct{}
		feature       *capi.AppFeature
		listErr       error
		deployedErr   error
		featureErr    error
	)

	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		var err error
		listResources, err = listAllRevisionsForApp(gctx, client, appGUID)
		if err != nil {
			listErr = err
			return err
		}
		return nil
	})

	g.Go(func() error {
		raw, err := client.Revisions().GetDeployedForApp(gctx, appGUID)
		if err != nil {
			deployedErr = err
			return nil
		}
		deployedSet = make(map[string]struct{}, len(raw.Resources))
		for _, r := range raw.Resources {
			deployedSet[r.GUID] = struct{}{}
		}
		return nil
	})

	g.Go(func() error {
		f, err := client.Apps().GetFeature(gctx, appGUID, "revisions")
		if err != nil {
			featureErr = err
			return nil
		}
		feature = f
		return nil
	})

	if err := g.Wait(); err != nil {
		// LIST is the only call that returns its error — its failure
		// trumps any partial data.
		if listErr != nil {
			return nil, listErr
		}
		return nil, err
	}

	rows := make([]RevisionWithDeployed, 0, len(listResources))
	for i := range listResources {
		r := &listResources[i]
		_, deployed := deployedSet[r.GUID]
		rows = append(rows, RevisionWithDeployed{
			Revision: r,
			Deployed: deployed,
		})
	}

	resp := &RevisionsResponse{
		Revisions: rows,
		Partial: PartialFlags{
			DeployedUnknown: deployedErr != nil,
			FeatureUnknown:  featureErr != nil,
		},
	}
	if feature != nil {
		resp.FeatureEnabled = feature.Enabled
	}
	return resp, nil
}

// listAllRevisionsForApp drains every page of /v3/apps/:guid/revisions.
// Page 1 is fetched synchronously to learn TotalPages, then pages 2..N
// fan out under a bounded errgroup mirroring listAllRoutes. fw-capi
// surfaces a single page per ListForApp call, so the drain has to live
// at this layer.
func listAllRevisionsForApp(ctx context.Context, client capi.Client, appGUID string) ([]capi.Revision, error) {
	firstParams := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
	firstParams.Page = 1
	first, err := client.Revisions().ListForApp(ctx, appGUID, firstParams)
	if err != nil {
		return nil, err
	}
	totalResults := first.Pagination.TotalResults
	totalPages := first.Pagination.TotalPages
	all := make([]capi.Revision, 0, totalResults)
	all = append(all, first.Resources...)
	if totalPages <= 1 {
		return all, nil
	}

	pageResources := make([][]capi.Revision, totalPages+1)
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(maxParallelPages)
	for page := 2; page <= totalPages; page++ {
		p := page
		g.Go(func() error {
			params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
			params.Page = p
			raw, err := client.Revisions().ListForApp(gctx, appGUID, params)
			if err != nil {
				return err
			}
			pageResources[p] = raw.Resources
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}
	for p := 2; p <= totalPages; p++ {
		all = append(all, pageResources[p]...)
	}
	return all, nil
}
