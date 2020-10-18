package relations

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type RelationsStore interface {
	List() ([]*interfaces.RelationsRecord, error)
	ListByTarget(target string) ([]*interfaces.RelationsRecord, error)
	ListByType(relationType string) ([]*interfaces.RelationsRecord, error)
	DeleteRelation(provider string, relType string, target string) error
	DeleteRelations(providerOrTarget string) error
	Save(relation interfaces.RelationsRecord) (*interfaces.RelationsRecord, error)
}
