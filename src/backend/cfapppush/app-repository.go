package cfapppush

import (
	"code.cloudfoundry.org/cli/cf/api/applications"
	"code.cloudfoundry.org/cli/cf/models"

	log "github.com/Sirupsen/logrus"
)

type RepositoryIntercept struct {
	target applications.Repository
}

func NewRepositoryIntercept(target applications.Repository) (repo RepositoryIntercept) {
	log.Warn("NewRepositoryIntercept")
	repo.target = target
	return repo
}

func (repo RepositoryIntercept) Create(params models.AppParams) (models.Application, error) {
	log.Warn("********** INTERCEPTED CREATE")
	return repo.target.Create(params)
}

func (repo RepositoryIntercept) GetApp(appGUID string) (app models.Application, apiErr error) {
	log.Warn("********** INTERCEPTED GetApp")
	return repo.target.GetApp(appGUID)
}

func (repo RepositoryIntercept) Read(name string) (app models.Application, apiErr error) {
	log.Warnf("********** INTERCEPTED READ: %s", name)
	return repo.target.Read(name)
}

func (repo RepositoryIntercept) ReadFromSpace(name string, spaceGUID string) (app models.Application, apiErr error) {
	return repo.target.ReadFromSpace(name, spaceGUID)
}

func (repo RepositoryIntercept) Update(appGUID string, params models.AppParams) (updatedApp models.Application, apiErr error) {
	return repo.target.Update(appGUID, params)
}

func (repo RepositoryIntercept) Delete(appGUID string) (apiErr error) {
	return repo.target.Delete(appGUID)
}

func (repo RepositoryIntercept) ReadEnv(guid string) (*models.Environment, error) {
	return repo.target.ReadEnv(guid)
}

func (repo RepositoryIntercept) CreateRestageRequest(guid string) error {
	return repo.target.CreateRestageRequest(guid)
}
