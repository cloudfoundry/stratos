package userfavorites

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites/userfavoritesstore"
	"github.com/labstack/echo"
	"github.com/labstack/gommon/log"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (uf *UserFavorites) getAll(c echo.Context) error {

	store, err := userfavoritesstore.NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to get favorites store",
			"Unable to get favorites store")
	}
	userGUID := c.Get("user_id").(string)
	list, err := store.List(userGUID)
	log.Warn(err)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to get favorites from favorites store",
			"Unable to get favorites from favorites store")
	}

	jsonString, err := json.Marshal(list)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable Marshal favorites from favorites json",
			"Unable Marshal favorites from favorites json")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (uf *UserFavorites) delete(c echo.Context) error {

	store, err := userfavoritesstore.NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	favoriteGUID := c.Param("guid")
	if len(favoriteGUID) == 0 {
		return errors.New("Invalid favorite GUID")
	}

	userGUID := c.Get("user_id").(string)
	err = store.Delete(userGUID, favoriteGUID)
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"response\": \"User Favorite deleted okay\"}"))
	return nil
}

func (uf *UserFavorites) setMetadata(c echo.Context) error {

	store, err := userfavoritesstore.NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	favoriteGUID := c.Param("guid")
	if len(favoriteGUID) == 0 {
		return errors.New("Invalid favorite GUID")
	}

	userGUID := c.Get("user_id").(string)
	err = store.Delete(userGUID, favoriteGUID)
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"response\": \"User Favorite deleted okay\"}"))
	return nil
}

func (uf *UserFavorites) create(c echo.Context) error {

	store, err := userfavoritesstore.NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to connect to User Favorite store",
			"Unable to connect to User Favorite store")
	}

	userGUID := c.Get("user_id").(string)

	req := c.Request()
	body, _ := ioutil.ReadAll(req.Body())

	favorite := userfavoritesstore.UserFavoriteRecord{}
	err = json.Unmarshal(body, &favorite)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to parse User Favorite from request body",
			"Unable to parse User Favorite from request body")
	}

	if len(favorite.EndpointID) == 0 || len(favorite.EndpointType) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Invalid request - must provide EndpointID and EndpointType",
			"Invalid request - must provide EndpointID and EndpointType")
	}

	favorite.GUID = buildFavoriteStoreEntityGuid(favorite)
	favorite.UserGUID = userGUID
	updatedFavorite, err := store.Save(favorite)

	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to save favorite to db",
			"Failed to save favorite to db")
	}

	jsonString, err := json.Marshal(updatedFavorite)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to Marshal favorite from db",
			"Failed to Marshal favorite from db")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

// RemoveEndpointFavorites removes favorites form an endpoint using the given endpoint guid
func (uf *UserFavorites) RemoveEndpointFavorites(endpointGUID string) error {
	store, err := userfavoritesstore.NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	if len(endpointGUID) == 0 {
		return errors.New("Invalid endpoint GUID")
	}

	err = store.DeleteFromEndpoint(endpointGUID)
	if err != nil {
		return err
	}
	return nil
}

func buildFavoriteStoreEntityGuid(favorite userfavoritesstore.UserFavoriteRecord) string {
	values := []string{}
	if len(favorite.EntityID) > 0 {
		values = append(values, favorite.EntityID)
	}
	if len(favorite.EndpointID) > 0 {
		values = append(values, favorite.EndpointID)
	}
	if len(favorite.EntityType) > 0 {
		values = append(values, favorite.EntityType)
	}
	if len(favorite.EndpointType) > 0 {
		values = append(values, favorite.EndpointType)
	}

	return strings.Join(values, "-")
}
