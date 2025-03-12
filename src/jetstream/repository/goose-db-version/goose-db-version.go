package goosedbversion

import (
	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// Repository - the repository required to talk to this table of data
type Repository interface {
	GetCurrentVersion() (api.GooseDBVersionRecord, error)
	List() ([]*api.GooseDBVersionRecord, error)
}
