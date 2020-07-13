package factory

import (
	"database/sql"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
)

var storeFactory interfaces.StoreFactory

// GetStoreFactory gets the store factory
func GetStoreFactory() interfaces.StoreFactory {
	return storeFactory
}

// SetStoreFactory sets the store factory
func SetStoreFactory(factory interfaces.StoreFactory) interfaces.StoreFactory {
	old := storeFactory
	storeFactory = factory
	return old
}

// DefaultStoreFactory is default factory for getting store interfaces
type DefaultStoreFactory struct {
	databaseConnectionPool *sql.DB
}

// NewDefaultStoreFactory creates a new default store factory
func NewDefaultStoreFactory(dbPool *sql.DB) interfaces.StoreFactory {
	return &DefaultStoreFactory{
		databaseConnectionPool: dbPool,
	}
}

// EndpointStore gets store for obtaining endpoint information
func (f *DefaultStoreFactory) EndpointStore() (interfaces.EndpointRepository, error) {
	return cnsis.NewPostgresCNSIRepository(f.databaseConnectionPool)
}

// TokenStore gets store for obtaining endpoint information
func (f *DefaultStoreFactory) TokenStore() (interfaces.TokenRepository, error) {
	return tokens.NewPgsqlTokenRepository(f.databaseConnectionPool)
}
