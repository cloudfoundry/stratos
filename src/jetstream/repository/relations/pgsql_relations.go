package relations

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	log "github.com/sirupsen/logrus"
)

var (
	getRelations       = `SELECT provider, type, target, metadata FROM relations`
	getRelationsByType = `SELECT provider, type, target, metadata FROM relations WHERE type = $1`
	getRelation        = `SELECT provider, type, target, metadata FROM relations WHERE provider = $1 AND target = $2`
	deleteRelation     = `DELETE FROM relations WHERE provider = $1 AND target = $2`
	deleteRelations    = `DELETE FROM relations WHERE provider = $1 OR target = $1`
	insertRelation     = `INSERT INTO relations (provider, type, target, metadata) VALUES ($1, $2, $3, $4)`
	updateRelation     = `UPDATE relations SET provider = $1, type = $2, target = $3, metadata = $4 WHERE provider = $1 AND target = $3`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	// TODO: RC which statements need this, anyone with $?
	// getRelations = datastore.ModifySQLStatement(getRelations, databaseProvider)
	// deleteFavorite = datastore.ModifySQLStatement(deleteFavorite, databaseProvider)
	// saveRelation = datastore.ModifySQLStatement(saveRelation, databaseProvider)
}

// RelationsDBStore is a DB-backed Relations repository
type RelationsDBStore struct {
	db *sql.DB
}

// NewRelationsDBStore will create a new instance of the RelationsDBStore
func NewRelationsDBStore(dcp *sql.DB) (RelationsStore, error) {
	return &RelationsDBStore{db: dcp}, nil
}

// List - Returns a list of all relations
func (p *RelationsDBStore) List() ([]*interfaces.RelationsRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(getRelations)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Relations records: %v", err)
	}
	defer rows.Close()

	var relationsList []*interfaces.RelationsRecord
	relationsList = make([]*interfaces.RelationsRecord, 0)

	for rows.Next() {
		relation := new(interfaces.RelationsRecord)
		var metaString sql.NullString
		err := rows.Scan(&relation.Provider, &relation.RelationType, &relation.Target, &metaString)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Relations records: %v", err)
		}

		var metadata map[string]interface{}
		err = json.Unmarshal([]byte(metaString.String), &metadata)
		if err != nil {
			return nil, fmt.Errorf("Unable to Marshal Relations metadata: %v", err)
		}
		relation.Metadata = metadata

		relationsList = append(relationsList, relation)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List Relations records: %v", err)
	}

	return relationsList, nil
}

func (p *RelationsDBStore) ListByType(relationType string) ([]*interfaces.RelationsRecord, error) {
	log.Debug("ListByType")
	rows, err := p.db.Query(getRelationsByType, relationType)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Relation records by type: %v", err)
	}
	defer rows.Close()

	var relationsList []*interfaces.RelationsRecord
	relationsList = make([]*interfaces.RelationsRecord, 0)

	for rows.Next() {
		relation := new(interfaces.RelationsRecord)
		var metaString sql.NullString
		err := rows.Scan(&relation.Provider, &relation.RelationType, &relation.Target, &metaString)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Relations records: %v", err)
		}

		var metadata map[string]interface{}
		err = json.Unmarshal([]byte(metaString.String), &metadata)
		if err != nil {
			return nil, fmt.Errorf("Unable to Marshal Relations metadata: %v", err)
		}
		relation.Metadata = metadata

		relationsList = append(relationsList, relation)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List Relations records by type: %v", err)
	}

	return relationsList, nil
}

// Delete will delete a Relation from the datastore
func (p *RelationsDBStore) DeleteRelation(provider string, target string) error {
	if _, err := p.db.Exec(deleteRelation, provider, target); err != nil {
		return fmt.Errorf("Unable to delete Relations record: %v", err)
	}

	return nil
}

func (p *RelationsDBStore) DeleteRelations(providerOrTarget string) error {
	if _, err := p.db.Exec(deleteRelations, providerOrTarget); err != nil {
		return fmt.Errorf("Unable to delete Relations: %v", err)
	}

	return nil
}

// Save will persist a Relation to a datastore, whether it's new or existing
func (p *RelationsDBStore) Save(relationsRecord interfaces.RelationsRecord) (*interfaces.RelationsRecord, error) {

	metaString, err := json.Marshal(relationsRecord.Metadata)
	if err != nil {
		return nil, fmt.Errorf("Unable to marshal Relations metadata: %v", err)
	}

	existingRelation, err := p.db.Exec(getRelation, relationsRecord.Provider, relationsRecord.Target)
	if err != nil {
		return nil, fmt.Errorf("Unable to determine existing relation: %v", err)
	}
	if existingRelation != nil {
		if _, err := p.db.Exec(insertRelation, relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target, metaString); err != nil {
			return nil, fmt.Errorf("Unable to insert Relations record: %v", err)
		}
	} else {
		if _, err := p.db.Exec(updateRelation, relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target, metaString); err != nil {
			return nil, fmt.Errorf("Unable to update Relations record: %v", err)
		}
	}

	return &relationsRecord, nil
}
