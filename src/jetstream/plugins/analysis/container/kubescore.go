package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	log "github.com/sirupsen/logrus"
)

func runKubeScore(job *AnalysisJob) error {

	log.Debug("Running kube-score job")

	job.Busy = true
	job.Type = "kubescore"
	job.Format = "kubescore"
	setJobNameAndPath(job, "Kube-score")

	scriptPath := filepath.Join(getScriptFolder(), "kubescore-runner.sh")
	args := []string{scriptPath, job.KubeConfigPath, job.Config.Namespace}

	log.Infof("Running kube score job: %s", job.Path)

	go func() {
		// Use our custom script which is a wrapper around kubescore
		cmd := exec.Command("bash", args...)
		cmd.Dir = job.Folder
		cmd.Env = make([]string, 0)
		cmd.Env = append(cmd.Env, fmt.Sprintf("KUBECONFIG=%s", job.KubeConfigPath))

		start := time.Now()
		out, err := cmd.Output()
		end := time.Now()

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
			reportFile := filepath.Join(job.Folder, "report.log")
			ioutil.WriteFile(reportFile, out, os.ModePerm)
			job.Status = "completed"
		}
	}()

	return nil
}
