package main

import (
	"fmt"
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

		// Without this the job stays Busy forever, so the cleanup pass in
		// status.go never increments its counter and never evicts it from
		// the job map. runPopeye has always done this.
		job.Busy = false

		// Remove any config files when done
		job.RemoveTempFiles()

		job.Duration = int(end.Sub(start).Seconds())

		// The completion line used to be logged before err was checked, so a
		// failed run still reported "Completed".
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
				slog.Warn("could not remove the folder of a failed kube-score job",
					"job", job.ID, "folder", job.Folder, "error", removeErr)
			}
			job.Status = "error"
			slog.Error("kube-score job failed",
				"job", job.ID, "path", job.Path, "duration", job.Duration, "error", err)
		} else {
			folder, ok := job.confinedFolder()
			if !ok {
				slog.Error("refusing to write a report outside the reports directory",
					"job", job.ID, "folder", job.Folder)
				return
			}
			reportFile := filepath.Join(folder, "report.log")
			if writeErr := os.WriteFile(reportFile, out, os.ModePerm); writeErr != nil {
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
