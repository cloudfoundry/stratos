package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"

	"github.com/labstack/echo/v5"
)

const idHeaderName = "X-Stratos-Analaysis-ID"

func (a *Analyzer) run(ec *echo.Context) error {
	err := a.doRun(ec)
	if err != nil {
		slog.Error("the analysis run request failed", "analyzer", ec.Param("analyzer"), "error", err)
	}
	return err
}

func (a *Analyzer) doRun(ec *echo.Context) error {

	engine := ec.Param("analyzer")
	slog.Debug("running an analyzer", "analyzer", engine)

	if len(engine) == 0 {
		const msg = "no analyzer specified"
		slog.Warn(msg)
		return errors.New(msg)
	}

	// ID is username/endpoint/id
	id := ec.Request().Header.Get(idHeaderName)
	if len(id) == 0 {
		return errors.New("Mising ID header")
	}

	// The ID header is "user/endpoint/id" — a nested but local path. Reject
	// any value that would escape reportsDir (e.g. "../../etc"). This also
	// confines job.Folder, which the analyzers write reports into.
	folder, err := jobFolder(a.reportsDir, id)
	if err != nil {
		return errors.New("Invalid ID header")
	}
	if err := os.MkdirAll(folder, os.ModePerm); err != nil {
		const msg = "could not create the folder for the analysis report"
		slog.Error(msg, "folder", folder, "error", err)
		return errors.New(msg)
	}

	tempFiles := make([]string, 0)
	reader, err := ec.Request().MultipartReader()
	if err != nil {
		const msg = "could not parse the request payload"
		slog.Error(msg, "analyzer", engine, "error", err)
		return errors.New(msg)
	}

	job := AnalysisJob{}
	params := kubeAnalyzerConfig{}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			const msg = "unexpected error when retrieving a part of the message"
			slog.Error(msg, "analyzer", engine, "error", err)
			return fmt.Errorf("%s: %w", msg, err)
		}
		defer func() { _ = part.Close() }()
		fileBytes, err := io.ReadAll(part)
		if err != nil {
			const msg = "failed to read the content of a part of the message"
			slog.Error(msg, "analyzer", engine, "error", err)
			return fmt.Errorf("%s: %w", msg, err)
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
			// Validate attacker-controlled fields at the HTTP boundary before
			// any value flows into shell scripts or exec.Command (FWT-923).
			if err = validateNamespace(params.Namespace); err != nil {
				return fmt.Errorf("invalid job parameter: %v", err)
			}
			job.Config = &params
		default:
			// Reject multipart parts whose Content-ID header attempts path
			// traversal (e.g. "../../etc/cron.d/evil"). Default Go
			// filepath.Join does not reject `..` in the second argument —
			// validateContentID does, and returns a path confined to folder.
			fullpath, err := validateContentID(filename, folder)
			if err != nil {
				return fmt.Errorf("invalid multipart filename: %v", err)
			}
			if err = os.WriteFile(fullpath, fileBytes, os.ModePerm); err != nil {
				const msg = "could not write the file data"
				slog.Error(msg, "file", filename, "path", fullpath, "error", err)
				return fmt.Errorf("%s: %s", msg, filename)
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
	job.Base = a.reportsDir
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
		slog.Error("error running the analyzer", "analyzer", engine, "job", job.ID, "error", err)
	}

	return ec.JSON(http.StatusOK, job)
}
