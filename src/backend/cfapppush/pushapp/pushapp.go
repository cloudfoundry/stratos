package pushapp

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"code.cloudfoundry.org/cli/cf/api/applications"

	"code.cloudfoundry.org/cli/cf/actors"
	"code.cloudfoundry.org/cli/cf/actors/brokerbuilder"
	"code.cloudfoundry.org/cli/cf/actors/planbuilder"
	"code.cloudfoundry.org/cli/cf/actors/pluginrepo"
	"code.cloudfoundry.org/cli/cf/actors/servicebuilder"
	"code.cloudfoundry.org/cli/cf/api"
	"code.cloudfoundry.org/cli/cf/appfiles"
	"code.cloudfoundry.org/cli/cf/commandregistry"
	"code.cloudfoundry.org/cli/cf/configuration"
	"code.cloudfoundry.org/cli/cf/configuration/confighelpers"
	"code.cloudfoundry.org/cli/cf/configuration/coreconfig"
	"code.cloudfoundry.org/cli/cf/configuration/pluginconfig"
	"code.cloudfoundry.org/cli/cf/manifest"
	"code.cloudfoundry.org/cli/cf/models"
	"code.cloudfoundry.org/cli/cf/net"
	"code.cloudfoundry.org/cli/cf/terminal"
	"code.cloudfoundry.org/cli/cf/trace"
	"code.cloudfoundry.org/cli/util"
	"code.cloudfoundry.org/cli/util/randomword"
	uuid "github.com/satori/go.uuid"

	"code.cloudfoundry.org/cli/cf/commands/application"
	"code.cloudfoundry.org/cli/cf/flags"
)

type CFPushApp struct {
	pushCommand *application.Push
	flagContext flags.FlagContext
	deps        commandregistry.Dependency
}

type CFPushAppConfig struct {
	AuthorizationEndpoint  string
	CFClient               string
	CFClientSecret         string
	APIEndpointURL         string
	DopplerLoggingEndpoint string
	SkipSSLValidation      bool
	AuthToken              string
	RefreshToken           string
	OrgGUID                string
	OrgName                string
	SpaceGUID              string
	SpaceName              string
	OutputWriter           io.Writer
	DialTimeout            string
	DisableTraceLogging    bool
}

// ErrorType default error returned
type ErrorType int

const (
	// GeneralFailure thrown when initialisation fails
	GeneralFailure ErrorType = iota + 4000
	// FailedToPush thrown when push fails
	FailedToPush
)

// CFPush Interface
type CFPush interface {
	Init(appName string, appDir string, manifestPath string, args []PushArg) error
	Push() error
	GetDeps() commandregistry.Dependency
	PatchApplicationRepository(repo applications.Repository)
}
type PushError struct {
	error
	Type ErrorType
	Err  error
}

func (p *PushError) Error() string {
	return fmt.Sprintf("Failed due to: %s", p.Err)
}

func Constructor(config *CFPushAppConfig) CFPush {

	pushCmd := &application.Push{}
	metaData := pushCmd.MetaData()
	flagContext := flags.NewFlagContext(metaData.Flags)

	cfPush := &CFPushApp{
		pushCommand: pushCmd,
		flagContext: flagContext,
	}
	cfPush.init(config)
	return cfPush

}

func (c *CFPushApp) init(config *CFPushAppConfig) error {
	uuid := uuid.NewV4()
	var filePath = fmt.Sprintf("/tmp/%s", uuid)
	repo := coreconfig.NewRepositoryFromFilepath(filePath, func(error) {})
	repo.SetAuthenticationEndpoint(config.AuthorizationEndpoint)
	repo.SetUAAOAuthClient(config.CFClient)
	repo.SetUAAOAuthClientSecret(config.CFClientSecret)
	repo.SetAPIEndpoint(config.APIEndpointURL)
	repo.SetDopplerEndpoint(config.DopplerLoggingEndpoint)
	repo.SetSSLDisabled(config.SkipSSLValidation)
	repo.SetAccessToken(config.AuthToken)
	repo.SetRefreshToken(config.RefreshToken)
	repo.SetColorEnabled("true")
	repo.SetOrganizationFields(models.OrganizationFields{
		GUID: config.OrgGUID,
		Name: config.OrgName,
	})
	repo.SetSpaceFields(models.SpaceFields{
		GUID: config.SpaceGUID,
		Name: config.SpaceName,
	})

	var traceLogger trace.Printer
	if config.DisableTraceLogging {
		traceLogger = trace.NewLogger(ioutil.Discard, true)
	} else {
		traceLogger = trace.NewLogger(os.Stdout, true)
	}
	dialTimeout := config.DialTimeout
	c.deps = initialiseDependency(config.OutputWriter, traceLogger, dialTimeout, repo)
	return nil
}

func initialiseDependency(writer io.Writer, logger trace.Printer, envDialTimeout string, config coreconfig.Repository) commandregistry.Dependency {

	deps := commandregistry.Dependency{}
	deps.TeePrinter = terminal.NewTeePrinter(writer)
	deps.UI = terminal.NewUI(os.Stdin, writer, deps.TeePrinter, logger)

	errorHandler := func(err error) {
		if err != nil {
			deps.UI.Failed(fmt.Sprintf("Config error: %s", err))
		}
	}

	deps.Config = config

	deps.ManifestRepo = manifest.NewDiskRepository()
	deps.AppManifest = manifest.NewGenerator()

	pluginPath := filepath.Join(confighelpers.PluginRepoDir(), ".cf", "plugins")
	deps.PluginConfig = pluginconfig.NewPluginConfig(
		errorHandler,
		configuration.NewDiskPersistor(filepath.Join(pluginPath, "config.json")),
		pluginPath,
	)

	terminal.UserAskedForColors = deps.Config.ColorEnabled()
	terminal.InitColorSupport()

	deps.Gateways = map[string]net.Gateway{
		"cloud-controller": net.NewCloudControllerGateway(deps.Config, time.Now, deps.UI, logger, envDialTimeout),
		"uaa":              net.NewUAAGateway(deps.Config, deps.UI, logger, envDialTimeout),
		"routing-api":      net.NewRoutingAPIGateway(deps.Config, time.Now, deps.UI, logger, envDialTimeout),
	}
	deps.RepoLocator = api.NewRepositoryLocator(deps.Config, deps.Gateways, logger, envDialTimeout)

	deps.PluginModels = &commandregistry.PluginModels{Application: nil}

	deps.PlanBuilder = planbuilder.NewBuilder(
		deps.RepoLocator.GetServicePlanRepository(),
		deps.RepoLocator.GetServicePlanVisibilityRepository(),
		deps.RepoLocator.GetOrganizationRepository(),
	)

	deps.ServiceBuilder = servicebuilder.NewBuilder(
		deps.RepoLocator.GetServiceRepository(),
		deps.PlanBuilder,
	)

	deps.BrokerBuilder = brokerbuilder.NewBuilder(
		deps.RepoLocator.GetServiceBrokerRepository(),
		deps.ServiceBuilder,
	)

	deps.PluginRepo = pluginrepo.NewPluginRepo()

	deps.ServiceHandler = actors.NewServiceHandler(
		deps.RepoLocator.GetOrganizationRepository(),
		deps.BrokerBuilder,
		deps.ServiceBuilder,
	)

	deps.ServicePlanHandler = actors.NewServicePlanHandler(
		deps.RepoLocator.GetServicePlanRepository(),
		deps.RepoLocator.GetServicePlanVisibilityRepository(),
		deps.RepoLocator.GetOrganizationRepository(),
		deps.PlanBuilder,
		deps.ServiceBuilder,
	)

	deps.WordGenerator = new(randomword.Generator)

	deps.AppZipper = appfiles.ApplicationZipper{}
	deps.AppFiles = appfiles.ApplicationFiles{}

	deps.RouteActor = actors.NewRouteActor(deps.UI, deps.RepoLocator.GetRouteRepository(), deps.RepoLocator.GetDomainRepository())
	deps.PushActor = actors.NewPushActor(deps.RepoLocator.GetApplicationBitsRepository(), deps.AppZipper, deps.AppFiles, deps.RouteActor)

	deps.ChecksumUtil = util.NewSha1Checksum("")

	deps.Logger = logger

	return deps
}

type PushArg struct {
	Flag  string
	Value string
	NoArg bool
}

func (c *CFPushApp) Init(appName string, appDir string, manifestPath string, args []PushArg) error {

	var defaultArgs []string
	if appName != "" {
		defaultArgs = []string{appName, "-p", appDir}
	} else {
		defaultArgs = []string{"-p", appDir}
	}

	if manifestPath != "" {
		defaultArgs = append(defaultArgs, "f")
		defaultArgs = append(defaultArgs, manifestPath)
	}

	if args != nil {
		for _, arg := range args {
			defaultArgs = append(defaultArgs, arg.Flag)
			if !arg.NoArg {
				defaultArgs = append(defaultArgs, arg.Value)
			}
		}
	}
	err := c.flagContext.Parse(defaultArgs...)
	if err != nil {
		return &PushError{Err: err, Type: GeneralFailure}
	}
	return nil
}

// To install watcher
func (c *CFPushApp) GetDeps() commandregistry.Dependency {
	return c.deps
}

func (c *CFPushApp) PatchApplicationRepository(appRepo applications.Repository) {
	c.deps.RepoLocator = c.deps.RepoLocator.SetApplicationRepository(appRepo)
}

func (c *CFPushApp) Push() error {

	c.pushCommand.SetDependency(c.deps, false)
	defer c.deps.Config.Close()

	err := c.pushCommand.Execute(c.flagContext)
	if err != nil {
		return &PushError{Err: err, Type: FailedToPush}
	}
	return nil
}
