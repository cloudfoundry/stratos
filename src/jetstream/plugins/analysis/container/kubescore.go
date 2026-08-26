package main

import (
	"fmt"
	"io/ioutil"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func runKubeScore(job *AnalysisJob) error {

	slog.Debug("a kube-score job was requested", "job", job.ID)

	job.Busy = true
	job.Type = "kubescore"
	job.Format = "kubescore"
	setJobNameAndPath(job, "Kube-score")

	// Namespace is validated at the HTTP boundary in run.go (FWT-923). The
	// guard here is defense-in-depth so a future caller that bypasses the
	// multipart handler still can't splice shell syntax into the script.
	if err := validateNamespace(job.Config.Namespace); err != nil {
		slog.Warn("kube-score rejected an invalid namespace", "job", job.ID, "error", err)
		job.Status = "error"
		return err
	}

	scriptPath := filepath.Join(getScriptFolder(), "kubescore-runner.sh")
	args := []string{scriptPath, job.KubeConfigPath, job.Config.Namespace}

	slog.Info("running a kube-score job", "job", job.ID, "path", job.Path)

	go func() {
		// Use our custom script which is a wrapper around kubescore
		cmd := exec.Command("bash", args...)
		cmd.Dir = job.Folder
		cmd.Env = make([]string, 0)
		cmd.Env = append(cmd.Env, fmt.Sprintf("KUBECONFIG=%s", job.KubeConfigPath))

		start := time.Now()
		out, err := cmd.Output()
		end := time.Now()

		// Remove any config files when done
		job.RemoveTempFiles()

		job.Duration = int(end.Sub(start).Seconds())

		// The completion line used to be logged before err was checked, so a
		// failed run still reported "Completed".
		if err != nil {
			// There was an error
			// Remove the folder
			if removeErr := os.Remove(job.Folder); removeErr != nil {
				slog.Warn("could not remove the folder of a failed kube-score job",
					"job", job.ID, "folder", job.Folder, "error", removeErr)
			}
			job.Status = "error"
			slog.Error("kube-score job failed",
				"job", job.ID, "path", job.Path, "duration", job.Duration, "error", err)
		} else {
			reportFile := filepath.Join(job.Folder, "report.log")
			if writeErr := ioutil.WriteFile(reportFile, out, os.ModePerm); writeErr != nil {
				slog.Error("could not write the kube-score report",
					"job", job.ID, "file", reportFile, "error", writeErr)
			}
			job.Status = "completed"
			slog.Info("completed kube-score job",
				"job", job.ID, "path", job.Path, "duration", job.Duration)
		}
	}()

	return nil
}
