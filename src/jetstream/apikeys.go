package main

import (
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

func (p *portalProxy) addAPIKey(c echo.Context) error {
	log.Debug("addAPIKey")

	userGUID := c.Get("user_id").(string)
	comment := c.FormValue("comment")

	if len(comment) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "Comment can't be empty")
	}

	apiKeysRepo, err := apikeys.NewPgsqlAPIKeysRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for API keys: %v", err)
		return err
	}

	apiKey, err := apiKeysRepo.AddAPIKey(userGUID, comment)
	if err != nil {
		log.Errorf("Error adding API key %v", err)
		return err
	}

	return c.JSON(http.StatusOK, apiKey)
}

func (p *portalProxy) listAPIKeys(c echo.Context) error {
	log.Debug("listAPIKeys")

	apiKeysRepo, err := apikeys.NewPgsqlAPIKeysRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for API keys: %v", err)
		return err
	}

	userGUID := c.Get("user_id").(string)

	apiKeys, err := apiKeysRepo.ListAPIKeys(userGUID)
	if err != nil {
		log.Errorf("Error listing API keys %v", err)
		return nil
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

	apiKeysRepo, err := apikeys.NewPgsqlAPIKeysRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for API keys: %v", err)
		return err
	}

	if err = apiKeysRepo.DeleteAPIKey(userGUID, keyGUID); err != nil {
		log.Errorf("Error deleting API key %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Error deleting API key")
	}

	return nil
}
