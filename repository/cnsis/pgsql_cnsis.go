package cnsis

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
)

const (
	listCNSIs = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
               FROM cnsis`

	listCNSIsByUser = `SELECT c.guid, c.name, c.api_endpoint, t.user_guid, t.token_expiry
                     FROM cnsis c, tokens t
                     WHERE c.guid = t.cnsi_guid AND t.token_type=$1 AND t.user_guid=$2`

	findCNSI = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
              FROM cnsis
              WHERE guid=$1`

	saveCNSI = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint)
              VALUES ($1, $2, $3, $4, $5, $6)`

	deleteCNSI = `DELETE FROM cnsis WHERE guid = $1`
)

// TODO (wchrisjohnson) We need to adjust several calls ^ to accept a list of items (guids) as input

// PostgresCNSIRepository is a PostgreSQL-backed CNSI repository
type PostgresCNSIRepository struct {
	db *sql.DB
}

// NewPostgresCNSIRepository will create a new instance of the PostgresInstanceRepository
func NewPostgresCNSIRepository(dcp *sql.DB) (Repository, error) {
	return &PostgresCNSIRepository{db: dcp}, nil
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
		var (
			pCNSIType string
			pURL      string
		)

		cnsi := new(CNSIRecord)

		err := rows.Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL, &cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		if cnsi.CNSIType, err = getCNSIType(pCNSIType); err != nil {
			return nil, fmt.Errorf("Unable to get CNSI type: %v", err)
		}

		if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		cnsiList = append(cnsiList, cnsi)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List CNSI records: %v", err)
	}

	return cnsiList, nil
}

// ListByUser - Returns a list of CNSIs registered by a user
func (p *PostgresCNSIRepository) ListByUser(userGUID string) ([]*RegisteredCluster, error) {

	rows, err := p.db.Query(listCNSIsByUser, "cnsi", userGUID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var clusterList []*RegisteredCluster
	clusterList = make([]*RegisteredCluster, 0)

	for rows.Next() {
		var (
			pURL string
		)

		cluster := new(RegisteredCluster)
		err := rows.Scan(&cluster.GUID, &cluster.Name, &pURL, &cluster.Account, &cluster.TokenExpiry)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan cluster records: %v", err)
		}

		if cluster.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		clusterList = append(clusterList, cluster)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List cluster records: %v", err)
	}

	return clusterList, nil
}

// Find - Returns a single CNSI Record
func (p *PostgresCNSIRepository) Find(guid string) (CNSIRecord, error) {

	var (
		pCNSIType string
		pURL      string
	)

	cnsi := new(CNSIRecord)

	err := p.db.QueryRow(findCNSI, guid).Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL,
		&cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint)

	switch {
	case err == sql.ErrNoRows:
		return CNSIRecord{}, errors.New("No match for that GUID")
	case err != nil:
		return CNSIRecord{}, fmt.Errorf("Error trying to Find CNSI record: %v", err)
	default:
		// do nothing
	}

	// TODO(wchrisjohnson): discover a way to do this automagically
	// These two fields need to be converted manually
	if cnsi.CNSIType, err = getCNSIType(pCNSIType); err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to get CNSI type: %v", err)
	}

	if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
		return CNSIRecord{}, fmt.Errorf("Unable to parse API Endpoint: %v", err)
	}

	return *cnsi, nil
}

// Save - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Save(guid string, cnsi CNSIRecord) error {

	if _, err := p.db.Exec(saveCNSI, guid, cnsi.Name, fmt.Sprintf("%s", cnsi.CNSIType),
		fmt.Sprintf("%s", cnsi.APIEndpoint), cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint); err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}

// Delete - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Delete(guid string) error {

	if _, err := p.db.Exec(deleteCNSI, guid); err != nil {
		return fmt.Errorf("Unable to Delete CNSI record: %v", err)
	}

	return nil
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
