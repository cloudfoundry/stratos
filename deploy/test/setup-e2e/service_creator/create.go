package service_creator

import (
	"io/ioutil"
	"os"

	"code.cloudfoundry.org/cli/cf/commands/application"
	"code.cloudfoundry.org/cli/cf/flags"
	cfclient "github.com/cloudfoundry-community/go-cfclient"
)

type ServiceCreator struct {
	brokerUrl   string
	client      *cfclient.Client
	pushCommand *application.Push
	flagContext flags.FlagContext
}

func Create(cfClient *cfclient.Client) *ServiceCreator {

	pushCommand := &application.Push{}
	metaData := pushCommand.MetaData()
	flagContext := flags.NewFlagContext(metaData.Flags)
	return &ServiceCreator{
		brokerUrl:   "https://github.com/irfanhabib/worlds-simplest-service-broker",
		client:      cfClient,
		pushCommand: pushCommand,
		flagContext: flagContext,
	}
}

func (this *ServiceCreator) createBrokerApp() error {

	tempDir, err := ioutil.TempDir("", "cf-push-")
	if err != nil {

	}
	defer os.RemoveAll(tempDir)

}
