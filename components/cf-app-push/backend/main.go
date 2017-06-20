package main

import (
	"os"
	"io/ioutil"
	"gopkg.in/src-d/go-git.v4"
	log "github.com/Sirupsen/logrus"
	"code.cloudfoundry.org/cli/cf/commands/application"
	"code.cloudfoundry.org/cli/cf/flags"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	"code.cloudfoundry.org/cli/cf/commandregistry"
	"code.cloudfoundry.org/cli/cf/commandsloader"
	"code.cloudfoundry.org/cli/cf/trace"
	"github.com/labstack/echo"
	"errors"
)

type CFAppPush struct {
	portalProxy interfaces.PortalProxy
	pushCommand *application.Push
	flagContext flags.FlagContext
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFAppPush{portalProxy: portalProxy}, nil
}

func (cfAppPush *CFAppPush) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (cfAppPush *CFAppPush) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (cfAppPush *CFAppPush) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return cfAppPush, nil

}

func (cfAppPush *CFAppPush) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (cfAppPush *CFAppPush) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Deploy Endpoint
	echoGroup.POST("/:cnsiGuid/deploy", cfAppPush.deploy)
}



func (cfAppPush *CFAppPush) Init() error {
	cfAppPush.pushCommand = &application.Push{}
	metaData := cfAppPush.pushCommand.MetaData()
	cfAppPush.flagContext = flags.NewFlagContext(metaData.Flags)
	return nil
}

func (cfAppPush *CFAppPush) Push(path string) error {
	log.Printf("Pushing app")

	commandsloader.Load()
	deps := commandregistry.NewDependency(os.Stdout, trace.NewLogger(os.Stdout, true), os.Getenv("CF_DIAL_TIMEOUT"))

	//deps.UI = nil
	defer deps.Config.Close()
	cfAppPush.pushCommand.SetDependency(deps, false)

	// Set path

	{
		err := cfAppPush.flagContext.Parse("-p", path, "-f", path + "/manifest.yml")
		if err != nil {
			log.Printf("Failed to parse due to: %+v", err)
		}
	}
	err := cfAppPush.pushCommand.Execute(cfAppPush.flagContext)
	if err != nil {
		log.Printf("Failed to execute due to: %+v", err)
	}
	return nil
}

func (cfAppPush *CFAppPush) cloneRepo(url string) (string, error) {

	dir, err := ioutil.TempDir("", "git-clone-")
	if err != nil {
		return "", err
	}
	_, err = git.PlainClone(dir, false, &git.CloneOptions{
		URL:               url,
		RecurseSubmodules: git.DefaultSubmoduleRecursionDepth,
	});
	return dir, err
}
//
//func main() {
//
//  cfAppPush := Init()
//  cfAppPush.Init()
//  //cfAppPush.Execute("/workspace/gopath/src/github.com/irfanhabib/go-env/")
//
//  path := "https://github.com/irfanhabib/go-env"
//  commandsloader.Load()
//
//  // Determine if path is a URL
//  _, err := url.ParseRequestURI(path)
//  if err == nil {
//    path, _ = cfAppPush.cloneRepo(path)
//  }
//  cfAppPush.Push(path)
//}
