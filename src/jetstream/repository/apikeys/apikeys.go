package apikeys

import "github.com/cloudfoundry/stratos/src/jetstream/api"

// Repository - API keys repository
type Repository interface {
	AddAPIKey(userID string, comment string) (*api.APIKey, error)
	GetAPIKeyBySecret(keySecret string) (*api.APIKey, error)
	ListAPIKeys(userID string) ([]api.APIKey, error)
	DeleteAPIKey(userGUID string, keyGUID string) error
	UpdateAPIKeyLastUsed(keyGUID string) error
}
