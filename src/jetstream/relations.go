package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/relations"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (p *portalProxy) SaveRelation(relation interfaces.RelationsRecord) (*interfaces.RelationsRecord, error) {
	store, err := relations.NewRelationsDBStore(p.DatabaseConnectionPool)
	if err != nil {
		return nil, err
	}
	return store.Save(relation)
}

func (p *portalProxy) ListRelations() ([]*interfaces.RelationsRecord, error) {
	store, err := relations.NewRelationsDBStore(p.DatabaseConnectionPool)
	if err != nil {
		return nil, err
	}

	return store.List()
}

func (p *portalProxy) ListRelationsByTarget(target string) ([]*interfaces.RelationsRecord, error) {
	store, err := relations.NewRelationsDBStore(p.DatabaseConnectionPool)
	if err != nil {
		return nil, err
	}

	return store.ListByTarget(target)
}

func (p *portalProxy) RemoveRelations(providerOrTarget string) error {
	store, err := relations.NewRelationsDBStore(p.DatabaseConnectionPool)
	if err != nil {
		return err
	}

	return store.DeleteRelations(providerOrTarget)
}

func (p *portalProxy) RemoveRelation(relation interfaces.RelationsRecord) error {
	store, err := relations.NewRelationsDBStore(p.DatabaseConnectionPool)
	if err != nil {
		return err
	}

	return store.DeleteRelation(relation.Provider, relation.RelationType, relation.Target)
}

func (p *portalProxy) listRelations(c echo.Context) error {

	list, err := p.ListRelations()
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable to get relations from relations store",
			"Unable to get relations from relations store: %v", err)
	}

	jsonString, err := json.Marshal(list)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable Marshal relations from relations json",
			"Unable Marshal relations from relations json: %v", err)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) saveRelation(c echo.Context) error {
	req := c.Request()
	body, _ := ioutil.ReadAll(req.Body)

	relation := interfaces.RelationsRecord{}
	err := json.Unmarshal(body, &relation)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to parse Relations from request body",
			"Unable to parse Relations from request body: %v", err)
	}

	if len(relation.Provider) == 0 || len(relation.RelationType) == 0 || len(relation.Target) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Invalid request - must provide provider, type and target",
			"Invalid request - must provide provider, type and target")
	}

	updatedRelation, err := p.SaveRelation(relation)

	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to save relation to db",
			"Failed to save relation to db: %v", err)
	}

	jsonString, err := json.Marshal(updatedRelation)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to Marshal relation from db",
			"Failed to Marshal relation from db: %v", err)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) removeRelation(c echo.Context) error {
	req := c.Request()
	body, _ := ioutil.ReadAll(req.Body)

	relation := interfaces.RelationsRecord{}
	err := json.Unmarshal(body, &relation)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable to parse Relations from request body",
			"Unable to parse Relations from request body: %v", err)
	}

	if len(relation.Provider) == 0 || len(relation.RelationType) == 0 || len(relation.Target) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Invalid request - must provide provider, type and target",
			"Invalid request - must provide provider, type and target")
	}

	err = p.RemoveRelation(relation)

	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to remove relation to db",
			"Failed to remove relation to db: %v", err)
	}

	// c.Response().Header().Set("Content-Type", "application/json")
	// c.Response().Write(jsonString)
	return nil
}
