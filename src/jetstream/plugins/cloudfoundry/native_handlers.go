// src/jetstream/plugins/cloudfoundry/native_handlers.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

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

// ---- CF v3 response shapes (internal only) ----

type cfv3Pagination struct {
	TotalResults int `json:"total_results"`
}

type cfv3Metadata struct {
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

type cfv3OrgResource struct {
	GUID      string       `json:"guid"`
	Name      string       `json:"name"`
	CreatedAt string       `json:"created_at"`
	UpdatedAt string       `json:"updated_at"`
	Metadata  cfv3Metadata `json:"metadata"`
}

type cfv3OrgsResponse struct {
	Pagination cfv3Pagination    `json:"pagination"`
	Resources  []cfv3OrgResource `json:"resources"`
}

type cfv3Relationship struct {
	Data struct {
		GUID string `json:"guid"`
	} `json:"data"`
}

type cfv3AppResource struct {
	GUID          string `json:"guid"`
	Name          string `json:"name"`
	State         string `json:"state"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
	Relationships struct {
		Space cfv3Relationship `json:"space"`
	} `json:"relationships"`
}

type cfv3AppsResponse struct {
	Pagination cfv3Pagination    `json:"pagination"`
	Resources  []cfv3AppResource `json:"resources"`
}

type cfv3RoutesResponse struct {
	Pagination cfv3Pagination `json:"pagination"`
}

type cfv3SpaceResource struct {
	GUID          string `json:"guid"`
	Name          string `json:"name"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
	Relationships struct {
		Organization cfv3Relationship `json:"organization"`
	} `json:"relationships"`
}

type cfv3SpacesResponse struct {
	Pagination cfv3Pagination      `json:"pagination"`
	Resources  []cfv3SpaceResource `json:"resources"`
}

// ---- shared HTTP helper ----

// cfV3Get performs a GET to the CF v3 API for the given endpoint and returns the parsed JSON body.
func cfV3Get(proxy nativeCFProxy, cnsiGUID, userGUID, path string, out interface{}) error {
	cnsiRecord, err := proxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}
	tokenRecord, ok := proxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
	}

	apiURL := fmt.Sprintf("%s%s", cnsiRecord.APIEndpoint.String(), path)
	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	req.Header.Set("Authorization", "Bearer "+tokenRecord.AuthToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return echo.NewHTTPError(resp.StatusCode, fmt.Sprintf("CF API returned %d", resp.StatusCode))
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to decode CF response")
	}
	return nil
}

// normaliseStringMap ensures nil maps are returned as empty maps (not null in JSON).
func normaliseStringMap(m map[string]string) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return m
}

// ---- handlers ----

func (c *CloudFoundrySpecification) getNativeOrgs(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	var raw cfv3OrgsResponse
	if err := cfV3Get(c.nativeProxy(), cnsiGUID, userGUID, "/v3/organizations?per_page=5000", &raw); err != nil {
		return err
	}

	orgs := make([]StOrg, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		orgs = append(orgs, StOrg{
			GUID:        r.GUID,
			Name:        r.Name,
			Status:      "active",
			Labels:      normaliseStringMap(r.Metadata.Labels),
			Annotations: normaliseStringMap(r.Metadata.Annotations),
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
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

	var raw cfv3AppsResponse
	if err := cfV3Get(c.nativeProxy(), cnsiGUID, userGUID, "/v3/apps?per_page=5000", &raw); err != nil {
		return err
	}

	apps := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		apps = append(apps, StApp{
			GUID:      r.GUID,
			Name:      r.Name,
			State:     r.State,
			SpaceGUID: r.Relationships.Space.Data.GUID,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
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

	var raw cfv3RoutesResponse
	if err := cfV3Get(c.nativeProxy(), cnsiGUID, userGUID, "/v3/routes?per_page=1", &raw); err != nil {
		return err
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

	var raw cfv3OrgResource
	if err := cfV3Get(c.nativeProxy(), cnsiGUID, userGUID, "/v3/organizations/"+orgGUID, &raw); err != nil {
		return err
	}

	detail := StOrgDetail{
		StOrg: StOrg{
			GUID:        raw.GUID,
			Name:        raw.Name,
			Status:      "active",
			Labels:      normaliseStringMap(raw.Metadata.Labels),
			Annotations: normaliseStringMap(raw.Metadata.Annotations),
			CreatedAt:   raw.CreatedAt,
			UpdatedAt:   raw.UpdatedAt,
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

	path := fmt.Sprintf("/v3/spaces?organization_guids=%s&per_page=5000", orgGUID)
	var raw cfv3SpacesResponse
	if err := cfV3Get(c.nativeProxy(), cnsiGUID, userGUID, path, &raw); err != nil {
		return err
	}

	spaces := make([]StSpace, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		spaces = append(spaces, StSpace{
			GUID:      r.GUID,
			Name:      r.Name,
			OrgGUID:   r.Relationships.Organization.Data.GUID,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
		})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSpacesResponse{
		Resources:    spaces,
		TotalResults: raw.Pagination.TotalResults,
	})
}
