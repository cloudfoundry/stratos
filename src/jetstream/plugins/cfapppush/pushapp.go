package cfapppush

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"strconv"
	"strings"

	"code.cloudfoundry.org/cli/actor/sharedaction"
	"code.cloudfoundry.org/cli/actor/v7action"
	"code.cloudfoundry.org/cli/actor/v7pushaction"
	"code.cloudfoundry.org/cli/api/cloudcontroller/ccversion"
	"code.cloudfoundry.org/cli/cf/commandregistry"
	"code.cloudfoundry.org/cli/command"
	"code.cloudfoundry.org/clock"

	"code.cloudfoundry.org/cli/util/configv3"
	"code.cloudfoundry.org/cli/util/manifestparser"
	"code.cloudfoundry.org/cli/util/progressbar"
	"code.cloudfoundry.org/cli/util/ui"
	"github.com/gorilla/websocket"

	"code.cloudfoundry.org/cli/cf/flags"

	"code.cloudfoundry.org/cli/command/flag"
	"code.cloudfoundry.org/cli/command/translatableerror"
	v7 "code.cloudfoundry.org/cli/command/v7"
	"code.cloudfoundry.org/cli/command/v7/shared"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// CFPushApp abstracts the push functionality form the CLI library
type CFPushApp struct {
	pushCommand *v7.PushCommand
	flagContext flags.FlagContext
	deps        commandregistry.Dependency
	config      *CFPushAppConfig
	portalProxy api.PortalProxy
}

// CFPushAppConfig is the configuration used
type CFPushAppConfig struct {
	AuthorizationEndpoint  string
	CFClient               string
	CFClientSecret         string
	APIEndpointURL         string
	DopplerLoggingEndpoint string
	SkipSSLValidation      bool
	CACert                 string
	AuthToken              string
	OrgGUID                string
	OrgName                string
	SpaceGUID              string
	SpaceName              string
	OutputWriter           io.Writer
	DialTimeout            string
	EndpointID             string
	UserID                 string
}

// CFPushAppOverrides represents the document that can be sent from the client with the app overrrides for the push
type CFPushAppOverrides struct {
	Name            string `json:"name"`
	Buildpack       string `json:"buildpack"`
	StartCmd        string `json:"startCmd"`
	HealthCheckType string `json:"healthCheckType"`
	Stack           string `json:"stack"`
	Time            *int   `json:"time"`
	Instances       *int   `json:"instances"`
	DiskQuota       string `json:"diskQuota"`
	MemQuota        string `json:"memQuota"`
	DoNotStart      bool   `json:"doNotStart"`
	NoRoute         bool   `json:"noRoute"`
	RandomRoute     bool   `json:"randomRoute"`
	Host            string `json:"host"`
	Domain          string `json:"domain"`
	Path            string `json:"path"`
	DockerImage     string `json:"dockerImage"`
	DockerUsername  string `json:"dockerUsername"`
}

// DeployAppMessageSender is the interface for sending a message over a web socket
type DeployAppMessageSender interface {
	SendEvent(clientWebSocket *websocket.Conn, event MessageType, data string)
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
	Init(appDir string, manifestPath string, overrides CFPushAppOverrides) error
	Run(DeployAppMessageSender, *websocket.Conn) error
}

// PushError is the return error type from pushing
type PushError struct {
	error
	Type ErrorType
	Err  error
}

func (p *PushError) Error() string {
	return fmt.Sprintf("Push error: %s", p.Err)
}

// Constructor returns a CFPush based on the supplied config
func Constructor(config *CFPushAppConfig, portalProxy api.PortalProxy) CFPush {
	pushCmd := &v7.PushCommand{}
	cfPush := &CFPushApp{
		pushCommand: pushCmd,
		config:      config,
		portalProxy: portalProxy,
	}
	cfPush.init(config)
	return cfPush
}

func (c *CFPushApp) init(config *CFPushAppConfig) error {
	return nil
}

// Init initializes the push operation with the specified application directory and manifest path
func (c *CFPushApp) Init(appDir string, manifestPath string, overrides CFPushAppOverrides) error {
	// App name
	if len(overrides.Name) > 0 {
		c.pushCommand.OptionalArgs = flag.OptionalAppName{
			AppName: overrides.Name,
		}
	}

	// Buildpack - Note we only allow one buildpack to be specified as an override at present
	if len(overrides.Buildpack) > 0 {
		c.pushCommand.Buildpacks = make([]string, 1)
		c.pushCommand.Buildpacks[0] = overrides.Buildpack
	}

	// Start Command
	if len(overrides.StartCmd) > 0 {
		c.pushCommand.StartCommand = flag.Command{}
		err := c.pushCommand.StartCommand.UnmarshalFlag(overrides.StartCmd)
		if err != nil {
			return err
		}
	}

	// HealthCheckType
	if len(overrides.HealthCheckType) > 0 {
		err := c.pushCommand.HealthCheckType.UnmarshalFlag(overrides.HealthCheckType)
		if err != nil {
			return err
		}
	}

	// App instances
	if overrides.Instances != nil {
		c.pushCommand.Instances = flag.Instances{}
		c.pushCommand.Instances.ParseIntValue(overrides.Instances)
	}

	// Disk Quota
	if len(overrides.DiskQuota) > 0 {
		c.pushCommand.Disk = overrides.DiskQuota
	}

	// Memory Quota
	if len(overrides.MemQuota) > 0 {
		c.pushCommand.Memory = overrides.MemQuota
	}

	// No Route
	c.pushCommand.NoRoute = overrides.NoRoute

	// No start
	c.pushCommand.NoStart = overrides.DoNotStart

	// Random route
	c.pushCommand.RandomRoute = overrides.RandomRoute

	// Route path
	if len(overrides.Path) > 0 {
		c.pushCommand.AppPath = flag.PathWithExistenceCheck(overrides.Path)
	}

	// Stack
	if len(overrides.Stack) > 0 {
		c.pushCommand.Stack = overrides.Stack
	}

	// Health check time
	if overrides.Time != nil {
		c.pushCommand.HealthCheckTimeout = flag.PositiveInteger{}
		err := c.pushCommand.HealthCheckTimeout.UnmarshalFlag(strconv.Itoa(int(*overrides.Time)))
		if err != nil {
			return err
		}
	}

	// Docker image
	if len(overrides.DockerImage) > 0 {
		c.pushCommand.DockerImage = flag.DockerImage{
			Path: overrides.DockerImage,
		}
	} else {
		// App path can't be set with Docker Image
		c.pushCommand.AppPath = flag.PathWithExistenceCheck(appDir)
	}

	// Docker username
	if len(overrides.DockerUsername) > 0 {
		c.pushCommand.DockerUsername = overrides.DockerUsername
	}

	// Manifest path
	c.pushCommand.PathToManifest = flag.ManifestPathWithExistenceCheck(manifestPath)
	c.pushCommand.ManifestLocator = manifestparser.NewLocator()
	c.pushCommand.ManifestParser = manifestparser.ManifestParser{}

	return nil
}

// setConfig sets the org and space information
func (c *CFPushApp) setConfig(config *configv3.Config) error {
	config.SetOrganizationInformation(c.config.OrgGUID, c.config.OrgName)
	config.SetSpaceInformation(c.config.SpaceGUID, c.config.SpaceName, false)
	c.pushCommand.VersionActor = c.pushCommand.Actor
	c.pushCommand.PushActor = v7pushaction.NewActor(c.pushCommand.Actor, sharedaction.NewActor(config))
	return nil
}

// Run performs the actual push
func (c *CFPushApp) Run(msgSender DeployAppMessageSender, clientWebsocket *websocket.Conn) error {
	// Get a CF Config
	config, err := configv3.LoadConfig()
	if err != nil {
		return err
	}

	// Fetch and set endpoint info
	err = c.setEndpointInfo(config)
	if err != nil {
		return err
	}

	commandUI, err := ui.NewUI(config)
	if err != nil {
		return err
	}

	commandUI.IsTTY = false
	commandUI.TerminalWidth = 40

	// Send logging to the front-end via the web-socket
	commandUI.Out = c.config.OutputWriter
	commandUI.Err = c.config.OutputWriter

	defer commandUI.FlushDeferred()

	err = c.setup(config, commandUI, msgSender, clientWebsocket)
	if err != nil {
		return handleError(err, *commandUI)
	}

	err = c.pushCommand.Setup(config, commandUI)
	if err != nil {
		return handleError(err, *commandUI)
	}

	// Update the config
	err = c.setConfig(config)
	if err != nil {
		return handleError(err, *commandUI)
	}

	// Set to a null progress bar
	c.pushCommand.ProgressBar = &cfPushProgressBar{}
	c.pushCommand.DiffDisplayer = shared.NewManifestDiffDisplayer(commandUI)

	// Perform the push
	args := make([]string, 0)
	err = c.pushCommand.Execute(args)
	if err != nil {
		return handleError(err, *commandUI)
	}

	return nil
}

func (c *CFPushApp) setup(config command.Config, ui command.UI, msgSender DeployAppMessageSender, clientWebsocket *websocket.Conn) error {
	cmd := c.pushCommand
	cmd.UI = ui
	cmd.Config = config
	sharedActor := sharedaction.NewActor(config)
	cmd.SharedActor = sharedActor

	ccClient, uaaClient, routingClient, err := shared.GetNewClientsAndConnectToCF(config, ui, ccversion.MinSupportedV2ClientVersion)
	if err != nil {
		return err
	}

	// Initialize connection wrapper that will refresh the auto token if needed
	pushConnectionWrapper := PushConnectionWrapper{
		portalProxy: c.portalProxy,
		config:      c.config,
		cmdConfig:   config,
	}

	ccClient.WrapConnection(pushConnectionWrapper)

	ccClientV3 := shared.NewWrappedCloudControllerClient(config, ui, pushConnectionWrapper)
	if err != nil {
		return err
	}

	ccClientV3.Requester = ccClient.Requester
	v7Actor := v7action.NewActor(ccClientV3, config, sharedActor, uaaClient, routingClient, clock.NewClock())

	cmd.Actor = v7Actor

	cmd.ProgressBar = progressbar.NewProgressBar()
	return nil
}

// Simplified version of the CLI source
func handleError(passedErr error, commandUI ui.UI) error {
	if passedErr == nil {
		return nil
	}

	translationFunc, _ := generateTranslationFunc([]byte("[]"))
	translatedErr := translatableerror.ConvertToTranslatableError(passedErr)

	var errMsg string
	if translatableError, ok := translatedErr.(translatableerror.TranslatableError); ok {
		errMsg = translatableError.Translate(translationFunc)

		// Remove the TIP that might be at the end
		parts := strings.Split(errMsg, "TIP:")
		errMsg = strings.TrimSpace(parts[0])
	} else {
		errMsg = translatedErr.Error()
	}

	return errors.New(errMsg)
}

// Borrowed from the CLI source - its not exported, so we include it here
func generateTranslationFunc(rawTranslation []byte) (ui.TranslateFunc, error) {
	var entries []ui.TranslationEntry
	err := json.Unmarshal(rawTranslation, &entries)
	if err != nil {
		return nil, err
	}

	translations := map[string]string{}
	for _, entry := range entries {
		translations[entry.ID] = entry.Translation
	}

	return func(translationID string, args ...interface{}) string {
		translated := translations[translationID]
		if translated == "" {
			translated = translationID
		}

		var keys interface{}
		if len(args) > 0 {
			keys = args[0]
		}

		var buffer bytes.Buffer
		formattedTemplate := template.Must(template.New("Display Text").Parse(translated))
		formattedTemplate.Execute(&buffer, keys)

		return buffer.String()
	}, nil
}
