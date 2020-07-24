package main

import (
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

// Ping endpoint
func (a *Analyzer) ping(ec echo.Context) error {
	return nil
}

// Get a given report
func (a *Analyzer) report(ec echo.Context) error {

	user := ec.Param("user")
	endpoint := ec.Param("endpoint")
	id := ec.Param("id")
	name := ec.Param("file")

	// Name must end in json - we only serve json files
	if !strings.HasSuffix(name, ".json") {
		return errors.New("Can't serve that file")
	}

	file := filepath.Join(a.reportsDir, user, endpoint, id, name)
	_, err := os.Stat(file)
	if os.IsNotExist(err) {
		return echo.NewHTTPError(404, "No such file")
	}

	return ec.File(file)
}

// Delete a given report
func (a *Analyzer) delete(ec echo.Context) error {
	log.Debug("delete report")

	user := ec.Param("user")
	endpoint := ec.Param("endpoint")
	id := ec.Param("id")
	folder := filepath.Join(a.reportsDir, user, endpoint, id)
	if err := os.RemoveAll(folder); err != nil {
		log.Warnf("Could not delete Analysis report folder: %s", folder)
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not delete report")
	}

	return nil
}

// Delete all reports for a given endpoint
func (a *Analyzer) deleteEndpoint(ec echo.Context) error {
	log.Debug("delete reports for endpoint")

	endpoint := ec.Param("endpoint")

	// Iterate over all user folders
	if items, err := ioutil.ReadDir(a.reportsDir); err == nil {
		for _, item := range items {
			if item.IsDir() {
				// This is a user's folder - see if they have a folder for the endpoint
				folder := filepath.Join(a.reportsDir, item.Name(), endpoint)
				if folderExists(folder) {
					if err := os.RemoveAll(folder); err != nil {
						log.Warnf("Could not delete Analysis report endpoint folder: %s", folder)
					}
				}
			}
		}
	} else {
		return echo.NewHTTPError(http.StatusInternalServerError, "Error deleteing reports")
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
