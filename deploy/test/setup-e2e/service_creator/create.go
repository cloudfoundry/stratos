package service_creator

import (
	"fmt"
	"io/ioutil"
	"os"

	"code.cloudfoundry.org/cli/cf/commands/application"
	"code.cloudfoundry.org/cli/cf/commandsloader"
	"code.cloudfoundry.org/cli/cf/flags"
	"github.com/cloudfoundry-community/go-cfclient"
	"github.com/cloudfoundry-incubator/stratos/plugins/cfapppush/pushapp"
)

type ServiceCreator struct {
	brokerUrl   string
	client      *cfclient.Client
	pushCommand *application.Push
	flagContext flags.FlagContext
}

func Create(cfClient *cfclient.Client,) *ServiceCreator {

	pushCommand := &application.Push{}
	metaData := pushCommand.MetaData()
	flagContext := flags.NewFlagContext(metaData.Flags)
	return &ServiceCreator{
		brokerUrl:   "https://github.com/irfanhabib/worlds-simplest-service-broker",
		client:      cfClient,
		pushCommand: pushCommand,
		flagContext: flagContext,
	}

	cfClient.GetInfo
}

func (this *ServiceCreator) createBrokerApp() error {

	tempDir, err := ioutil.TempDir("", "cf-push-")
	if err != nil {
		return fmt.Errorf("Failed to create tmp dir due to %+v", err)
	}
	defer os.RemoveAll(tempDir)

	// Clone broker

	vcsGit := cfapppush.GetVCS()

	err := vcsGit.Create(tempDir, this.brokerUrl, "master")
	if err != nil {
		return fmt.Errorf("Failed to clone due to %+v", err)
	}

	// Initialise push command
	commandsloader.Load()
	configRepo, err := this.getConfigData(echoContext, cnsiGUID, orgGuid, spaceGuid, spaceName, orgName, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to initialise config repo due to error %+v", err)
		return err
	}

	traceLogger := trace.NewLogger(os.Stdout, true)
	dialTimeout := os.Getenv("CF_DIAL_TIMEOUT")
	deps := initialiseDependency(socketWriter, traceLogger, dialTimeout, configRepo)
	defer deps.Config.Close()
	var repo = deps.RepoLocator.GetApplicationRepository()

}

fun (this *ServiceCreator) getConfigData(echoContext echo.Context, cnsiGuid string, orgGuid string, spaceGuid string, spaceName string, orgName string, clientWebSocket *websocket.Conn) (coreconfig.Repository, error) {
// TODO Pass appropriate variables
	var filePath = fmt.Sprintf("/tmp/%s", uuid.NewV1())
	repo := coreconfig.NewRepositoryFromFilepath(filePath, func(error) {})

	repo.SetAuthenticationEndpoint(authorizationEndpoint)
	repo.SetUAAOAuthClient(CFClient)
	repo.SetUAAOAuthClientSecret(CFClientSecret)
	repo.SetAPIEndpoint(apiEndpoint)
	repo.SetDopplerEndpoint(dopplerLoggingEndpoint)
	repo.SetSSLDisabled(skipSSLValidation)
	repo.SetAccessToken(authToken)
	repo.SetRefreshToken(refreshToken)
	repo.SetColorEnabled("true")
	repo.SetOrganizationFields(models.OrganizationFields{
		GUID: orgGuid,
		Name: orgName,
	})
	repo.SetSpaceFields(models.SpaceFields{
		GUID: spaceGuid,
		Name: spaceName,
	})

	return repo, nil
}
