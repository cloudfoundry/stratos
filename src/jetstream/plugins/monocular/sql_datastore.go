package monocular

import (
	"database/sql"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

var getRepositories = `SELECT DISTINCT repo_name from charts`

type SQLDBCMonocularDatastore struct {
	//dbSession datastore.Session
	db *sql.DB
}

// NewSQLDBCMonocularDatastore creates a new SQL data store
func NewSQLDBCMonocularDatastore(db *sql.DB) (*SQLDBCMonocularDatastore, error) {
	return &SQLDBCMonocularDatastore{db: db}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getRepositories = datastore.ModifySQLStatement(getRepositories, databaseProvider)
}

// ListRepositories gets all repository names
func (s *SQLDBCMonocularDatastore) ListRepositories() ([]string, error) {
	rows, err := s.db.Query(getRepositories)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Helm repositories: %v", err)
	}
	defer rows.Close()

	var repos []string
	repos = make([]string, 0)

	for rows.Next() {
		var name string
		err := rows.Scan(&name)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan repository records: %v", err)
		}

		repos = append(repos, name)
	}

	return repos, nil
}
