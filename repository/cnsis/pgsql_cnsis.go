package cnsis

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	"github.com/hpcloud/portal-proxy/datastore"
)

const (
	listCNSIs = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
							 FROM cnsis`
	findCNSI = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
  						 FROM cnsis
               WHERE guid=$1`
	saveCNSI = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint)
							 VALUES ($1, $2, $3, $4, $5, $6)`
)

// PostgresCNSIRepository is a PostgreSQL-backed CNSI repository
type PostgresCNSIRepository struct {
	db *sql.DB
}

// NewPostgresCNSIRepository will create a new instance of the PostgresInstanceRepository
func NewPostgresCNSIRepository(configParams datastore.PostgresConnectionParameters) (Repository, error) {
	db, err := datastore.GetConnection(configParams)
	if err != nil {
		return nil, err
	}

	return &PostgresCNSIRepository{db: db}, nil
}

// List - Returns a list of CNSI Records
func (p *PostgresCNSIRepository) List() ([]*CNSIRecord, error) {

	rows, err := p.db.Query(listCNSIs)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var cnsiList []*CNSIRecord
	cnsiList = make([]*CNSIRecord, 0)

	for rows.Next() {
		cnsi := new(CNSIRecord)
		err := rows.Scan(&cnsi.GUID, &cnsi.Name, &cnsi.CNSIType, &cnsi.APIEndpoint, &cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}
		cnsiList = append(cnsiList, cnsi)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List CNSI records: %v", err)
	}

	return cnsiList, nil
}

// Find - Returns a single CNSI Record
func (p *PostgresCNSIRepository) Find(guid string) (CNSIRecord, error) {

	cnsi := new(CNSIRecord)

	stmt, err := p.db.Prepare(findCNSI)
	if err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to Prepare/Find CNSI record: %v", err)
	}

	var (
		pCNSIType string
		pURL      string
	)
	err = stmt.QueryRow(guid).Scan(&cnsi.GUID,
		&cnsi.Name,
		&pCNSIType,
		&pURL,
		&cnsi.AuthorizationEndpoint,
		&cnsi.TokenEndpoint)
	if err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to Find CNSI record: %v", err)
	}

	// TODO(wchrisjohnson): discover a way to do this automagically
	// These two fields need to be converted manually
	cnsi.CNSIType, err = getCNSIType(pCNSIType)
	if err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to get CNSI type: %v", err)
	}

	cnsi.APIEndpoint, err = url.Parse(pURL)
	if err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to parse API Endpoint: %v", err)
	}

	return *cnsi, nil
}

func getCNSIType(cnsi string) (CNSIType, error) {
	var newType CNSIType

	switch cnsi {
	case
		"hcf",
		"hce":
		return CNSIType(cnsi), nil
	}
	return newType, errors.New("Invalid string passed to getCNSIType.")
}

// Save - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Save(guid string, cnsi CNSIRecord) error {

	stmt, err := p.db.Prepare(saveCNSI)
	if err != nil {
		return fmt.Errorf("Unable to Prepare/Save CNSI record: %v", err)
	}

	_, err = stmt.Exec(guid,
		cnsi.Name,
		fmt.Sprintf("%s", cnsi.CNSIType),
		fmt.Sprintf("%s", cnsi.APIEndpoint),
		cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint)
	if err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}
