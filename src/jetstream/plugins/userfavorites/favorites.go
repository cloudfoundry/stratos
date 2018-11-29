package userfavorites

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"strings"

	"github.com/labstack/echo"
)

func (uf *UserFavorites) getAll(c echo.Context) error {

	store, err := NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	userGUID := c.Get("user_id").(string)
	list, err := store.List(userGUID)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(list)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (uf *UserFavorites) delete(c echo.Context) error {

	store, err := NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
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

	c.Response().Write([]byte("User Favorite deleted okay"))
	return nil
}

func (uf *UserFavorites) create(c echo.Context) error {

	store, err := NewFavoritesDBStore(uf.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	userGUID := c.Get("user_id").(string)

	var favorite UserFavoriteRecord
	req := c.Request()
	body, _ := ioutil.ReadAll(req.Body())

	err = json.Unmarshal(body, &favorite)
	if err != nil {
		return errors.New("Unable to parse User Favorite from request body")
	}

	favorite.GUID = buildFavoriteStoreEntityGuid(favorite)
	favorite.UserGUID = userGUID
	updatedFavorite, err := store.Save(favorite)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(updatedFavorite)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func buildFavoriteStoreEntityGuid(favorite UserFavoriteRecord) string {
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
