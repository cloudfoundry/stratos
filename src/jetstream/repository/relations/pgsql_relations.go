package relations

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	log "github.com/sirupsen/logrus"
)

var (
	getRelations         = `SELECT provider, type, target, metadata FROM relations`
	getRelationsByType   = `SELECT provider, type, target, metadata FROM relations WHERE type = $1`
	getRelationsByTarget = `SELECT provider, type, target, metadata FROM relations WHERE target = $1`
	getRelation          = `SELECT provider, type, target, metadata FROM relations WHERE provider = $1 AND type = $2 AND target = $3`
	deleteRelation       = `DELETE FROM relations WHERE provider = $1 AND type = $2 AND target = $3`
	deleteRelations      = `DELETE FROM relations WHERE provider = $1 OR target = $2`
	insertRelation       = `INSERT INTO relations (provider, type, target, metadata) VALUES ($1, $2, $3, $4)`
	updateRelation       = `UPDATE relations SET provider = $1, type = $2, target = $3, metadata = $4 WHERE provider = $5 AND type = $6 AND target = $7`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getRelationsByType = datastore.ModifySQLStatement(getRelationsByType, databaseProvider)
	getRelationsByTarget = datastore.ModifySQLStatement(getRelationsByTarget, databaseProvider)
	getRelation = datastore.ModifySQLStatement(getRelation, databaseProvider)
	deleteRelation = datastore.ModifySQLStatement(deleteRelation, databaseProvider)
	deleteRelations = datastore.ModifySQLStatement(deleteRelations, databaseProvider)
	insertRelation = datastore.ModifySQLStatement(insertRelation, databaseProvider)
	updateRelation = datastore.ModifySQLStatement(updateRelation, databaseProvider)
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

// List - Returns a list of all relations
func (p *RelationsDBStore) ListByTarget(target string) ([]*interfaces.RelationsRecord, error) {
	log.Debug("ListByTarget")
	rows, err := p.db.Query(getRelationsByTarget, target)
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
func (p *RelationsDBStore) DeleteRelation(provider string, relType string, target string) error {
	if _, err := p.db.Exec(deleteRelation, provider, relType, target); err != nil {
		return fmt.Errorf("Unable to delete Relation: %v", err)
	}

	return nil
}

func (p *RelationsDBStore) DeleteRelations(providerOrTarget string) error {
	if _, err := p.db.Exec(deleteRelations, providerOrTarget, providerOrTarget); err != nil {
		return fmt.Errorf("Unable to delete Relations: %v", err)
	}

	return nil
}

func (p *RelationsDBStore) GetRelation(provider string, relType string, target string) (*interfaces.RelationsRecord, error) {
	var (
		metadata sql.NullString
	)

	relation := new(interfaces.RelationsRecord)

	// &relation.AuthorizationEndpoint, &relation.TokenEndpoint, &relation.DopplerLoggingEndpoint, &relation.SkipSSLValidation, &relation.ClientId, &cipherTextClientSecret, &relation.SSOAllowed, &subType, &metadata)
	err := p.db.QueryRow(getRelation, provider, relType, target).Scan(&relation.Provider, &relation.RelationType, &relation.Target, &metadata)

	switch {
	case err == sql.ErrNoRows:
		return new(interfaces.RelationsRecord), fmt.Errorf("No match for that Relation")
	case err != nil:
		return new(interfaces.RelationsRecord), fmt.Errorf("Error trying to Find CNSI record: %v", err)
	default:
		if metadata.Valid {
			relation.Metadata = marshalRelationMetadata(metadata.String)
		}
	}

	return relation, nil
}

func marshalRelationMetadata(metadata string) map[string]interface{} {
	var anyJSON map[string]interface{}
	if len(metadata) > 2 && strings.Index(metadata, "{") == 0 {
		json.Unmarshal([]byte(metadata), &anyJSON)
	}
	return anyJSON
}

// Save will persist a Relation to a datastore, whether it's new or existing
func (p *RelationsDBStore) Save(relationsRecord interfaces.RelationsRecord) (*interfaces.RelationsRecord, error) {

	metaString, err := json.Marshal(relationsRecord.Metadata)
	if err != nil {
		return nil, fmt.Errorf("Unable to marshal Relations metadata: %v", err)
	}

	existingRelation, err := p.GetRelation(relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target)

	if err == nil && existingRelation != nil {
		if _, err := p.db.Exec(updateRelation, relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target, metaString, relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target); err != nil {
			return nil, fmt.Errorf("Unable to update Relations record: %v", err)
		}
	} else {
		if _, err := p.db.Exec(insertRelation, relationsRecord.Provider, relationsRecord.RelationType, relationsRecord.Target, metaString); err != nil {
			return nil, fmt.Errorf("Unable to insert Relations record: %v", err)
		}
	}

	return &relationsRecord, nil
}
