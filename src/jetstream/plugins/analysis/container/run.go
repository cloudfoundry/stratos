package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

const idHeaderName = "X-Stratos-Analaysis-ID"

func (a *Analyzer) run(ec echo.Context) error {
	err := a.doRun(ec)
	if err != nil {
		log.Error(err)
	}
	return err
}

func (a *Analyzer) doRun(ec echo.Context) error {

	log.Debug("Run analyzer!")

	engine := ec.Param("analyzer")
	if len(engine) == 0 {
		log.Warn("No analyzer")
		return errors.New("No analyzer specified")
	}

	// ID is username/endpoint/id
	id := ec.Request().Header.Get(idHeaderName)
	if len(id) == 0 {
		return errors.New("Mising ID header")
	}

	folder := filepath.Join(a.reportsDir, id)
	if os.MkdirAll(folder, os.ModePerm) != nil {
		return errors.New("Could not create folder for analysis report")
	}

	tempFiles := make([]string, 0)
	reader, err := ec.Request().MultipartReader()
	if err != nil {
		log.Error("Could not parse request")
		log.Error(err)
		return errors.New("Failed to parse request payload")
	}

	job := AnalysisJob{}
	params := kubeAnalyzerConfig{}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Error("Unexpected error when retrieving a part of the message")
			return errors.New("Unexpected error when retrieving a part of the message")
		}
		defer part.Close()
		fileBytes, err := ioutil.ReadAll(part)
		if err != nil {
			log.Error("Failed to read content of the part")
			return errors.New("Failed to read content of the part")
		}
		filename := part.Header.Get("Content-ID")

		// Decide what to do with the part
		switch filename {
		case "job":
			if err = json.Unmarshal(fileBytes, &job); err != nil {
				return fmt.Errorf("Can not parse Job: %v", err)
			}
		case "body":
			if err = json.Unmarshal(fileBytes, &params); err != nil {
				return fmt.Errorf("Can not parse parameters: %v", err)
			}
			job.Config = &params
		default:
			fullpath := filepath.Join(folder, filename)
			if err = ioutil.WriteFile(fullpath, fileBytes, os.ModePerm); err != nil {
				log.Error("Could not write data for: %s", filename)
				return fmt.Errorf("Could not write file data for: %s", filename)
			}
			if filename == "kubeconfig" {
				job.KubeConfigPath = fullpath
			}
			tempFiles = append(tempFiles, fullpath)
		}
	}

	if len(job.ID) == 0 {
		return errors.New("Invalid Job metadata supplied")
	}

	job.Folder = folder
	job.TempFiles = tempFiles

	// Store the job so we track which jobs are running
	a.jobs[job.ID] = &job

	job.Status = "running"

	switch engine {
	case "popeye":
		err = runPopeye(&job)
	case "kube-score":
		err = runKubeScore(&job)
	// case "sonobuoy":
	// 	runSonobuoy(dbStore, file, folder, report, requestBody)
	default:
		job.Status = "error"
		return fmt.Errorf("Unkown analyzer: %s", engine)
	}

	if err != nil {
		job.Status = "error"
		log.Error("Error running analyzer: %s", err)
	}

	return ec.JSON(http.StatusOK, job)
}
