package vcs

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
	"net/url"
)

const (
	listVcs = `SELECT guid, label, type, browse_url, api_url, skip_ssl_validation
               FROM vcs`

	listVcsByUser = `SELECT v.guid, v.label, v.type, v.browse_url, v.api_url, v.skip_ssl_validation
                     FROM vcs v, vcs_tokens t
                     WHERE t.user_guid=$1 AND v.guid = t.vcs_guid`

	findVcs = `SELECT guid, label, type, browse_url, api_url, skip_ssl_validation
               FROM vcs
               WHERE guid=$1`

	findVcsByProperties = `SELECT guid, label, type, browse_url, api_url, skip_ssl_validation
                           FROM vcs
                           WHERE type=$1 AND browse_url=$2 AND api_url=$3 AND skip_ssl_validation=$4`

	saveVcs = `INSERT INTO vcs (guid, label, type, browse_url, api_url, skip_ssl_validation)
               VALUES ($1, $2, $3, $4, $5, $6)`

	deleteVcs = `DELETE FROM vcs WHERE guid = $1`
)

// PostgresVcsRepository is a PostgreSQL-backed VCS repository
type PostgresVcsRepository struct {
	db *sql.DB
}

// NewPostgresVcsRepository will create a new instance of the PostgresVcsRepository
func NewPostgresVcsRepository(dcp *sql.DB) (Repository, error) {
	log.Println("NewPostgresVcsRepository")
	return &PostgresVcsRepository{db: dcp}, nil
}

type Scannable interface {
	Scan(dest ...interface{}) error
}

// scanRow - scan a DB row into our VcsRecord struct
func scanRow(scannable Scannable) (*VcsRecord, error) {
	var vr *VcsRecord = &VcsRecord{}
	var pVcsType string

	err := scannable.Scan(&vr.Guid, &vr.Label, &pVcsType, &vr.BrowseUrl, &vr.ApiUrl, &vr.SkipSslValidation)
	if err != nil {
		return nil, fmt.Errorf("Unable to scan VCS records: %v", err)
	}

	if vr.VcsType, err = CheckVcsType(pVcsType); err != nil {
		return nil, fmt.Errorf("Unable to get VCS type: %v", err)
	}
	return vr, nil
}

// List - Returns a list of VCS Records
func (p *PostgresVcsRepository) List() ([]*VcsRecord, error) {
	log.Println("List VCS")
	rows, err := p.db.Query(listVcs)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve VCS records: %v", err)
	}
	defer rows.Close()

	var vcsList []*VcsRecord
	for rows.Next() {
		vr, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		vcsList = append(vcsList, vr)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list VCS records: %v", err)
	}

	return vcsList, nil
}

// ListByUser - Returns a list of VCSs auto-registered by a user
func (p *PostgresVcsRepository) ListByUser(userGuid string) ([]*VcsRecord, error) {
	log.Println("ListByUser")
	rows, err := p.db.Query(listVcsByUser, userGuid)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve VCS records: %v", err)
	}
	defer rows.Close()

	var vcsList []*VcsRecord
	for rows.Next() {
		vr, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		vcsList = append(vcsList, vr)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list VCS records: %v", err)
	}

	return vcsList, nil
}

// Find - Returns a single VCS Record
func (p *PostgresVcsRepository) Find(guid string) (*VcsRecord, error) {
	log.Println("Find VCS record")

	rows := p.db.QueryRow(findVcs, guid)
	vr, err := scanRow(rows)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("No match for that GUID")
		}
		return nil, fmt.Errorf("Error trying to Find VCS record: %v", err)
	}
	return vr, nil
}

// FindByProperties - If found returns the first VCS Record from the Store with matching properties
func (p *PostgresVcsRepository) FindMatching(aVcs VcsRecord) (*VcsRecord, error) {
	var vcsType string = aVcs.VcsType
	var browseUrl string = fmt.Sprintf("%s", aVcs.BrowseUrl)
	var apiUrl string = fmt.Sprintf("%s", aVcs.ApiUrl)
	var skipSslValidation bool = aVcs.SkipSslValidation

	log.Println("Find VCS record by properties")

	rows := p.db.QueryRow(findVcsByProperties, vcsType, browseUrl, apiUrl, skipSslValidation)
	vr, err := scanRow(rows)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("No match for that GUID")
		}
		return nil, fmt.Errorf("Error trying to Find VCS record: %v", err)
	}
	return vr, nil
}

// Save - Persist a VCS Record to the DB
func (p *PostgresVcsRepository) Save(vcs VcsRecord) error {
	log.Println("Save VCS record")

	checkedType, err := CheckVcsType(vcs.VcsType)
	if err != nil {
		return fmt.Errorf("Not saving VCS with unsupported type %s", vcs.VcsType)
	}
	vcs.VcsType = checkedType

	checkedBrowseUrl, err := CheckUrl(vcs.BrowseUrl)
	if err != nil {
		return fmt.Errorf("Not saving VCS with invalid Browse URL %s", vcs.BrowseUrl)
	}
	vcs.BrowseUrl = checkedBrowseUrl

	checkedApiUrl, err := CheckUrl(vcs.ApiUrl)
	if err != nil {
		return fmt.Errorf("Not saving VCS with invalid API URL %s", vcs.ApiUrl)
	}
	vcs.ApiUrl = checkedApiUrl

	if _, err := p.db.Exec(saveVcs, vcs.Guid, vcs.Label, vcs.VcsType,
		fmt.Sprintf("%s", vcs.BrowseUrl), fmt.Sprintf("%s", vcs.ApiUrl), vcs.SkipSslValidation); err != nil {
		return fmt.Errorf("Unable to Save VCS record: %v", err)
	}

	return nil
}

// Delete - Remove a VCS Record from the DB
func (p *PostgresVcsRepository) Delete(guid string) error {
	log.Println("Delete VCS record")
	if _, err := p.db.Exec(deleteVcs, guid); err != nil {
		return fmt.Errorf("Unable to Delete VCS record: %v", err)
	}

	return nil
}

// CheckVcsType - check that passed string is a legit VCS type
func CheckVcsType(vcsTypeString string) (string, error) {
	lowCaseType := strings.ToLower(vcsTypeString)
	switch lowCaseType {
	case
		VCS_GITHUB,
		VCS_BITBUCKET:
		return lowCaseType, nil
	}
	return "", fmt.Errorf("Invalid string '%s' passed to CheckVcsType.", vcsTypeString)
}

// CheckUrl - check that passed string is a parsable absolute URL
func CheckUrl(urlString string) (string, error) {
	parsed, err := url.ParseRequestURI(urlString)
	if err != nil {
		return "", err
	}
	return parsed.String(), nil
}

