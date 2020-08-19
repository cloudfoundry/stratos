package apikeys

import "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

// Repository - API keys repository
type Repository interface {
	AddAPIKey(userID string, comment string) (*interfaces.APIKey, error)
	GetAPIKeyBySecret(keySecret string) (*interfaces.APIKey, error)
	ListAPIKeys(userID string) ([]interfaces.APIKey, error)
	DeleteAPIKey(userGUID string, keyGUID string) error
	UpdateAPIKeyLastUsed(keyGUID string) error
}
