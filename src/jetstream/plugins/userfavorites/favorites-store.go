package userfavorites

type UserFavoriteRecord struct {
	GUID         string `json:"guid"`
	UserGUID     string `json:"-"`
	EndpointType string `json:"endpoint_type"`
	EndpointID   string `json:"endpoint_id"`
	EntityType   string `json:"entity_type"`
	EntityID     string `json:"entity_id"`
}

// FavoritesStore is the user favorites repository
type FavoritesStore interface {
	List(userGUID string) ([]*UserFavoriteRecord, error)
	Delete(userGUID string, guid string) error
	Save(favoriteRecord UserFavoriteRecord) (*UserFavoriteRecord, error)
}
