package userfavoritesstore

import (
	"database/sql"
	"encoding/json"
	"fmt"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-community/stratos/src/jetstream/datastore"
)

var (
	getFavorites           = `SELECT guid, endpoint_type, endpoint_id, entity_type, entity_id, metadata FROM favorites WHERE user_guid = $1`
	deleteFavorite         = `DELETE FROM favorites WHERE user_guid = $1 AND guid = $2`
	saveFavorite           = `INSERT INTO favorites (guid, user_guid, endpoint_type, endpoint_id, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	setMetadata            = `UPDATE favorites SET metadata = $1 WHERE user_guid = $2 AND guid = $3`
	deleteEndpointFavorite = `DELETE FROM favorites WHERE endpoint_id = $1`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getFavorites = datastore.ModifySQLStatement(getFavorites, databaseProvider)
	deleteFavorite = datastore.ModifySQLStatement(deleteFavorite, databaseProvider)
	saveFavorite = datastore.ModifySQLStatement(saveFavorite, databaseProvider)
	setMetadata = datastore.ModifySQLStatement(setMetadata, databaseProvider)
	deleteEndpointFavorite = datastore.ModifySQLStatement(deleteEndpointFavorite, databaseProvider)
}

// FavoritesDBStore is a DB-backed User Favorites repository
type FavoritesDBStore struct {
	db *sql.DB
}

// NewFavoritesDBStore will create a new instance of the FavoritesDBStore
func NewFavoritesDBStore(dcp *sql.DB) (FavoritesStore, error) {
	return &FavoritesDBStore{db: dcp}, nil
}

// List - Returns a list of all user favorites
func (p *FavoritesDBStore) List(userGUID string) ([]*UserFavoriteRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(getFavorites, userGUID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve User Favorite records: %v", err)
	}
	defer rows.Close()

	var favoritesList []*UserFavoriteRecord
	favoritesList = make([]*UserFavoriteRecord, 0)

	for rows.Next() {
		favorite := new(UserFavoriteRecord)
		var metaString sql.NullString
		err := rows.Scan(&favorite.GUID, &favorite.EndpointType, &favorite.EndpointID, &favorite.EntityType, &favorite.EntityID, &metaString)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan User Favorite records: %v", err)
		}

		var metadata map[string]interface{}
		err = json.Unmarshal([]byte(metaString.String), &metadata)
		if err != nil {
			return nil, fmt.Errorf("Unable to Marshal User Favorite metadata: %v", err)
		}
		favorite.Metadata = metadata

		favoritesList = append(favoritesList, favorite)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List User Favorite records: %v", err)
	}

	return favoritesList, nil
}

// Delete will delete a User Favorite from the datastore
func (p *FavoritesDBStore) Delete(userGUID string, guid string) error {
	if _, err := p.db.Exec(deleteFavorite, userGUID, guid); err != nil {
		return fmt.Errorf("Unable to delete User Favorite record: %v", err)
	}

	return nil
}

// SetMetadata will set the metadata for a User Favorite from the datastore
func (p *FavoritesDBStore) SetMetadata(userGUID string, guid string, metadata string) error {
	if _, err := p.db.Exec(setMetadata, metadata, userGUID, guid); err != nil {
		return fmt.Errorf("Unable to set metadata on User Favorite record: %v", err)
	}
	return nil
}

// Save will persist a User Favorite to a datastore
func (p *FavoritesDBStore) Save(favoriteRecord UserFavoriteRecord) (*UserFavoriteRecord, error) {

	metaString, err := json.Marshal(favoriteRecord.Metadata)

	if err != nil {
		return nil, fmt.Errorf("Unable to marshal User Favorite metadata: %v", err)
	}
	if _, err := p.db.Exec(saveFavorite, favoriteRecord.GUID, favoriteRecord.UserGUID, favoriteRecord.EndpointType, favoriteRecord.EndpointID, favoriteRecord.EntityType, favoriteRecord.EntityID, metaString); err != nil {
		return nil, fmt.Errorf("Unable to save User Favorite record: %v", err)
	}

	return &favoriteRecord, nil
}

// DeleteFromEndpoint will remove all favorites for a given endpoint guid
func (p *FavoritesDBStore) DeleteFromEndpoint(endpointGUID string) error {
	if _, err := p.db.Exec(deleteEndpointFavorite, endpointGUID); err != nil {
		return fmt.Errorf("Unable to User Favorite record: %v", err)
	}
	return nil
}
