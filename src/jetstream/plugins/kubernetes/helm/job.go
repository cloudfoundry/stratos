package helm

import (
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
)

// KubeResourceJob = Resource(s) that we need to go and fetch
type KubeResourceJob struct {
	ID         string
	Kind       string
	APIVersion string
	Name       string
	Namespace  string
	Endpoint   string
	User       string
	URL        string
	Parent     string
}

// KubeResourceJobResult is the result from a job
type KubeResourceJobResult struct {
	KubeResourceJob
	StatusCode int
	Data       []byte
}

// KubeAPIJob represents a set of jobs to run against the Kube API
type KubeAPIJob struct {
	Jetstream api.PortalProxy
	Jobs      []KubeResourceJob
}

// NewKubeAPIJob returns a helper that can execute all jobs and return results
func NewKubeAPIJob(jetstream api.PortalProxy, jobs []KubeResourceJob) *KubeAPIJob {
	r := &KubeAPIJob{
		Jetstream: jetstream,
		Jobs:      jobs,
	}
	return r
}

// Run will run all of the jobs
func (j *KubeAPIJob) Run() []KubeResourceJobResult {
	count := len(j.Jobs)
	var res []KubeResourceJobResult
	kubeJobs := make(chan KubeResourceJob, count)
	kubeResults := make(chan KubeResourceJobResult, count)

	for w := 1; w <= 4; w++ {
		go j.restWorker(j.Jetstream, w, kubeJobs, kubeResults)
	}

	for _, j := range j.Jobs {
		kubeJobs <- j
	}

	close(kubeJobs)

	var v KubeResourceJobResult
	for a := 1; a <= count; a++ {
		v = <-kubeResults
		res = append(res, v)
	}

	return res
}

func (j *KubeAPIJob) restWorker(jetstream api.PortalProxy, id int, jobs <-chan KubeResourceJob, results chan<- KubeResourceJobResult) {
	for job := range jobs {
		response, err := j.Jetstream.DoProxySingleRequest(job.Endpoint, job.User, "GET", job.URL, nil, nil)
		log.Debugf("Rest Worker finished for: %s - %d", job.URL, response.StatusCode)
		res := KubeResourceJobResult{
			KubeResourceJob: job,
			StatusCode:      response.StatusCode,
			Data:            response.Response,
		}

		if err != nil {
			log.Errorf("KubeAPIJob: Failed to run job: %+v", err)
		}
		results <- res
	}
}
