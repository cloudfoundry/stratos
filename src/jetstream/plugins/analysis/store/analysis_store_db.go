package store

import (
	"database/sql"
	"fmt"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

var (
	listReports                = `SELECT id, endpoint_type, endpoint, user, name, path, type, format, created, acknowledged, status, duration, result FROM analysis WHERE user = $1 AND endpoint = $2`
	listCompletedReportsByPath = `SELECT id, endpoint_type, endpoint, user, name, path, type, format, created, acknowledged, status, duration, result FROM analysis WHERE status = 'completed' AND user = $1 AND endpoint = $2 AND path = $3 ORDER BY created DESC`
	getReport                  = `SELECT id, endpoint_type, endpoint, user, name, path, type, format, created, acknowledged, status, duration, result FROM analysis WHERE user = $1 AND id=$2`
	deleteReport               = `DELETE FROM analysis WHERE user = $1 AND id = $2`
	saveReport                 = `INSERT INTO analysis (id, user, endpoint_type, endpoint, name, path, type, format, created, acknowledged, status, duration, result) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
	updateReport               = `UPDATE analysis SET type = $1, format = $2, acknowledged = $3, status = $4, duration = $5, result = $6, name = $7, path = $8, result = $9 WHERE user = $10 AND id = $11`
	getLatestReport            = `SELECT id, endpoint_type, endpoint, user, name, path, type, format, created, acknowledged, status, duration, result FROM analysis WHERE status = 'completed' AND user = $1 AND endpoint = $2 AND path = $3 ORDER BY created DESC`
	listRunningReports         = `SELECT id, endpoint_type, endpoint, user, name, path, type, format, created, acknowledged, status, duration, result FROM analysis WHERE status = 'running' ORDER BY created DESC`
	deleteForEndpoint          = `DELETE FROM analysis WHERE endpoint = $1`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	listReports = datastore.ModifySQLStatement(listReports, databaseProvider)
	listCompletedReportsByPath = datastore.ModifySQLStatement(listCompletedReportsByPath, databaseProvider)
	getReport = datastore.ModifySQLStatement(getReport, databaseProvider)
	deleteReport = datastore.ModifySQLStatement(deleteReport, databaseProvider)
	saveReport = datastore.ModifySQLStatement(saveReport, databaseProvider)
	updateReport = datastore.ModifySQLStatement(updateReport, databaseProvider)
	getLatestReport = datastore.ModifySQLStatement(getLatestReport, databaseProvider)
	listRunningReports = datastore.ModifySQLStatement(listRunningReports, databaseProvider)
	deleteForEndpoint = datastore.ModifySQLStatement(deleteForEndpoint, databaseProvider)
}

// AnalysisDBStore is a DB-backed Analysis Reports repository
type AnalysisDBStore struct {
	db *sql.DB
}

// NewAnalysisDBStore will create a new instance of the AnalysisDBStore
func NewAnalysisDBStore(dcp *sql.DB) (AnalysisStore, error) {
	return &AnalysisDBStore{db: dcp}, nil
}

// List - Returns a list of all user Analysis Reports for the given endpoint
func (p *AnalysisDBStore) List(userGUID, endpointID string) ([]*AnalysisRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(listReports, userGUID, endpointID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Analysis Reports records: %v", err)
	}
	defer rows.Close()

	return list(rows)
}

func (p *AnalysisDBStore) ListCompletedByPath(userGUID, endpointID, path string) ([]*AnalysisRecord, error) {
	log.Debug("ListCompletedByPath")
	rows, err := p.db.Query(listCompletedReportsByPath, userGUID, endpointID, path)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Analysis Reports records: %v", err)
	}
	defer rows.Close()

	return list(rows)
}

func (p *AnalysisDBStore) ListRunning() ([]*AnalysisRecord, error) {
	log.Debug("ListRunning")
	rows, err := p.db.Query(listRunningReports)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Analysis Reports records: %v", err)
	}
	defer rows.Close()

	return list(rows)
}

func list(rows *sql.Rows) ([]*AnalysisRecord, error) {
	var reportList []*AnalysisRecord
	reportList = make([]*AnalysisRecord, 0)

	for rows.Next() {
		report := new(AnalysisRecord)
		err := rows.Scan(&report.ID, &report.EndpointType, &report.EndpointID, &report.UserID, &report.Name, &report.Path, &report.Type, &report.Format, &report.Created, &report.Read, &report.Status, &report.Duration, &report.Result)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Analysis Reports records: %v", err)
		}
		reportList = append(reportList, report)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List Analysis Reports records: %v", err)
	}

	return reportList, nil
}

// Get - Get a specific Analysis Report by ID
func (p *AnalysisDBStore) Get(userGUID, ID string) (*AnalysisRecord, error) {
	log.Debug("Get")

	report := AnalysisRecord{}
	err := p.db.QueryRow(getReport, userGUID, ID).Scan(&report.ID, &report.EndpointType, &report.EndpointID, &report.UserID, &report.Name, &report.Path, &report.Type, &report.Format, &report.Created, &report.Read, &report.Status, &report.Duration, &report.Result)
	if err != nil {
		msg := "Unable to Get Analysis Report record: %v"
		log.Debugf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return &report, nil
}

// GetLatestCompleted - Get latest report for the specified path
func (p *AnalysisDBStore) GetLatestCompleted(userGUID, endpointID, path string) (*AnalysisRecord, error) {
	log.Debug("GetLatestCompleted")

	report := AnalysisRecord{}
	err := p.db.QueryRow(getLatestReport, userGUID, endpointID, path).Scan(&report.ID, &report.EndpointType, &report.EndpointID, &report.UserID, &report.Name, &report.Path, &report.Type, &report.Format, &report.Created, &report.Read, &report.Status, &report.Duration, &report.Result)
	if err != nil {
		msg := "Unable to get laetst completed Analysis Report record: %v"
		log.Debugf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return &report, nil
}

// Delete will delete an Analysis Report from the datastore
func (p *AnalysisDBStore) Delete(userGUID string, id string) error {
	if _, err := p.db.Exec(deleteReport, userGUID, id); err != nil {
		return fmt.Errorf("Unable to delete Analysis Report record: %v", err)
	}

	return nil
}

// UpdateReport will update the dynamic fields of the Analysis Record in thedatastore
func (p *AnalysisDBStore) UpdateReport(userGUID string, report *AnalysisRecord) error {
	if _, err := p.db.Exec(updateReport, report.Type, report.Format, report.Read, report.Status, report.Duration, report.Result, report.Name, report.Path, report.Result, userGUID, report.ID); err != nil {
		return fmt.Errorf("Unable to update Analysis Report record: %v", err)
	}
	return nil
}

// Save will persist an Analysis Report to the datastore
func (p *AnalysisDBStore) Save(report AnalysisRecord) (*AnalysisRecord, error) {
	if _, err := p.db.Exec(saveReport, report.ID, report.UserID, report.EndpointType, report.EndpointID, report.Name, report.Path, report.Type, report.Format, report.Created, report.Read, &report.Status, &report.Duration, &report.Result); err != nil {
		return nil, fmt.Errorf("Unable to save Analysis Report record: %v", err)
	}

	return &report, nil
}

// DeleteForEndpoint will remove all Analysis Reports for a given endpoint guid
func (p *AnalysisDBStore) DeleteForEndpoint(endpointID string) error {
	if _, err := p.db.Exec(deleteForEndpoint, endpointID); err != nil {
		return fmt.Errorf("Unable to delete reports for endpoint: %s %v", endpointID, err)
	}
	return nil
}
