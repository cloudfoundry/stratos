package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"code.cloudfoundry.org/cli/cf/actors"
	"code.cloudfoundry.org/cli/cf/actors/brokerbuilder"
	"code.cloudfoundry.org/cli/cf/actors/planbuilder"
	"code.cloudfoundry.org/cli/cf/actors/pluginrepo"
	"code.cloudfoundry.org/cli/cf/actors/servicebuilder"
	"code.cloudfoundry.org/cli/cf/api"
	"code.cloudfoundry.org/cli/cf/appfiles"
	"code.cloudfoundry.org/cli/cf/commandregistry"
	"code.cloudfoundry.org/cli/cf/commands/application"
	"code.cloudfoundry.org/cli/cf/commandsloader"
	"code.cloudfoundry.org/cli/cf/configuration"
	"code.cloudfoundry.org/cli/cf/configuration/confighelpers"
	"code.cloudfoundry.org/cli/cf/configuration/coreconfig"
	"code.cloudfoundry.org/cli/cf/configuration/pluginconfig"
	"code.cloudfoundry.org/cli/cf/flags"
	"code.cloudfoundry.org/cli/cf/manifest"
	"code.cloudfoundry.org/cli/cf/models"
	"code.cloudfoundry.org/cli/cf/net"
	"code.cloudfoundry.org/cli/cf/terminal"
	"code.cloudfoundry.org/cli/cf/trace"
	"code.cloudfoundry.org/cli/util"
	"code.cloudfoundry.org/cli/util/words/generator"
	log "github.com/Sirupsen/logrus"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
	yaml "gopkg.in/yaml.v2"

	archiver "github.com/mholt/archiver"
)

type MessageType int

// Success
const (
	DATA MessageType = iota + 20000
	MANIFEST
	CLOSE_SUCCESS
)

// Close - error cases
const (
	CLOSE_PUSH_ERROR MessageType = iota + 40000
	CLOSE_NO_MANIFEST
	CLOSE_INVALID_MANIFEST
	CLOSE_FAILED_CLONE
	CLOSE_FAILED_NO_BRANCH
	CLOSE_FAILURE
	CLOSE_NO_SESSION
	CLOSE_NO_CNSI
	CLOSE_NO_CNSI_USERTOKEN
)

// Events
const (
	EVENT_CLONED MessageType = iota + 10000
	EVENT_FETCHED_MANIFEST
	EVENT_PUSH_STARTED
	EVENT_PUSH_COMPLETED
)

// Source exchange messages
const (
	SOURCE_REQUIRED MessageType = iota + 30000
	SOURCE_GITHUB
	SOURCE_FOLDER
	SOURCE_FILE
	SOURCE_FILE_DATA
	SOURCE_FILE_ACK
	SOURCE_GITURL
)

const (

	// Time allowed to read the next pong message from the peer
	pongWait = 30 * time.Second

	// Send ping messages to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Time allowed to write a ping message
	pingWriteTimeout = 10 * time.Second

	stratosProjectKey = "STRATOS_PROJECT"
)

type ManifestResponse struct {
	Manifest string
}

type SocketMessage struct {
	Message   string      `json:"message"`
	Timestamp int64       `json:"timestamp"`
	Type      MessageType `json:"type"`
}

type SocketWriter struct {
	clientWebSocket *websocket.Conn
}

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type StratosProject struct {
	Url        string `json:"url"`
	CommitHash string `json:"commit"`
	Branch     string `json:"branch"`
	Timestamp  int64  `json:"timestamp"`
}

// Structure used to provide metadata about the GitHub source
type GitHubSourceInfo struct {
	Project string `json:"project"`
	Branch  string `json:"branch"`
}

// Structure used to provide metadata about the Git Url source
type GitUrlSourceInfo struct {
	Url        string `json:"url"`
	Branch     string `json:"branch"`
}

type FolderSourceInfo struct {
	Files   int      `json:"files"`
	Folders []string `json:"folders"`
}

func (cfAppPush *CFAppPush) deploy(echoContext echo.Context) error {

	cfAppPush.pushCommand = &application.Push{}
	metaData := cfAppPush.pushCommand.MetaData()
	cfAppPush.flagContext = flags.NewFlagContext(metaData.Flags)

	cnsiGUID := echoContext.Param("cnsiGuid")
	orgGuid := echoContext.Param("orgGuid")
	spaceGuid := echoContext.Param("spaceGuid")
	spaceName := echoContext.QueryParam("space")
	orgName := echoContext.QueryParam("org")

	clientWebSocket, pingTicker, err := upgradeToWebSocket(echoContext)
	if err != nil {
		log.Errorf("Upgrade to websocket failed due to: %+v", err)
		return err
	}
	defer clientWebSocket.Close()
	defer pingTicker.Stop()

	// We use a simple protocol to get the source to use for cf push

	// Send a message to the client to say that we are awaiting source details
	sendEvent(clientWebSocket, SOURCE_REQUIRED)

	// Wait for a message from the client
	log.Info("Waiting for source information from client")

	msg := SocketMessage{}
	if err := clientWebSocket.ReadJSON(&msg); err != nil {
		log.Errorf("Error reading JSON: %v+", err)
		return err
	}

	log.Infof("%v+", msg)

	// Temporary folder for the application source
	tempDir, err := ioutil.TempDir("", "cf-push-")
	defer os.RemoveAll(tempDir)

	var sourceEnvVarMetadata, appDir string

	// Get the source, depending on the source type
	switch msg.Type {
	case SOURCE_GITHUB:
		sourceEnvVarMetadata, appDir, err = getGitHubSource(clientWebSocket, tempDir, msg)
	case SOURCE_FOLDER:
		sourceEnvVarMetadata, appDir, err = getFolderSource(clientWebSocket, tempDir, msg)
	case SOURCE_GITURL:
		sourceEnvVarMetadata, appDir, err = getGitUrlSource(clientWebSocket, tempDir, msg)
	default:
		err = errors.New("Unsupported source type; don't know how to get the source for the application")
	}

	if err != nil {
		log.Errorf("Failed to fetch source: %v+", err)
		return err
	}

	// Source fetched - read manifest
	manifest, err := fetchManifest(appDir, sourceEnvVarMetadata, clientWebSocket)
	if err != nil {
		return err
	}

	sendEvent(clientWebSocket, EVENT_FETCHED_MANIFEST)

	err = sendManifest(manifest, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to read or send manifest due to %s", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	// Initialise push command
	commandsloader.Load()

	socketWriter := &SocketWriter{
		clientWebSocket: clientWebSocket,
	}

	configRepo, err := cfAppPush.getConfigData(echoContext, cnsiGUID, orgGuid, spaceGuid, spaceName, orgName, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to initialise config repo due to error %+v", err)
		return err
	}

	traceLogger := trace.NewLogger(os.Stdout, true)
	dialTimeout := os.Getenv("CF_DIAL_TIMEOUT")
	deps := initialiseDependency(socketWriter, traceLogger, dialTimeout, configRepo)
	defer deps.Config.Close()

	cfAppPush.pushCommand.SetDependency(deps, false)

	err = cfAppPush.flagContext.Parse("-p", appDir, "-f", appDir+"/manifest.yml")
	if err != nil {
		log.Warnf("Failed to parse due to: %+v", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	sendEvent(clientWebSocket, EVENT_PUSH_STARTED)

	err = cfAppPush.pushCommand.Execute(cfAppPush.flagContext)
	if err != nil {
		log.Warnf("Failed to execute due to: %+v", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_PUSH_ERROR)
		return err
	}
	sendEvent(clientWebSocket, EVENT_PUSH_COMPLETED)

	sendEvent(clientWebSocket, CLOSE_SUCCESS)
	return nil
}

func getFolderSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (string, string, error) {
	// The msg data is JSON for the Folder info
	info := FolderSourceInfo{}
	if err := json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return "", tempDir, err
	}

	// Create all of the folders
	for _, folder := range info.Folders {
		path := filepath.Join(tempDir, folder)
		err := os.Mkdir(path, 0700)
		if err != nil {
			return "", tempDir, errors.New("Failed to create folder")
		}
	}

	var transfers = info.Files
	var lastFilePath string
	for transfers > 0 {
		log.Debugf("Waiting for a file: %d remaining", transfers)

		// Send an ACK to ask the client to start sending us files
		sendEvent(clientWebSocket, SOURCE_FILE_ACK)

		// We should get a SOURCE_FILE message next
		msg := SocketMessage{}
		if err := clientWebSocket.ReadJSON(&msg); err != nil {
			log.Errorf("Error reading JSON: %v+", err)
			return "", tempDir, err
		}

		// Expecting a file
		if msg.Type != SOURCE_FILE {
			return "", tempDir, errors.New("Unexpected web socket message type")
		}

		log.Debugf("Transferring file: %s", msg.Message)

		// Now expecting a binary message
		messageType, p, err := clientWebSocket.ReadMessage()

		if err != nil {
			return "", tempDir, err
		}

		if messageType != websocket.BinaryMessage {
			return "", tempDir, errors.New("Expecting binary file data")
		}

		// Write the file
		path := filepath.Join(tempDir, msg.Message)
		err = ioutil.WriteFile(path, p, 0644)
		if err != nil {
			return "", tempDir, err
		}

		lastFilePath = path
		transfers--
	}

	// Check to see if we received only 1 file and check if that was an archive file
	if info.Files == 1 {
		log.Debugf("Checking for archive file - %s", lastFilePath)

		archiver := getArchiverFor(lastFilePath)

		if archiver != nil {
			log.Debug("Unpacking archive ......")
			unpackPath := filepath.Join(tempDir, "application")
			err := os.Mkdir(unpackPath, 0700)

			err = archiver.Open(lastFilePath, unpackPath)
			if err != nil {
				return "", tempDir, err
			}

			// Just check to see if we actually unpacked into a root folder
			contents, err := ioutil.ReadDir(unpackPath)
			if err != nil {
				return "", tempDir, err
			}

			if len(contents) == 1 && contents[0].IsDir() {
				unpackPath = filepath.Join(unpackPath, contents[0].Name())
			}

			// Archive done
			return "", unpackPath, nil
		}
	}

	// All done!
	return "", tempDir, nil
}

// Check the suffix of the file name and return an archiver that can handle that file type
// Return nil if not a supported archive format
func getArchiverFor(filePath string) archiver.Archiver {
	if strings.HasSuffix(filePath, ".tar.gz") || strings.HasSuffix(filePath, ".tgz") {
		return archiver.TarGz
	} else if strings.HasSuffix(filePath, ".tar") {
		return archiver.Tar
	} else if strings.HasSuffix(filePath, ".zip") {
		return archiver.Zip
	}

	return nil
}

func getGitHubSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (string, string, error) {

	// The msg data is JSON for the GitHub info
	info := GitHubSourceInfo{}
	if err := json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return "", tempDir, err
	}

	projectUrl := fmt.Sprintf("https://github.com/%s", info.Project)
	log.Infof("GitHub Source: %s, branch %s, url: %s", info.Project, info.Branch, projectUrl)

	commitHash, err := cloneRepository(projectUrl, info.Branch, clientWebSocket, tempDir)
	if err != nil {
		return "", tempDir, err
	}

	sendEvent(clientWebSocket, EVENT_CLONED)

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	stratosProject := StratosProject{
		Url:        projectUrl,
		CommitHash: commitHash,
		Branch:     info.Branch,
		Timestamp:  time.Now().Unix(),
	}

	marshalledJson, _ := json.Marshal(stratosProject)
	return string(marshalledJson), tempDir, nil
}

func getGitUrlSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (string, string, error) {

	// The msg data is JSON for the GitHub info
	info := GitUrlSourceInfo{}
	if err := json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return "", tempDir, err
	}

	log.Infof("Git Url Source: %s, branch %s", info.Url, info.Branch)

	commitHash, err := cloneRepository(info.Url, info.Branch, clientWebSocket, tempDir)
	if err != nil {
		return "", tempDir, err
	}

	sendEvent(clientWebSocket, EVENT_CLONED)

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	stratosProject := StratosProject{
		Url:        info.Url,
		CommitHash: commitHash,
		Branch:     info.Branch,
		Timestamp:  time.Now().Unix(),
	}

	marshalledJson, _ := json.Marshal(stratosProject)
	return string(marshalledJson), tempDir, nil
}


func getMarshalledSocketMessage(data string, messageType MessageType) ([]byte, error) {

	messageStruct := SocketMessage{
		Message:   string(data),
		Timestamp: time.Now().Unix(),
		Type:      messageType,
	}
	marshalledJson, err := json.Marshal(messageStruct)
	return marshalledJson, err

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

	deps.WordGenerator = generator.NewWordGenerator()

	deps.AppZipper = appfiles.ApplicationZipper{}
	deps.AppFiles = appfiles.ApplicationFiles{}

	deps.RouteActor = actors.NewRouteActor(deps.UI, deps.RepoLocator.GetRouteRepository(), deps.RepoLocator.GetDomainRepository())
	deps.PushActor = actors.NewPushActor(deps.RepoLocator.GetApplicationBitsRepository(), deps.AppZipper, deps.AppFiles, deps.RouteActor)

	deps.ChecksumUtil = util.NewSha1Checksum("")

	deps.Logger = logger

	return deps

}
func (cfAppPush *CFAppPush) getConfigData(echoContext echo.Context, cnsiGuid string, orgGuid string, spaceGuid string, spaceName string, orgName string, clientWebSocket *websocket.Conn) (coreconfig.Repository, error) {

	var configRepo coreconfig.Repository
	cnsiRecord, err := cfAppPush.portalProxy.GetCNSIRecord(cnsiGuid)
	if err != nil {
		log.Warnf("Failed to retrieve record for CNSI %s, error is %+v", cnsiGuid, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_CNSI)
		return configRepo, err
	}

	userId, err := cfAppPush.portalProxy.GetSessionStringValue(echoContext, "user_id")

	if err != nil {
		log.Warnf("Failed to retrieve session user")
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_SESSION)
		return configRepo, err
	}
	cnsiTokenRecord, found := cfAppPush.portalProxy.GetCNSITokenRecord(cnsiGuid, userId)
	if !found {
		log.Warnf("Failed to retrieve record for CNSI %s", cnsiGuid)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_CNSI_USERTOKEN)
		return configRepo, errors.New("Failed to find token record")
	}

	var filePath = fmt.Sprintf("/tmp/%s", uuid.NewV1())
	repo := coreconfig.NewRepositoryFromFilepath(filePath, func(error) {})

	repo.SetAuthenticationEndpoint(cnsiRecord.AuthorizationEndpoint)
	repo.SetAPIEndpoint(cnsiRecord.APIEndpoint.String())
	repo.SetDopplerEndpoint(cnsiRecord.DopplerLoggingEndpoint)
	repo.SetSSLDisabled(cnsiRecord.SkipSSLValidation)
	repo.SetAccessToken(cnsiTokenRecord.AuthToken)
	repo.SetRefreshToken(cnsiTokenRecord.RefreshToken)
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

func cloneRepository(repoUrl string, branch string, clientWebSocket *websocket.Conn, tempDir string) (string, error) {

	if len(branch) == 0 {
		err := errors.New("No branch supplied")
		log.Infof("Failed to checkout repo %s due to %+v", branch, repoUrl, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILED_NO_BRANCH)
		return "", err
	}

	vcsGit := GetVCS()

	err := vcsGit.Create(tempDir, repoUrl, branch)
	if err != nil {
		log.Infof("Failed to clone repo %s due to %+v", repoUrl, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILED_CLONE)
		return "", err
	}

	head, err := vcsGit.Head(tempDir)
	if err != nil {
		log.Infof("Unable to fetch HEAD in branch due to %s", err)
		return "", err
	}

	return head, nil

}

// This assumes manifest lives in the root of the app
func fetchManifest(repoPath string, sourceEnvVarMetadata string, clientWebSocket *websocket.Conn) (manifest.Applications, error) {

	var manifest manifest.Applications
	manifestPath := fmt.Sprintf("%s/manifest.yml", repoPath)
	data, err := ioutil.ReadFile(manifestPath)
	if err != nil {
		log.Warnf("Failed to read manifest in path %s", manifestPath)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_MANIFEST)
		return manifest, err
	}

	err = yaml.Unmarshal(data, &manifest)
	if err != nil {
		log.Warnf("Failed to unmarshall manifest in path %s", manifestPath)
		sendErrorMessage(clientWebSocket, err, CLOSE_INVALID_MANIFEST)
		return manifest, err
	}

	// If we have metadata to indicate the source origin, add it to the manifest
	if len(sourceEnvVarMetadata) > 0 {
		for i, app := range manifest.Applications {
			if len(app.Env) == 0 {
				app.Env = make(map[string]interface{})
			}
			app.Env[stratosProjectKey] = sourceEnvVarMetadata
			manifest.Applications[i] = app
		}

		marshalledYaml, err := yaml.Marshal(manifest)
		if err != nil {
			log.Warnf("Failed to marshall manifest in path %v", manifest)
			sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
			return manifest, err
		}
		ioutil.WriteFile(manifestPath, marshalledYaml, 0600)
	}

	return manifest, nil
}

func (sw *SocketWriter) Write(data []byte) (int, error) {

	message, _ := getMarshalledSocketMessage(string(data), DATA)

	err := sw.clientWebSocket.WriteMessage(websocket.TextMessage, message)
	if err != nil {
		return 0, err
	}
	return len(data), nil
}

func sendManifest(manifest manifest.Applications, clientWebSocket *websocket.Conn) error {

	manifestBytes, err := json.Marshal(manifest)
	if err != nil {
		return err
	}
	manifestJson := string(manifestBytes)
	message, _ := getMarshalledSocketMessage(manifestJson, MANIFEST)

	clientWebSocket.WriteMessage(websocket.TextMessage, message)
	return nil
}

func sendErrorMessage(clientWebSocket *websocket.Conn, err error, errorType MessageType) {
	closingMessage, _ := getMarshalledSocketMessage(fmt.Sprintf("Failed due to %s!", err), errorType)
	clientWebSocket.WriteMessage(websocket.TextMessage, closingMessage)
}

func sendEvent(clientWebSocket *websocket.Conn, event MessageType) {
	msg, _ := getMarshalledSocketMessage("", event)
	clientWebSocket.WriteMessage(websocket.TextMessage, msg)
}
