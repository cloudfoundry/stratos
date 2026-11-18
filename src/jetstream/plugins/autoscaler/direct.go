package autoscaler

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

// callRegistered calls a registered autoscaler with the user's Cloud
// Foundry token and the autoscaler record's TLS settings, and writes its
// answer as a passthrough would. The token is refreshed when expired, and
// once more on a 401; a second 401 is the autoscaler's answer and is passed
// on (the rule in oauth_requests.go).
func (a *Autoscaler) callRegistered(c *echo.Context, cf, as api.CNSIRecord, userGUID, method, path string, body []byte) error {
	if cf.APIEndpoint == nil || as.APIEndpoint == nil || !sameDomain(cf.APIEndpoint.String(), as.APIEndpoint.String()) {
		return api.NewHTTPError(http.StatusBadRequest,
			"The autoscaler is not on its Cloud Foundry's domain, so your Cloud Foundry token is not sent to it")
	}
	token, ok := a.portalProxy.GetCNSITokenRecord(cf.GUID, userGUID)
	if !ok {
		return echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
	}
	refresh := func() error {
		t, err := a.portalProxy.RefreshOAuthToken(cf.SkipSSLValidation, cf.GUID, userGUID,
			cf.ClientId, cf.ClientSecret, cf.TokenEndpoint)
		if err != nil {
			return fmt.Errorf("couldn't refresh token for CNSI with GUID %s: %w", cf.GUID, err)
		}
		token = t
		return nil
	}
	if token.TokenExpiry > 0 && time.Unix(token.TokenExpiry, 0).Before(time.Now()) {
		if err := refresh(); err != nil {
			return err
		}
	}

	client := a.portalProxy.GetHttpClient(as.SkipSSLValidation, as.CACert)
	target := strings.TrimRight(as.APIEndpoint.String(), "/") + path
	var res *http.Response
	for attempt := 0; ; attempt++ {
		req, err := http.NewRequestWithContext(c.Request().Context(), method, target, bytes.NewReader(body))
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "bearer "+token.AuthToken)
		if len(body) > 0 {
			req.Header.Set("Content-Type", "application/json")
		}
		res, err = client.Do(req)
		if err != nil {
			return fmt.Errorf("request failed: %w", err)
		}
		if res.StatusCode != http.StatusUnauthorized || attempt > 0 {
			break
		}
		_ = res.Body.Close()
		if err := refresh(); err != nil {
			return err
		}
	}
	defer func() { _ = res.Body.Close() }()

	data, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("reading the autoscaler's answer: %w", err)
	}
	if ct := res.Header.Get("Content-Type"); ct != "" {
		c.Response().Header().Set("Content-Type", ct)
	}
	c.Response().WriteHeader(res.StatusCode)
	_, _ = c.Response().Write(data)
	return nil
}

// forward sends a call for an app to its registered autoscaler, or along
// today's path (ProxyRequest with x-cap-api-host). onErr maps a failure as
// each route did before (info → 404, health → 503).
func (a *Autoscaler) forward(c *echo.Context, appID, method, path string, onErr func(error) error) error {
	if appID != "" {
		if cf, as, userGUID, ok := a.registeredFor(c, appID); ok {
			body, err := io.ReadAll(c.Request().Body)
			if err != nil {
				return onErr(err)
			}
			if err := a.callRegistered(c, cf, as, userGUID, method, path, body); err != nil {
				return onErr(err)
			}
			return nil
		}
	}
	u, err := url.Parse(path)
	if err != nil {
		return onErr(err)
	}
	responses, err := a.portalProxy.ProxyRequest(c, u)
	if err != nil {
		return onErr(err)
	}
	return a.portalProxy.SendProxiedResponse(c, responses)
}

// registeredFor resolves the app's autoscaler; ok is false for "default".
func (a *Autoscaler) registeredFor(c *echo.Context, appID string) (cf, as api.CNSIRecord, userGUID string, ok bool) {
	cfGUID := c.Request().Header.Get("x-cap-cnsi-list")
	if cfGUID == "" || strings.Contains(cfGUID, ",") {
		return
	}
	userGUID, err := a.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return
	}
	t := a.resolveTarget(c.Request().Context(), userGUID, cfGUID, appID)
	if t.record == nil {
		return
	}
	cf, err = a.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		return
	}
	return cf, *t.record, userGUID, true
}

// getAutoscalerTarget reports which autoscaler the app's calls use.
func (a *Autoscaler) getAutoscalerTarget(c *echo.Context) error {
	cfGUID := c.Request().Header.Get("x-cap-cnsi-list")
	if cfGUID == "" || strings.Contains(cfGUID, ",") {
		return echo.NewHTTPError(http.StatusBadRequest, "x-cap-cnsi-list must name one Cloud Foundry endpoint")
	}
	userGUID, err := a.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session user")
	}
	return c.JSON(http.StatusOK, a.resolveTarget(c.Request().Context(), userGUID, cfGUID, c.Param("appId")))
}
