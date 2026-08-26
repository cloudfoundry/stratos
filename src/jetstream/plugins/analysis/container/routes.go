package main

import (
	"errors"
	"io/ioutil"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v5"
)

// Ping endpoint
func (a *Analyzer) ping(ec *echo.Context) error {
	return nil
}

// Get a given report
func (a *Analyzer) report(ec *echo.Context) error {

	user := ec.Param("user")
	endpoint := ec.Param("endpoint")
	id := ec.Param("id")
	name := ec.Param("file")

	// Name must end in json - we only serve json files
	if !strings.HasSuffix(name, ".json") {
		return errors.New("Can't serve that file")
	}

	for _, seg := range []string{user, endpoint, id, name} {
		if err := validateSegment(seg); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid report path")
		}
	}

	file := filepath.Join(a.reportsDir, user, endpoint, id, name)
	_, err := os.Stat(file)
	if os.IsNotExist(err) {
		return echo.NewHTTPError(404, "No such file")
	}

	return ec.File(file)
}

// Delete a given report
func (a *Analyzer) delete(ec *echo.Context) error {
	user := ec.Param("user")
	endpoint := ec.Param("endpoint")
	id := ec.Param("id")
	slog.Debug("deleting an analysis report", "user", user, "endpoint", endpoint, "report", id)

	for _, seg := range []string{user, endpoint, id} {
		if err := validateSegment(seg); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid report path")
		}
	}
	folder := filepath.Join(a.reportsDir, user, endpoint, id)
	if err := os.RemoveAll(folder); err != nil {
		slog.Warn("could not delete the analysis report folder",
			"folder", folder, "user", user, "endpoint", endpoint, "report", id, "error", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not delete report")
	}

	return nil
}

// Delete all reports for a given endpoint
func (a *Analyzer) deleteEndpoint(ec *echo.Context) error {
	endpoint := ec.Param("endpoint")
	slog.Debug("deleting all analysis reports for an endpoint", "endpoint", endpoint)

	if err := validateSegment(endpoint); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid endpoint")
	}

	// Iterate over all user folders
	items, err := ioutil.ReadDir(a.reportsDir)
	if err != nil {
		// The read error used to be swallowed here, so the 500 the caller got
		// never said which directory could not be listed.
		slog.Error("could not list the analysis reports folder",
			"folder", a.reportsDir, "endpoint", endpoint, "error", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Error deleteing reports")
	}
	for _, item := range items {
		if item.IsDir() {
			// This is a user's folder - see if they have a folder for the endpoint
			folder := filepath.Join(a.reportsDir, item.Name(), endpoint)
			if folderExists(folder) {
				if err := os.RemoveAll(folder); err != nil {
					slog.Warn("could not delete the analysis report folder for an endpoint",
						"folder", folder, "user", item.Name(), "endpoint", endpoint, "error", err)
				}
			}
		}
	}

	return nil
}

func folderExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return info.IsDir()
}
