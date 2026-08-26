package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	"github.com/labstack/echo/v5"
)

func (p *portalProxy) checkIfAPIKeysEnabled(userGUID string) error {
	switch p.Config.APIKeysEnabled {
	case config.APIKeysConfigEnum.Disabled:
		slog.Info("API keys are disabled", "user", userGUID)
		return errors.New("API keys are disabled")
	case config.APIKeysConfigEnum.AdminOnly:
		user, err := p.StratosAuthService.GetUser(userGUID)
		if err != nil {
			return err
		}

		if !user.Admin {
			slog.Info("API keys are disabled for non-admin users", "user", userGUID)
			return errors.New("API keys are disabled for non-admin users")
		}
	}

	return nil
}

func (p *portalProxy) addAPIKey(c *echo.Context) error {
	slog.Debug("addAPIKey")

	userGUID := c.Get("user_id").(string)
	comment := c.FormValue("comment")

	if len(comment) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "Comment can't be empty")
	}

	if err := p.checkIfAPIKeysEnabled(userGUID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	apiKey, err := p.APIKeysRepository.AddAPIKey(userGUID, comment)
	if err != nil {
		slog.Error("error adding an API key", "user", userGUID, "error", err)
		return errors.New("Error adding API key")
	}

	return c.JSON(http.StatusOK, apiKey)
}

func (p *portalProxy) listAPIKeys(c *echo.Context) error {
	slog.Debug("listAPIKeys")

	userGUID := c.Get("user_id").(string)

	if err := p.checkIfAPIKeysEnabled(userGUID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	apiKeys, err := p.APIKeysRepository.ListAPIKeys(userGUID)
	if err != nil {
		slog.Error("error listing API keys", "user", userGUID, "error", err)
		return errors.New("Error listing API keys")
	}

	return c.JSON(http.StatusOK, apiKeys)
}

func (p *portalProxy) deleteAPIKey(c *echo.Context) error {
	slog.Debug("deleteAPIKey")

	userGUID := c.Get("user_id").(string)
	keyGUID := c.FormValue("guid")

	if len(keyGUID) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "API key guid can't be empty")
	}

	if err := p.checkIfAPIKeysEnabled(userGUID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	if err := p.APIKeysRepository.DeleteAPIKey(userGUID, keyGUID); err != nil {
		slog.Error("error deleting an API key", "user", userGUID, "key", keyGUID, "error", err)
		return errors.New("Error deleting API key")
	}

	return nil
}
