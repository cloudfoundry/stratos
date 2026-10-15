package stratosjobs

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

// stratosSchemaVersion mirrors the header the CF native handlers set.
// Keeps this plugin decoupled from the cloudfoundry package while still
// producing the same wire discipline (content-type + schema-version).
const stratosSchemaVersion = "1"

// getJob handles GET /pp/v1/stratos/jobs/:jobId.
//
// Each frontend poll triggers a translator refresh before returning so the
// reply reflects the latest backend state without the tracker needing its
// own poller. A job this replica does not hold is rebuilt from its id for
// the session user when its translator encodes ids (see JobIDCodec).
// Unknown job ids return 404; the frontend wrapper treats 404 as "status
// unknown — refetch the target entity" per the HA-degradation rule.
func (s *StratosJobs) getJob(ctx *echo.Context) error {
	id := ctx.Param("jobId")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "jobId is required")
	}

	userGUID, err := s.sessionUserGUID(ctx)
	if err != nil || userGUID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	job, ok := s.tracker.Resolve(ctx.Request().Context(), id, userGUID)
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "unknown job id")
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, job)
}

// sessionUserGUID returns the Stratos user of the request's session.
func (s *StratosJobs) sessionUserGUID(ctx *echo.Context) (string, error) {
	if s.sessionUser != nil {
		return s.sessionUser(ctx)
	}
	return s.portalProxy.GetSessionStringValue(ctx, "user_id")
}
