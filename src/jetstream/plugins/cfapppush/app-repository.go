package cfapppush

import (
	"code.cloudfoundry.org/cli/cf/api/applications"
	"code.cloudfoundry.org/cli/cf/models"

	"github.com/gorilla/websocket"
)

// RepositoryIntercept allows us to intercept application creation within the push process
type RepositoryIntercept struct {
	target          applications.Repository
	msgSender       DeployAppMessageSender
	clientWebsocket *websocket.Conn
}

// NewRepositoryIntercept creates a new RepositoryIntercept based on the supplied parameters
func NewRepositoryIntercept(target applications.Repository, msgSender DeployAppMessageSender, clientWebsocket *websocket.Conn) (repo RepositoryIntercept) {
	repo.target = target
	repo.msgSender = msgSender
	repo.clientWebsocket = clientWebsocket
	return
}

func (repo RepositoryIntercept) sendAppData(app models.Application) {
	repo.msgSender.SendEvent(repo.clientWebsocket, APP_GUID_NOTIFY, app.GUID)
}

// Create proxies the Create method from models.Application, notifying the application
func (repo RepositoryIntercept) Create(params models.AppParams) (models.Application, error) {
	app, err := repo.target.Create(params)
	if err == nil {
		repo.sendAppData(app)
	}
	return app, err
}

// GetApp proxies the GetApp method from models.Application
func (repo RepositoryIntercept) GetApp(appGUID string) (app models.Application, apiErr error) {
	return repo.target.GetApp(appGUID)
}

// Read proxies the Read method from models.Application, notifying the application
func (repo RepositoryIntercept) Read(name string) (app models.Application, apiErr error) {
	app, err := repo.target.Read(name)
	if err == nil {
		repo.sendAppData(app)
	}
	return app, err
}

// ReadFromSpace proxies the ReadFromSpace method from models.Application
func (repo RepositoryIntercept) ReadFromSpace(name string, spaceGUID string) (app models.Application, apiErr error) {
	return repo.target.ReadFromSpace(name, spaceGUID)
}

// Update proxies the Update method from models.Application
func (repo RepositoryIntercept) Update(appGUID string, params models.AppParams) (updatedApp models.Application, apiErr error) {
	return repo.target.Update(appGUID, params)
}

// Delete proxies the Delete method from models.Application
func (repo RepositoryIntercept) Delete(appGUID string) (apiErr error) {
	return repo.target.Delete(appGUID)
}

// ReadEnv proxies the ReadEnv method from models.Application
func (repo RepositoryIntercept) ReadEnv(guid string) (*models.Environment, error) {
	return repo.target.ReadEnv(guid)
}

// CreateRestageRequest proxies the CreateRestageRequest method from models.Application
func (repo RepositoryIntercept) CreateRestageRequest(guid string) error {
	return repo.target.CreateRestageRequest(guid)
}
