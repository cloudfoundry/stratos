package monocular

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/helm/monocular/chartrepo"
	log "github.com/sirupsen/logrus"
)

type SyncJob struct {
	Action   interfaces.EndpointAction
	Endpoint *interfaces.CNSIRecord
}

// Sync Chanel
var syncChan = make(chan SyncJob, 100)

func (m *Monocular) InitSync() {
	go m.processSyncRequests()
}

func (m *Monocular) Sync(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {

	job := SyncJob{
		Action:   action,
		Endpoint: endpoint,
	}

	log.Warn("Scheduling Sync job")
	syncChan <- job
}

func (m *Monocular) processSyncRequests() {
	log.Warn("Repository Sync init")
	for job := range syncChan {
		log.Warn("Processing Job")
		log.Warn(job.Endpoint.Name)

		// Could be delete or sync
		if job.Action == 0 {
			log.Warn("Syncing new repository")
			err := chartrepo.SyncRepo(m.Store, job.Endpoint.Name, job.Endpoint.APIEndpoint.String(), "")
			if err != nil {
				log.Warn("Failed to sync repository: %v+", err)
			}
		} else if job.Action == 1 {
			m.Store.DeleteRepo(job.Endpoint.Name)
		}
	}

	log.Warn("processSyncRequests finished")
}
