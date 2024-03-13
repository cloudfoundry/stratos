package factory

import (
	"database/sql"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
)

// DefaultStoreFactory is default factory for getting store interfaces
type DefaultStoreFactory struct {
	databaseConnectionPool *sql.DB
}

// NewDefaultStoreFactory creates a new default store factory
func NewDefaultStoreFactory(dbPool *sql.DB) api.StoreFactory {
	return &DefaultStoreFactory{
		databaseConnectionPool: dbPool,
	}
}

// EndpointStore gets store for obtaining endpoint information
func (f *DefaultStoreFactory) EndpointStore() (api.EndpointRepository, error) {
	return cnsis.NewPostgresCNSIRepository(f.databaseConnectionPool)
}

// TokenStore gets store for obtaining endpoint information
func (f *DefaultStoreFactory) TokenStore() (api.TokenRepository, error) {
	return tokens.NewPgsqlTokenRepository(f.databaseConnectionPool)
}
