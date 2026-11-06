// src/jetstream/plugins/cloudfoundry/native_domains_share.go
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

// shareDomainOrgs handles
// POST /pp/v1/cf/domains/{cnsiGuid}/{domainGuid}/relationships/shared_organizations
// — the bulk "share this private domain with N organizations" action. Body is
// the shared bulk shape {"guids": [orgGUID, ...]}.
//
// CF v3 exposes sharing as a single atomic call —
// POST /v3/domains/{guid}/relationships/shared_organizations with a to-many
// relationship body — so there is no fan-out here (unlike the routes bulk
// handlers): one capi call shares the domain with every org at once and
// returns the resulting to-many relationship (the full shared-org set). The
// whole request succeeds or fails together; CF's error envelope flows through
// handleCapiError unchanged.
func (cf *CloudFoundrySpecification) shareDomainOrgs(c *echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	domainGUID := c.Param("domainGuid")
	if cnsiGUID == "" || domainGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and domainGuid are required")
	}

	orgGUIDs, err := decodeBulkGUIDs(c)
	if err != nil {
		return err
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	rel, shareErr := cfClient.Domains().ShareWithOrganization(reqCtx, domainGUID, orgGUIDs)
	if shareErr != nil {
		return handleCapiError(c, shareErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, rel)
}
