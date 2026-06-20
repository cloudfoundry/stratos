// src/jetstream/plugins/cloudfoundry/native_identity_providers.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/labstack/echo/v4"
)

// identityProvider is the minimal shape projected to the Add User origin picker.
type identityProvider struct {
	OriginKey string `json:"originKey"`
	Type      string `json:"type"`
	Name      string `json:"name"`
	Active    bool   `json:"active"`
}

// getIdentityProviders handles GET /pp/v1/cf/identity-providers/:cnsiGuid.
// It proxies UAA GET /identity-providers?active_only=true using the requesting
// user's stored CF token, and projects each provider to {originKey,type,name,active}.
//
// A UAA 403 is passed through as HTTP 403 so the frontend can degrade to a
// free-text origin field rather than showing an error.
// Any other non-200 response from UAA is returned as 502.
func (cf *CloudFoundrySpecification) getIdentityProviders(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	// Resolve the CNSI record — AuthorizationEndpoint is the UAA base URL.
	cnsiRecord, err := cf.nativeProxy().GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}
	if cnsiRecord.AuthorizationEndpoint == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "no authorization endpoint for this foundation")
	}

	// Use the requesting user's token so UAA enforces the caller's permissions.
	// A non-UAA-admin gets a 403, which the frontend uses as the signal to
	// degrade to free-text origin input.
	userGUID, err := cf.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}
	tokenRecord, ok := cf.nativeProxy().GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
	}

	uaaURL := fmt.Sprintf("%s/identity-providers?active_only=true", cnsiRecord.AuthorizationEndpoint)
	req, err := http.NewRequestWithContext(ctx.Request().Context(), http.MethodGet, uaaURL, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to build UAA request")
	}
	req.Header.Set("Authorization", "bearer "+tokenRecord.AuthToken)
	req.Header.Set("Accept", "application/json")

	httpClient := cf.nativeProxy().GetHttpClient(cnsiRecord.SkipSSLValidation, cnsiRecord.CACert)
	resp, err := httpClient.Do(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "UAA request failed: "+err.Error())
	}
	defer resp.Body.Close()

	// Pass UAA 403 through so the frontend can degrade to free-text origin input.
	if resp.StatusCode == http.StatusForbidden {
		return echo.NewHTTPError(http.StatusForbidden, "cannot list identity providers")
	}
	if resp.StatusCode != http.StatusOK {
		return echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("UAA returned %d", resp.StatusCode))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "failed to read UAA response")
	}

	var raw []struct {
		OriginKey string `json:"originKey"`
		Type      string `json:"type"`
		Name      string `json:"name"`
		Active    bool   `json:"active"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "bad identity-providers response from UAA")
	}

	out := make([]identityProvider, 0, len(raw))
	for _, p := range raw {
		out = append(out, identityProvider{
			OriginKey: p.OriginKey,
			Type:      p.Type,
			Name:      p.Name,
			Active:    p.Active,
		})
	}
	return ctx.JSON(http.StatusOK, out)
}
