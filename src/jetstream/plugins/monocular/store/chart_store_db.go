package store

import (
	"database/sql"
	"errors"
	"fmt"
	"sort"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	log "github.com/sirupsen/logrus"
)

var (
	saveChartVersion   = `INSERT INTO helm_charts (endpoint, name, repo_name, version, created, app_version, description, icon_url, chart_url, source_url, digest, is_latest, update_batch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
	updateChartVersion = `UPDATE helm_charts SET created=$1, app_version=$2, description=$3, icon_url=$4, chart_url=$5, source_url=$6, digest=$7, is_latest=$8, update_batch=$9 WHERE endpoint=$10 AND name=$11 AND repo_name=$12 AND version=$13`
	deleteChartVersion = `DELETE FROM helm_charts WHERE endpoint = $1 AND name = $2 and version = $3`
	deleteForEndpoint  = `DELETE FROM helm_charts WHERE endpoint = $1`
	deleteForBatch     = `DELETE FROM helm_charts WHERE endpoint = $1 AND name = $2 and update_batch != $3`
	renameEndpoint     = `UPDATE helm_charts SET repo_name=$1 WHERE endpoint=$2`
	getLatestCharts    = `SELECT endpoint, name, repo_name, version, created, app_version, description, icon_url, chart_url, source_url, digest, is_latest FROM helm_charts WHERE is_latest = true`
	getLatestChart     = `SELECT endpoint, name, repo_name, version, created, app_version, description, icon_url, chart_url, source_url, digest, is_latest FROM helm_charts WHERE repo_name = $1 AND name = $2 AND is_latest = true`
	getChartVersion    = `SELECT endpoint, name, repo_name, version, created, app_version, description, icon_url, chart_url, source_url, digest, is_latest FROM helm_charts WHERE repo_name = $1 AND name = $2 AND version = $3`
	getChartVersions   = `SELECT endpoint, name, repo_name, version, created, app_version, description, icon_url, chart_url, source_url, digest, is_latest FROM helm_charts WHERE repo_name = $1 AND name = $2`
	getEndpointIDs     = `SELECT DISTINCT endpoint FROM helm_charts`
	updateChartDigest  = `UPDATE helm_charts SET created=$1, is_latest=$2, update_batch=$3 WHERE endpoint=$4 AND name=$5 AND repo_name=$6 AND version=$7`
)

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	saveChartVersion = datastore.ModifySQLStatement(saveChartVersion, databaseProvider)
	updateChartVersion = datastore.ModifySQLStatement(updateChartVersion, databaseProvider)
	updateChartVersion = datastore.ModifySQLStatement(updateChartVersion, databaseProvider)
	updateChartDigest = datastore.ModifySQLStatement(updateChartDigest, databaseProvider)
	deleteForEndpoint = datastore.ModifySQLStatement(deleteForEndpoint, databaseProvider)
	deleteForBatch = datastore.ModifySQLStatement(deleteForBatch, databaseProvider)
	renameEndpoint = datastore.ModifySQLStatement(renameEndpoint, databaseProvider)
	getLatestCharts = datastore.ModifySQLStatement(getLatestCharts, databaseProvider)
	getLatestChart = datastore.ModifySQLStatement(getLatestChart, databaseProvider)
	getChartVersion = datastore.ModifySQLStatement(getChartVersion, databaseProvider)
	getChartVersions = datastore.ModifySQLStatement(getChartVersions, databaseProvider)
	getEndpointIDs = datastore.ModifySQLStatement(getEndpointIDs, databaseProvider)
}

// HelmChartDBStore is a DB-backed Helm Chart repository
type HelmChartDBStore struct {
	db *sql.DB
}

// NewHelmChartDBStore will create a new instance of the AnalysisDBStore
func NewHelmChartDBStore(dcp *sql.DB) (ChartStore, error) {
	return &HelmChartDBStore{db: dcp}, nil
}

func truncate(in string) string {
	return fmt.Sprintf("%.255s", in)
}

// Save a Helm Chart to the database
func (p *HelmChartDBStore) Save(chart ChartStoreRecord, batchID string) error {

	sourceURL := ""
	if len(chart.Sources) > 0 {
		sourceURL = chart.Sources[0]
	}

	// Get the existing record - if it has the same digest, then no need to store it
	record, err := p.GetChart(chart.Repository, chart.Name, chart.Version)
	if err == nil && record.Digest == chart.Digest {
		log.Debugf("Chart already exists %s/%s-%s with digest %s", chart.Repository, chart.Name, chart.Version, chart.Digest)
		_, err := p.db.Exec(updateChartDigest, chart.Created, chart.IsLatest, batchID, chart.EndpointID, chart.Name, chart.Repository, chart.Version)
		return err
	}

	if err == nil {
		log.Debugf("Chart already exists %s/%s-%s with different digest %s", chart.Repository, chart.Name, chart.Version, chart.Digest)
		// The record already exists, so update it
		_, err := p.db.Exec(updateChartVersion, chart.Created, chart.AppVersion, truncate(chart.Description), truncate(chart.IconURL), truncate(chart.ChartURL), truncate(sourceURL), chart.Digest, chart.IsLatest, batchID, chart.EndpointID, chart.Name, chart.Repository, chart.Version)
		return err
	}

	if _, err := p.db.Exec(saveChartVersion, chart.EndpointID, chart.Name, chart.Repository, chart.Version, chart.Created, chart.AppVersion, truncate(chart.Description), truncate(chart.IconURL), truncate(chart.ChartURL), truncate(sourceURL), chart.Digest, chart.IsLatest, batchID); err != nil {
		return fmt.Errorf("Unable to save Helm Chart Version: %v", err)
	}
	return nil
}

// DeleteBatch will remove all chart versions not with the given batch id
func (p *HelmChartDBStore) DeleteBatch(endpointID, chart, batchID string) error {
	if _, err := p.db.Exec(deleteForBatch, endpointID, chart, batchID); err != nil {
		return fmt.Errorf("Unable to delete Helm Chart Versions for batch ID: %s %v", batchID, err)
	}
	return nil
}

// DeleteForEndpoint will remove all Helm Charts for a given endpoint guid
func (p *HelmChartDBStore) DeleteForEndpoint(endpointID string) error {
	if _, err := p.db.Exec(deleteForEndpoint, endpointID); err != nil {
		return fmt.Errorf("Unable to delete Helm Charts for endpoint: %s %v", endpointID, err)
	}
	return nil
}

// RenameEndpoint will update all charts for a given endpoint to have the new repository name
func (p *HelmChartDBStore) RenameEndpoint(endpointID, name string) error {
	if _, err := p.db.Exec(renameEndpoint, name, endpointID); err != nil {
		return fmt.Errorf("Unable to rename Helm Chart repository for endpoint: %s %v", endpointID, err)
	}
	return nil
}

// GetLatestCharts will get only the info for the latest version of each chart
func (p *HelmChartDBStore) GetLatestCharts() ([]*ChartStoreRecord, error) {

	rows, err := p.db.Query(getLatestCharts)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Helm Charts: %v", err)
	}
	defer rows.Close()

	var chartList []*ChartStoreRecord

	for rows.Next() {
		chart := new(ChartStoreRecord)
		sourceURL := ""
		err := rows.Scan(&chart.EndpointID, &chart.Name, &chart.Repository, &chart.Version, &chart.Created, &chart.AppVersion, &chart.Description, &chart.IconURL, &chart.ChartURL, &sourceURL, &chart.Digest, &chart.IsLatest)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Helm Chart records: %v", err)
		}
		chart.SemVer = NewSemanticVersion(chart.Version)
		addSources(chart, sourceURL)
		chartList = append(chartList, chart)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list Helm Chart records: %v", err)
	}

	return chartList, nil
}

// GetChart gets a single helm chart
func (p *HelmChartDBStore) GetChart(repo, name, version string) (*ChartStoreRecord, error) {

	var row *sql.Row
	chart := new(ChartStoreRecord)

	if len(version) == 0 {
		row = p.db.QueryRow(getLatestChart, repo, name)
	} else {
		row = p.db.QueryRow(getChartVersion, repo, name, version)
	}

	sourceURL := ""
	err := row.Scan(&chart.EndpointID, &chart.Name, &chart.Repository, &chart.Version, &chart.Created, &chart.AppVersion, &chart.Description, &chart.IconURL, &chart.ChartURL, &sourceURL, &chart.Digest, &chart.IsLatest)
	switch {
	case err == sql.ErrNoRows:
		return chart, errors.New("No match for that chart")
	case err != nil:
		return chart, fmt.Errorf("Error trying to find chart record: %v", err)
	default:
		// do nothing
	}

	chart.SemVer = NewSemanticVersion(chart.Version)
	addSources(chart, sourceURL)

	return chart, nil
}

// GetChartVersions will get all of the versions for a given chart
func (p *HelmChartDBStore) GetChartVersions(repo, name string) ([]*ChartStoreRecord, error) {
	rows, err := p.db.Query(getChartVersions, repo, name)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Helm Charts: %v", err)
	}
	defer rows.Close()

	var chartList ChartStoreRecordList

	for rows.Next() {
		chart := new(ChartStoreRecord)
		sourceURL := ""
		err := rows.Scan(&chart.EndpointID, &chart.Name, &chart.Repository, &chart.Version, &chart.Created, &chart.AppVersion, &chart.Description, &chart.IconURL, &chart.ChartURL, &sourceURL, &chart.Digest, &chart.IsLatest)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Helm Chart records: %v", err)
		}
		chart.SemVer = NewSemanticVersion(chart.Version)
		addSources(chart, sourceURL)
		chartList = append(chartList, chart)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list Helm Chart records: %v", err)
	}

	// Sort list by version
	sort.Sort(chartList)
	return chartList, nil
}

// GetEndpointIDs will get all unique endpoint IDs from the database
func (p *HelmChartDBStore) GetEndpointIDs() ([]string, error) {
	rows, err := p.db.Query(getEndpointIDs)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint IDs: %v", err)
	}
	defer rows.Close()

	list := make([]string, 0)

	for rows.Next() {
		var endpoint string
		err := rows.Scan(&endpoint)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Helm Chart records for endpoints: %v", err)
		}
		list = append(list, endpoint)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list Helm Chart endpoints: %v", err)
	}

	return list, nil
}

func addSources(record *ChartStoreRecord, sourceURL string) {
	record.Sources = make([]string, 0)
	if len(sourceURL) > 0 {
		record.Sources = append(record.Sources, sourceURL)
	}
}
