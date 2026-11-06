package analysis

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/analysis/store"

	"github.com/labstack/echo/v5"
)

const mainReportFile = "report.json"

// listReports will list the analysis repotrs that have run
func (c *Analysis) listReports(ec *echo.Context) error {
	slog.Debug("listReports")
	var p = c.portalProxy

	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)
	endpointID := ec.Param("endpoint")

	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	reports, err := dbStore.List(userID, endpointID)
	if err != nil {
		return err
	}

	for _, report := range reports {
		populateSummary(report)
	}

	return ec.JSON(200, reports)
}

// getReportsByPath will list the completed analysis repotrs that have run for the specified path
func (c *Analysis) getReportsByPath(ec *echo.Context) error {
	slog.Debug("getReportsByPath")
	var p = c.portalProxy

	// Need to get a config object for the target endpoint
	userID := ec.Get("user_id").(string)
	endpointID := ec.Param("endpoint")

	pathPrefix := fmt.Sprintf("completed/%s/", endpointID)
	index := strings.Index(ec.Request().RequestURI, pathPrefix)
	if index < 0 {
		return errors.New("Invalid request")
	}
	path := ec.Request().RequestURI[index+len(pathPrefix):]

	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	reports, err := dbStore.ListCompletedByPath(userID, endpointID, path)
	if err != nil {
		return err
	}

	for _, report := range reports {
		populateSummary(report)
	}

	return ec.JSON(200, reports)
}

func populateSummary(report *store.AnalysisRecord) {
	if report.Status == "error" {
		report.Error = report.Result
	} else if len(report.Result) > 0 {
		data := []byte(report.Result)
		report.Summary = (*json.RawMessage)(&data)
	}
}

func (c *Analysis) getLatestReport(ec *echo.Context) error {
	slog.Debug("getLatestReport")
	var p = c.portalProxy

	// Need to get a config object for the target endpoint
	userID := ec.Get("user_id").(string)
	endpointID := ec.Param("endpoint")

	pathPrefix := fmt.Sprintf("latest/%s/", endpointID)
	index := strings.Index(ec.Request().RequestURI, pathPrefix)
	if index < 0 {
		return errors.New("Invalid request")
	}
	path := ec.Request().RequestURI[index+len(pathPrefix):]

	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	report, err := dbStore.GetLatestCompleted(userID, endpointID, path)
	if err != nil {
		return echo.NewHTTPError(404, "No Analysis Report found")
	}

	if ec.Request().Method == "HEAD" {
		return ec.NoContent(200)
	}

	// Get the report contents from the analysis server
	bytes, err := c.getReportFile(report.UserID, report.EndpointID, report.ID, mainReportFile)
	if err != nil {
		return err
	}

	report.Report = (*json.RawMessage)(&bytes)
	return ec.JSON(200, report)
}

func (c *Analysis) getReport(ec *echo.Context) error {
	slog.Debug("getReport")
	var p = c.portalProxy

	// Need to get a config object for the target endpoint
	userID := ec.Get("user_id").(string)
	ID := ec.Param("id")
	file := ec.Param("file")
	if len(file) == 0 {
		file = mainReportFile
	}

	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	report, err := dbStore.Get(userID, ID)
	if err != nil {
		return err
	}

	// Get the report contents from the analysis server
	bytes, err := c.getReportFile(report.UserID, report.EndpointID, report.ID, file)
	if err != nil {
		return err
	}

	report.Report = (*json.RawMessage)(&bytes)
	return ec.JSON(200, report)
}

func (c *Analysis) deleteReports(ec *echo.Context) error {
	slog.Debug("deleteReports")
	var p = c.portalProxy

	// Need to get a config object for the target endpoint
	userID := ec.Get("user_id").(string)

	defer func() { _ = ec.Request().Body.Close() }()
	body, err := io.ReadAll(ec.Request().Body)
	if err != nil {
		return err
	}

	ids := make([]string, 0)
	if err = json.Unmarshal(body, &ids); err != nil {
		return err
	}

	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	for _, id := range ids {
		// Look up the report to get the endpoint ID
		if job, err := dbStore.Get(userID, id); err == nil {
			deleteURL := fmt.Sprintf("%s/api/v1/report/%s/%s/%s", c.analysisServer, job.UserID, job.EndpointID, job.ID)
			r, _ := http.NewRequest(http.MethodDelete, deleteURL, nil)
			client := &http.Client{Timeout: 30 * time.Second}
			rsp, err := client.Do(r)
			if err != nil {
				slog.Warn("the request to delete the analysis report failed",
					"report", job.ID, "url", deleteURL, "error", err)
			} else if rsp.StatusCode != http.StatusOK {
				slog.Warn("the analysis server refused to delete the report",
					"report", job.ID, "url", deleteURL, "status", rsp.StatusCode)
			}
		}
		if err := dbStore.Delete(userID, id); err != nil {
			slog.Warn("could not delete the analysis report from the store", "report", id, "user", userID, "error", err)
		}
	}

	return ec.JSON(200, ids)
}

func (c *Analysis) getReportFile(userID, endpointID, ID, name string) ([]byte, error) {
	// Make request to get report
	statusURL := fmt.Sprintf("%s/api/v1/report/%s/%s/%s/%s", c.analysisServer, userID, endpointID, ID, name)
	r, _ := http.NewRequest(http.MethodGet, statusURL, nil)
	client := &http.Client{Timeout: 30 * time.Second}
	rsp, err := client.Do(r)
	if err != nil {
		return nil, fmt.Errorf("Failed getting report from Analyzer service: %v", err)
	} else if rsp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Failed getting report from Analyzer service: %d", rsp.StatusCode)
	}

	defer func() { _ = rsp.Body.Close() }()
	response, err := io.ReadAll(rsp.Body)
	if err != nil {
		return nil, fmt.Errorf("Could not read response: %v", err)
	}

	return response, nil
}
