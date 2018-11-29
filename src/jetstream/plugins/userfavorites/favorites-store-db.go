package userfavorites

import (
	"database/sql"
	"fmt"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

var (
	getFavorites   = `SELECT guid, endpoint_type, endpoint_id, entity_type, entity_id FROM favorites WHERE user_guid = $1`
	deleteFavorite = `DELETE FROM favorites WHERE user_guid = $1 AND guid = $2`
	saveFavorite   = `INSERT INTO favorites (guid, user_guid, endpoint_type, endpoint_id, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6)`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getFavorites = datastore.ModifySQLStatement(getFavorites, databaseProvider)
	deleteFavorite = datastore.ModifySQLStatement(deleteFavorite, databaseProvider)
	saveFavorite = datastore.ModifySQLStatement(saveFavorite, databaseProvider)
}

// FavoritesDBStore is a DB-backed User Favorites repository
type FavoritesDBStore struct {
	db *sql.DB
}

// NewFavoritesDBStore will create a new instance of the FavoritesDBStore
func NewFavoritesDBStore(dcp *sql.DB) (FavoritesStore, error) {
	log.Debug("NewPostgresGooseDBVersionRepository")
	return &FavoritesDBStore{db: dcp}, nil
}

// List - Returns a list of all user favorites
func (p *FavoritesDBStore) List(userGUID string) ([]*UserFavoriteRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(getFavorites)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve User Favorite records: %v", err)
	}
	defer rows.Close()

	var favoritesList []*UserFavoriteRecord
	favoritesList = make([]*UserFavoriteRecord, 0)

	for rows.Next() {
		favorite := new(UserFavoriteRecord)
		err := rows.Scan(&favorite.GUID, &favorite.EndpointType, &favorite.EndpointID, &favorite.EntityType, &favorite.EntityID)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan User Favorite records: %v", err)
		}
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
		return fmt.Errorf("Unable to User Favorite record: %v", err)
	}

	return nil
}

// Save will persist a User Favorite to a datastore
func (p *FavoritesDBStore) Save(favoriteRecord UserFavoriteRecord) (*UserFavoriteRecord, error) {
	if _, err := p.db.Exec(saveFavorite, favoriteRecord.GUID, favoriteRecord.UserGUID, favoriteRecord.EndpointType, favoriteRecord.EndpointID, favoriteRecord.EntityType, favoriteRecord.EntityID); err != nil {
		return nil, fmt.Errorf("Unable to User Favorite record: %v", err)
	}

	return &favoriteRecord, nil
}
