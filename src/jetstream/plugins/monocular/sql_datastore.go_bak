package monocular

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/helm/monocular/chartrepo"

	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/helm/monocular/chartsvc/models"
)

var insertChart = `INSERT INTO charts (id, name, repo_name, update_batch, content)
						VALUES ($1, $2, $3, $4, $5)`

var deleteChart = `DELETE FROM charts WHERE id = $1`

var countCharts = `SELECT COUNT(*)
											FROM charts
											WHERE id = $1`

var updateChart = `UPDATE charts
										SET name = $1, repo_name = $2, update_batch = $3, content = $4
										WHERE id = $5`

var insertChartFile = `INSERT INTO chart_files (id, filename, chart_id, name, repo_name, digest, content) VALUES ($1, $2, $3, $4, $5, $6, $7)`
var updateChartFile = `UPDATE chart_files SET chart_id = $1, name = $2, repo_name = $3, digest = $4, content = $5 WHERE id = $6 AND filename = $7`
var countChartFile = `SELECT COUNT(*) FROM chart_files WHERE id = $1 AND filename = $2`

var deleteChartFiles = `DELETE FROM chart_files WHERE (name, repo_name) IN (SELECT name, repo_name FROM charts WHERE repo_name = $1 AND update_batch != $2)`
var deleteCharts = `DELETE FROM charts WHERE repo_name = $1 AND update_batch != $2`

var deleteRepoChartFiles = `DELETE FROM chart_files WHERE repo_name = $1`
var deleteRepoCharts = `DELETE FROM charts WHERE repo_name = $1`

var getAllCharts = `SELECT c.id, c.content, f.filename as has_icon from charts c left join chart_files f on c.id = f.chart_id AND f.filename="icon"`

var getChart = `SELECT c.content, f.filename as has_icon from charts c LEFT JOIN chart_files f on c.id = f.chart_id AND f.filename="icon" WHERE c.id = $1`

var getChartFile = `SELECT content from chart_files WHERE chart_id = $1 AND filename=$2`

var getChartFileByID = `SELECT content from chart_files WHERE id = $1 AND filename=$2`

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
	insertChart = datastore.ModifySQLStatement(insertChart, databaseProvider)
	deleteChart = datastore.ModifySQLStatement(deleteChart, databaseProvider)
	countCharts = datastore.ModifySQLStatement(countCharts, databaseProvider)
	updateChart = datastore.ModifySQLStatement(updateChart, databaseProvider)
	insertChartFile = datastore.ModifySQLStatement(insertChartFile, databaseProvider)
	updateChartFile = datastore.ModifySQLStatement(updateChartFile, databaseProvider)
	countChartFile = datastore.ModifySQLStatement(countChartFile, databaseProvider)
	deleteCharts = datastore.ModifySQLStatement(deleteCharts, databaseProvider)
	deleteChartFiles = datastore.ModifySQLStatement(deleteChartFiles, databaseProvider)
	deleteRepoChartFiles = datastore.ModifySQLStatement(deleteRepoChartFiles, databaseProvider)
	deleteRepoCharts = datastore.ModifySQLStatement(deleteRepoCharts, databaseProvider)

	getAllCharts = datastore.ModifySQLStatement(getAllCharts, databaseProvider)
	getChart = datastore.ModifySQLStatement(getChart, databaseProvider)
	getChartFile = datastore.ModifySQLStatement(getChartFile, databaseProvider)
	getChartFileByID = datastore.ModifySQLStatement(getChartFileByID, databaseProvider)
	getRepositories = datastore.ModifySQLStatement(getRepositories, databaseProvider)
}

// DeleteRepo will delete all charts and chart fils for a give repository
func (s *SQLDBCMonocularDatastore) DeleteRepo(repoName string) error {

	log.Debugf("Deleting helm repo: %s", repoName)

	// Delete all charts for a repo
	if _, err := s.db.Exec(deleteRepoChartFiles, repoName); err != nil {
		log.Error("Could not delete files")
		return fmt.Errorf("Unable to delete chart files: %v", err)
	}

	if _, err := s.db.Exec(deleteRepoCharts, repoName); err != nil {
		log.Error("Could not delete charts")
		return fmt.Errorf("Unable to delete chart: %v", err)
	}

	return nil
}

func (s *SQLDBCMonocularDatastore) ImportCharts(charts []chartrepo.Chart) error {

	if len(charts) == 0 {
		return nil
	}

	// Use a new batch ID for all charts, so we can then delete all removed charts
	updateBatchID := uuid.NewV4().String()

	// Iterate over all of the charts, one by one
	for _, c := range charts {

		// Check if existing chart exists
		var count int
		err := s.db.QueryRow(countCharts, c.ID).Scan(&count)
		if err != nil {
			log.Errorf("Unknown error attempting to find chart: %v", err)
		}

		// Serialize Chart to JSON
		content, err := json.Marshal(c)
		if err != nil {
			return fmt.Errorf("Could not serialize Chart to JSON: %v", err)
		}

		switch count {
		case 0:
			log.Debug("Inserting new chart")
			if _, err := s.db.Exec(insertChart, c.ID, c.Name, c.Repo.Name, updateBatchID, content); err != nil {
				msg := "Unable to insert new Chart: %v"
				log.Debugf(msg, err)
				return fmt.Errorf(msg, err)
			}
			log.Debug("Chart inserted")
		default:
			log.Debug("Performing UPDATE of existing chart")
			if _, updateErr := s.db.Exec(updateChart, c.Name, c.Repo.Name, updateBatchID, content, c.ID); updateErr != nil {
				msg := "Unable to UPDATE UAA token: %v"
				log.Debugf(msg, updateErr)
				return fmt.Errorf(msg, updateErr)
			}
		}
	}

	repoName := charts[0].Repo.Name

	// Delete all chart files for charts no longer needed
	if _, err := s.db.Exec(deleteChartFiles, repoName, updateBatchID); err != nil {
		return fmt.Errorf("Unable to delete chart files: %v", err)
	}

	if _, err := s.db.Exec(deleteChart, repoName); err != nil {
		return fmt.Errorf("Unable to delete charts: %v", err)
	}

	return nil
}

func (s *SQLDBCMonocularDatastore) StoreChartIcon(c chartrepo.Chart, b bytes.Buffer) error {
	// Store as a file
	return s.addFile(c.ID, "icon", c.Name, c.Repo.Name, "icon", b.Bytes())
}

func (s *SQLDBCMonocularDatastore) StoreChartFiles(fileID string, files chartrepo.ChartFiles) error {

	ids := strings.Split(fileID, "/")
	chartIDs := strings.Split(ids[1], "-")

	if len(files.Readme) > 0 {
		if err := s.addFile(fileID, "readme", chartIDs[0], files.Repo.Name, files.Digest, []byte(files.Readme)); err != nil {
			return err
		}
	}

	if len(files.Values) > 0 {
		if err := s.addFile(fileID, "values", chartIDs[0], files.Repo.Name, files.Digest, []byte(files.Values)); err != nil {
			return err
		}
	}
	return nil
}

func (s *SQLDBCMonocularDatastore) addFile(id, filename, name, repo, digest string, content []byte) error {

	chartID := fmt.Sprintf("%s/%s", repo, name)

	// Check if file already exists
	var count int
	err := s.db.QueryRow(countChartFile, id, filename).Scan(&count)
	if err != nil {
		log.Errorf("Unknown error attempting to find chart file: %v", err)
	}

	switch count {
	case 0:
		log.Debug("Inserting new chart file")
		if _, err := s.db.Exec(insertChartFile, id, filename, chartID, name, repo, digest, content); err != nil {
			msg := "Unable to insert new chart file: %v"
			log.Debugf(msg, err)
			return fmt.Errorf(msg, err)
		}
		log.Debug("Chart inserted")
	default:
		log.Debug("Performing update of existing chart file")
		if _, updateErr := s.db.Exec(updateChartFile, chartID, name, repo, digest, content, id, filename); updateErr != nil {
			msg := "Unable to update existing chart file: %v"
			log.Debugf(msg, updateErr)
			return fmt.Errorf(msg, updateErr)
		}
	}
	return nil
}

// ListCharts gets all charts
func (s *SQLDBCMonocularDatastore) ListCharts() ([]*models.Chart, error) {

	rows, err := s.db.Query(getAllCharts)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Helm charts: %v", err)
	}
	defer rows.Close()

	var charts []*models.Chart
	charts = make([]*models.Chart, 0)

	for rows.Next() {
		var (
			id      string
			content []byte
			hasIcon sql.NullString
		)

		err := rows.Scan(&id, &content, &hasIcon)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan chart records: %v", err)
		}

		// Deserialize JSON
		chart := &models.Chart{}
		if err := json.Unmarshal(content, chart); err == nil {
			charts = append(charts, chart)
			chart.ID = id
			if hasIcon.Valid {
				chart.RawIcon = []byte(hasIcon.String)
			}
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to get chart records: %v", err)
	}

	return charts, nil
}

func (s *SQLDBCMonocularDatastore) GetChart(chartID string) (models.Chart, error) {

	var (
		content []byte
		hasIcon sql.NullString
	)

	chart := models.Chart{}

	err := s.db.QueryRow(getChart, chartID).Scan(&content, &hasIcon)
	if err != nil {
		return chart, fmt.Errorf("Unable to scan chart record: %v", err)
	}

	// Deserialize JSON
	if err := json.Unmarshal(content, &chart); err == nil {
		chart.ID = chartID
		if hasIcon.Valid {
			chart.RawIcon = []byte(hasIcon.String)
		}
	} else {
		return chart, fmt.Errorf("Unable to deserialize chart: %v+", err)
	}

	return chart, nil

}

func (s *SQLDBCMonocularDatastore) GetChartVersion(chartID, version string) (models.Chart, error) {
	chart, err := s.GetChart(chartID)
	if err != nil {
		return chart, err
	}

	// Find the version
	for _, v := range chart.ChartVersions {
		if v.Version == version {
			chart.ChartVersions = make([]models.ChartVersion, 1)
			chart.ChartVersions[0] = v
			return chart, err
		}
	}

	return chart, fmt.Errorf("Can not find chart version: %s", version)
}

func (s *SQLDBCMonocularDatastore) GetChartIcon(chartID string) ([]byte, error) {
	var content []byte
	err := s.db.QueryRow(getChartFile, chartID, "icon").Scan(&content)
	if err != nil {
		return nil, fmt.Errorf("Unable to scan chart file record: %v", err)
	}

	return content, nil
}

func (s *SQLDBCMonocularDatastore) GetChartVersionReadme(chartID, version string) ([]byte, error) {
	var content []byte
	fileID := fmt.Sprintf("%s-%s", chartID, version)
	err := s.db.QueryRow(getChartFileByID, fileID, "readme").Scan(&content)
	if err != nil {
		return nil, fmt.Errorf("Unable to scan chart file record: %v", err)
	}

	return content, nil
}

func (s *SQLDBCMonocularDatastore) GetChartVersionValuesYaml(chartID, version string) ([]byte, error) {
	var content []byte
	fileID := fmt.Sprintf("%s-%s", chartID, version)
	err := s.db.QueryRow(getChartFileByID, fileID, "values").Scan(&content)
	if err != nil {
		return nil, fmt.Errorf("Unable to scan chart file record: %v", err)
	}

	return content, nil
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
