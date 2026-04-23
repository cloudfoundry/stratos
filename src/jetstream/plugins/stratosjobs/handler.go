package stratosjobs

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// stratosSchemaVersion mirrors the header the CF native handlers set.
// Keeps this plugin decoupled from the cloudfoundry package while still
// producing the same wire discipline (content-type + schema-version).
const stratosSchemaVersion = "1"

// getJob handles GET /pp/v1/stratos/jobs/:jobId.
//
// Each frontend poll triggers a translator refresh before returning so the
// reply reflects the latest backend state without the tracker needing its
// own poller. Unknown job ids return 404; the frontend wrapper treats 404
// as "status unknown — refetch the target entity" per the HA-degradation
// rule.
func (s *StratosJobs) getJob(ctx echo.Context) error {
	id := ctx.Param("jobId")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "jobId is required")
	}

	job, ok := s.tracker.Refresh(ctx.Request().Context(), id)
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "unknown job id")
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, job)
}
