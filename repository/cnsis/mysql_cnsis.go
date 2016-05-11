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
               WHERE guid=?`
	saveCNSI = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint)
							 VALUES (?, ?, ?, ?, ?, ?)`
)

// MysqlCNSIRepository is a MySQL-backed CNSI repository
type MysqlCNSIRepository struct {
	db *sql.DB
}

// NewMysqlCNSIRepository - Returns a reference to a CNSI data source
func NewMysqlCNSIRepository(configParams datastore.MysqlConnectionParameters) (Repository, error) {
	db, err := datastore.GetConnection(configParams)
	if err != nil {
		return nil, fmt.Errorf("Unable to get database reference: %v", err)
	}

	return &MysqlCNSIRepository{db: db}, nil
}

// List - Returns a list of CNSI Records
func (p *MysqlCNSIRepository) List() ([]*CNSIRecord, error) {

	rows, err := p.db.Query(listCNSIs)
	if err != nil {
		return []*CNSIRecord{}, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
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
func (p *MysqlCNSIRepository) Find(guid string) (CNSIRecord, error) {

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
	cnsi.APIEndpoint, err = url.Parse(pURL)

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
func (p *MysqlCNSIRepository) Save(guid string, cnsi CNSIRecord) error {

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
