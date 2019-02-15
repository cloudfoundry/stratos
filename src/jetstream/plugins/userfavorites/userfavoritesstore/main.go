package userfavoritesstore

type UserFavoriteRecord struct {
	GUID         string                 `json:"guid"`
	UserGUID     string                 `json:"-"`
	EndpointType string                 `json:"endpointType"`
	EndpointID   string                 `json:"endpointId"`
	EntityType   string                 `json:"entityType"`
	EntityID     string                 `json:"entityId"`
	Metadata     map[string]interface{} `json:"metadata"`
}

// FavoritesStore is the user favorites repository
type FavoritesStore interface {
	List(userGUID string) ([]*UserFavoriteRecord, error)
	Delete(userGUID string, guid string) error
	Save(favoriteRecord UserFavoriteRecord) (*UserFavoriteRecord, error)
	SetMetadata(userGUID string, guid string, metadata string) error
	DeleteFromEndpoint(endpointGUID string) error
}
