package main

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type popEyeSummary struct {
	Score int    `json:"score"`
	Grade string `json:"grade"`
}

type popEyeResult struct {
	PopEye popEyeSummary `json:"popeye"`
}

func runPopeye(job *AnalysisJob) error {

	slog.Debug("a popeye job was requested", "job", job.ID)

	job.Busy = true
	job.Type = "popeye"
	job.Format = "popeye"
	setJobNameAndPath(job, "Popeye")

	slog.Info("running a popeye job", "job", job.ID, "path", job.Path)

	// Namespace is validated at the HTTP boundary in run.go (FWT-923). The
	// guard here is defense-in-depth so a future caller that bypasses the
	// multipart handler still can't smuggle an argv option into popeye.
	if err := validateNamespace(job.Config.Namespace); err != nil {
		slog.Warn("popeye rejected an invalid namespace", "job", job.ID, "error", err)
		job.Status = "error"
		return err
	}

	args := []string{"--kubeconfig", job.KubeConfigPath, "-o", "json", "--insecure-skip-tls-verify"}
	if len(job.Config.Namespace) > 0 {
		args = append(args, "-n")
		args = append(args, job.Config.Namespace)
	} else {
		args = append(args, "-A")
	}

	go func() {
		cmd := exec.Command("popeye", args...)
		cmd.Dir = job.Folder

		start := time.Now()
		out, err := cmd.Output()
		end := time.Now()
		job.EndTime = end

		job.Busy = false

		// Remove any config files when done
		job.RemoveTempFiles()

		job.Duration = int(end.Sub(start).Seconds())

		// This used to log "Completed kube score job" - the wrong analyzer -
		// and it did so before err was checked, so a failed run still
		// reported completion.
		if err != nil {
			// There was an error
			// Remove the folder
			folder, ok := job.confinedFolder()
			if !ok {
				slog.Error("refusing to touch a job folder outside the reports directory",
					"job", job.ID, "folder", job.Folder)
				return
			}
			if removeErr := os.Remove(folder); removeErr != nil {
				slog.Warn("could not remove the folder of a failed popeye job",
					"job", job.ID, "folder", job.Folder, "error", removeErr)
			}
			job.Status = "error"
			slog.Error("popeye job failed",
				"job", job.ID, "path", job.Path, "duration", job.Duration, "error", err)
		} else {
			folder, ok := job.confinedFolder()
			if !ok {
				slog.Error("refusing to write a report outside the reports directory",
					"job", job.ID, "folder", job.Folder)
				return
			}
			reportFile := filepath.Join(folder, "report.json")
			if writeErr := os.WriteFile(reportFile, out, os.ModePerm); writeErr != nil {
				slog.Error("could not write the popeye report",
					"job", job.ID, "file", reportFile, "error", writeErr)
			}
			job.Status = "completed"
			slog.Info("completed popeye job",
				"job", job.ID, "path", job.Path, "duration", job.Duration)

			// Parse the report
			if summary, parseErr := parsePopeyeReport(reportFile); parseErr == nil {
				job.Result = serializePopeyeReport(summary)
			} else {
				// The parse failure used to be discarded, leaving job.Result
				// empty with no indication why.
				slog.Warn("could not parse the popeye report",
					"job", job.ID, "file", reportFile, "error", parseErr)
			}
		}
	}()

	return nil
}

func parsePopeyeReport(file string) (*popEyeSummary, error) {
	jsonFile, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer func() { _ = jsonFile.Close() }()

	data, err := io.ReadAll(jsonFile)
	if err != nil {
		return nil, err
	}

	result := popEyeResult{}
	if err = json.Unmarshal(data, &result); err != nil {
		return nil, errors.New("Failed to parse Popeye report")
	}

	return &result.PopEye, nil
}

func serializePopeyeReport(summary *popEyeSummary) string {
	jsonString, err := json.Marshal(summary)
	if err != nil {
		return ""
	}

	return string(jsonString)
}
