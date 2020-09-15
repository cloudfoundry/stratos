package main

import (
	"errors"
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

func (p *portalProxy) checkIfAPIKeysEnabled(userGUID string) error {
	if p.Config.APIKeysEnabled == config.APIKeysConfigEnum.Disabled {
		log.Info("API keys are disabled")
		return errors.New("API keys are disabled")
	} else if p.Config.APIKeysEnabled == config.APIKeysConfigEnum.AdminOnly {
		user, err := p.StratosAuthService.GetUser(userGUID)
		if err != nil {
			return err
		}

		if !user.Admin {
			log.Info("API keys are disabled for non-admin users")
			return errors.New("API keys are disabled for non-admin users")
		}
	}

	return nil
}

func (p *portalProxy) addAPIKey(c echo.Context) error {
	log.Debug("addAPIKey")

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
		log.Errorf("Error adding API key: %v", err)
		return errors.New("Error adding API key")
	}

	return c.JSON(http.StatusOK, apiKey)
}

func (p *portalProxy) listAPIKeys(c echo.Context) error {
	log.Debug("listAPIKeys")

	userGUID := c.Get("user_id").(string)

	if err := p.checkIfAPIKeysEnabled(userGUID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	apiKeys, err := p.APIKeysRepository.ListAPIKeys(userGUID)
	if err != nil {
		log.Errorf("Error listing API keys: %v", err)
		return errors.New("Error listing API keys")
	}

	return c.JSON(http.StatusOK, apiKeys)
}

func (p *portalProxy) deleteAPIKey(c echo.Context) error {
	log.Debug("deleteAPIKey")

	userGUID := c.Get("user_id").(string)
	keyGUID := c.FormValue("guid")

	if len(keyGUID) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "API key guid can't be empty")
	}

	if err := p.checkIfAPIKeysEnabled(userGUID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	if err := p.APIKeysRepository.DeleteAPIKey(userGUID, keyGUID); err != nil {
		log.Errorf("Error deleting API key: %v", err)
		return errors.New("Error deleting API key")
	}

	return nil
}
