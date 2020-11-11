package main

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	log "github.com/sirupsen/logrus"
)

type popEyeSummary struct {
	Score int    `json:"score"`
	Grade string `json:"grade"`
}

type popEyeResult struct {
	PopEye popEyeSummary `json:"popeye"`
}

func runPopeye(job *AnalysisJob) error {

	log.Debug("Running popeye job")

	job.Busy = true
	job.Type = "popeye"
	job.Format = "popeye"
	setJobNameAndPath(job, "Popeye")

	log.Infof("Running popeye job: %s", job.Path)

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

		log.Infof("Completed kube score job: %s", job.Path)

		// Remove any config files when done
		job.RemoveTempFiles()

		job.Duration = int(end.Sub(start).Seconds())

		if err != nil {
			// There was an error
			// Remove the folder
			os.Remove(job.Folder)
			job.Status = "error"
		} else {
			reportFile := filepath.Join(job.Folder, "report.json")
			ioutil.WriteFile(reportFile, out, os.ModePerm)
			job.Status = "completed"

			// Parse the report
			if summary, err := parsePopeyeReport(reportFile); err == nil {
				job.Result = serializePopeyeReport(summary)
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
	defer jsonFile.Close()

	data, err := ioutil.ReadAll(jsonFile)
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
