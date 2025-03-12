package cfapppush

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	yaml "gopkg.in/yaml.v2"

	archiver "github.com/mholt/archiver/v3"
)

// Success
const (
	DATA MessageType = iota + 20000
	MANIFEST
	CLOSE_SUCCESS
	APP_GUID_NOTIFY
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
	CLOSE_ACK
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
	SOURCE_GITSCM
	SOURCE_FOLDER
	SOURCE_FILE
	SOURCE_FILE_DATA
	SOURCE_FILE_ACK
	SOURCE_GITURL
	SOURCE_WAIT_ACK
	SOURCE_DOCKER_IMG
)

// Application Overrides messages
const (
	OVERRIDES_REQUIRED MessageType = iota + 50000
	OVERRIDES_SUPPLIED
)

const (
	SCM_TYPE_GITHUB = "github"
	SCM_TYPE_GITLAB = "gitlab"
)

const (
	stratosProjectKey = "STRATOS_PROJECT"
)

func (cfAppPush *CFAppPush) deploy(echoContext echo.Context) error {

	cnsiGUID := echoContext.Param("cnsiGuid")
	orgGUID := echoContext.Param("orgGuid")
	spaceGUID := echoContext.Param("spaceGuid")
	spaceName := echoContext.QueryParam("space")
	orgName := echoContext.QueryParam("org")

	// App ID is this is a redeploy
	appID := echoContext.QueryParam("app")
	userGUID := echoContext.Get("user_id").(string)

	log.Debug("UpgradeToWebSocket")
	clientWebSocket, pingTicker, err := api.UpgradeToWebSocket(echoContext)
	log.Debug("UpgradeToWebSocket done")
	if err != nil {
		log.Errorf("Upgrade to websocket failed due to: %+v", err)
		return err
	}
	defer clientWebSocket.Close()
	defer pingTicker.Stop()

	// We use a simple protocol to get the source to use for cf push and any cf push cli overrides

	// Ask for source first, then overrides - to support the case that local file/folder source is uploaded first before overrides are avialable

	// Send a message to the client to say that we are awaiting source details
	sendEvent(clientWebSocket, SOURCE_REQUIRED)

	// Wait for a message from the client
	log.Debug("Waiting for source information from client")

	msg := SocketMessage{}
	if err := clientWebSocket.ReadJSON(&msg); err != nil {
		log.Errorf("Error reading JSON: %v+", err)
		return err
	}

	log.Debugf("Source %v+", msg)

	// Temporary folder for the application source
	tempDir, err := os.MkdirTemp("", "cf-push-")
	if err != nil {
		log.Errorf("Error creating temporary directory: %s", err)
		return err
	}

	defer os.RemoveAll(tempDir)

	var appDir string
	var stratosProject StratosProject

	// Get the source, depending on the source type
	switch msg.Type {
	case SOURCE_GITSCM:
		stratosProject, appDir, err = cfAppPush.getGitSCMSource(clientWebSocket, tempDir, msg, userGUID)
	case SOURCE_FOLDER:
		stratosProject, appDir, err = getFolderSource(clientWebSocket, tempDir, msg)
	case SOURCE_GITURL:
		stratosProject, appDir, err = getGitURLSource(clientWebSocket, tempDir, msg)
	case SOURCE_DOCKER_IMG:
		stratosProject, appDir, err = getDockerURLSource(clientWebSocket, tempDir, msg)
	default:
		err = errors.New("unsupported source type; don't know how to get the source for the application")
	}

	if err != nil {
		log.Errorf("Failed to fetch source: %v+", err)
		return err
	}

	// Send a message to the client to say that we are awaiting application overrides
	sendEvent(clientWebSocket, OVERRIDES_REQUIRED)

	// Wait for a message from the client
	log.Debug("Waiting for app overrides from client")

	msgOverrides := SocketMessage{}
	if err := clientWebSocket.ReadJSON(&msgOverrides); err != nil {
		log.Errorf("Error reading JSON: %v+", err)
		return err
	}

	if msgOverrides.Type != OVERRIDES_SUPPLIED {
		log.Errorf("Expected app deploy override but received event with type: %v", msgOverrides.Type)
		return errors.New("expected app deploy override message but received another type")
	}

	log.Debugf("Overrides: %v+", msgOverrides)
	overrides := CFPushAppOverrides{}
	if err = json.Unmarshal([]byte(msgOverrides.Message), &overrides); err != nil {
		log.Errorf("Error marshalling json: %v+", err)
		return err
	}

	stratosProject.DeployOverrides = overrides

	// Source fetched - read manifest
	manifest, manifestFile, err := fetchManifest(appDir, stratosProject, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to find manifest file: %s", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	sendEvent(clientWebSocket, EVENT_FETCHED_MANIFEST)

	err = sendManifest(manifest, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to read or send manifest due to %s", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	socketWriter := &SocketWriter{
		clientWebSocket: clientWebSocket,
	}
	pushConfig, err := cfAppPush.getConfigData(echoContext, cnsiGUID, orgGUID, spaceGUID, spaceName, orgName, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to initialise config due to error %+v", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	// Send App ID now if we have it (redeploy)
	if len(appID) > 0 {
		cfAppPush.SendEvent(clientWebSocket, APP_GUID_NOTIFY, appID)
	}

	dialTimeout := cfAppPush.portalProxy.Env().String("CF_DIAL_TIMEOUT", "")
	pushConfig.OutputWriter = socketWriter
	pushConfig.DialTimeout = dialTimeout

	// Initialise Push Command
	cfPush := Constructor(pushConfig, cfAppPush.portalProxy)

	err = cfPush.Init(appDir, manifestFile, overrides)
	if err != nil {
		log.Warnf("Failed to parse due to: %+v", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
		return err
	}

	sendEvent(clientWebSocket, EVENT_PUSH_STARTED)

	err = cfPush.Run(cfAppPush, clientWebSocket)
	if err != nil {
		log.Warnf("Failed to execute due to: %+v", err)
		sendErrorMessage(clientWebSocket, err, CLOSE_PUSH_ERROR)
		return err
	}

	log.Debug("Sending message to front-end to indicate push completed")
	sendEvent(clientWebSocket, EVENT_PUSH_COMPLETED)

	sendEvent(clientWebSocket, CLOSE_SUCCESS)

	log.Debug("Waiting for close acknowledgement from the client")

	wait := 30 * time.Second
	clientWebSocket.SetReadDeadline(time.Now().Add(wait))

	// Wait for the client to acknowledge the close - timeout ?
	if err := clientWebSocket.ReadJSON(&msg); err != nil {
		log.Errorf("Error reading JSON: %v+", err)
		return nil
	}

	if msg.Type != CLOSE_ACK {
		log.Errorf("Expected a close acknowledgement - got: %d", msg.Type)
	} else {
		log.Debug("Got close acknowledgement from the client")
	}

	// Close the web socket - should we wait for ack from client?
	clientWebSocket.Close()

	return nil
}

func getFolderSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (StratosProject, string, error) {
	// The msg data is JSON for the Folder info
	info := FolderSourceInfo{
		WaitAfterUpload: false,
	}

	if err := json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return StratosProject{}, tempDir, err
	}

	// Create all of the folders
	for _, folder := range info.Folders {
		path := filepath.Join(tempDir, folder)
		err := os.Mkdir(path, 0700)
		if err != nil {
			return StratosProject{}, tempDir, errors.New("failed to create folder")
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
			return StratosProject{}, tempDir, err
		}

		// Expecting a file
		if msg.Type != SOURCE_FILE {
			return StratosProject{}, tempDir, errors.New("unexpected web socket message type")
		}

		log.Debugf("Transferring file: %s", msg.Message)

		// Now expecting a binary message
		messageType, p, err := clientWebSocket.ReadMessage()

		if err != nil {
			return StratosProject{}, tempDir, err
		}

		if messageType != websocket.BinaryMessage {
			return StratosProject{}, tempDir, errors.New("expecting binary file data")
		}

		// Write the file
		path := filepath.Join(tempDir, msg.Message)
		err = os.WriteFile(path, p, 0644)
		if err != nil {
			return StratosProject{}, tempDir, err
		}

		lastFilePath = path
		transfers--

		// Acknowledge last file transfer
		if transfers == 0 {
			sendEvent(clientWebSocket, SOURCE_FILE_ACK)
		}
	}

	// Check to see if we received only 1 file and check if that was an archive file
	if info.Files == 1 {
		log.Debugf("Checking for archive file - %s", lastFilePath)

		// Overwrite generic 'filefolder' type
		info.DeploySource.SourceType = "archive"

		log.Debug("Unpacking archive ......")
		unpackPath := filepath.Join(tempDir, "application")
		err := os.Mkdir(unpackPath, 0700)
		if err != nil {
			return StratosProject{}, tempDir, err
		}

		err = archiver.Unarchive(lastFilePath, unpackPath)
		if err != nil {
			return StratosProject{}, tempDir, err
		}

		// Just check to see if we actually unpacked into a root folder
		contents, err := os.ReadDir(unpackPath)
		if err != nil {
			return StratosProject{}, tempDir, err
		}

		if len(contents) == 1 && contents[0].IsDir() {
			unpackPath = filepath.Join(unpackPath, contents[0].Name())
		}

		// Archive done
		tempDir = unpackPath
	}

	// The client (v2) can request only source upload and for deploy to wait until it sends a message
	if info.WaitAfterUpload {
		msg := SocketMessage{}
		if err := clientWebSocket.ReadJSON(&msg); err != nil {
			log.Errorf("Error reading JSON: %v+", err)
			return StratosProject{}, tempDir, err
		}

		if msg.Type != SOURCE_WAIT_ACK {
			return StratosProject{}, tempDir, errors.New("expecting ACK message to begin deployment")
		}
	}

	// All done!

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	info.Timestamp = time.Now().Unix()
	info.Folders = nil
	stratosProject := StratosProject{
		DeploySource: info,
	}

	return stratosProject, tempDir, nil
}

func (cfAppPush *CFAppPush) getGitSCMSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage, userGUID string) (StratosProject, string, error) {
	var (
		err error
	)

	// The msg data is JSON for the GitSCM info
	info := GitSCMSourceInfo{}
	if err = json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return StratosProject{}, tempDir, err
	}

	loggerURL := info.URL
	cloneURL := info.URL
	skipSSL := false

	// Apply credentials associated with the endpoint
	if len(info.EndpointGUID) != 0 {
		parsedURL, err := url.Parse(info.URL)
		if err != nil {
			return StratosProject{}, tempDir, errors.New("failed to parse SCM URL")
		}

		cnsiRecord, err := cfAppPush.portalProxy.GetCNSIRecord(info.EndpointGUID)
		if err != nil {
			return StratosProject{}, tempDir, errors.New("failed to find endpoint with guid " + info.EndpointGUID)
		}

		skipSSL = cnsiRecord.SkipSSLValidation

		tokenRecord, isTokenFound := cfAppPush.portalProxy.GetCNSITokenRecord(info.EndpointGUID, userGUID)
		if isTokenFound {
			authTokenDecodedBytes, err := base64.StdEncoding.DecodeString(tokenRecord.AuthToken)
			if err != nil {
				return StratosProject{}, tempDir, errors.New("failed to decode auth token")
			}

			var (
				username string
				password string
			)

			switch info.SCM {
			case SCM_TYPE_GITHUB:
				// GitHub API uses token auth: username and password are stored in the token information
				username = tokenRecord.RefreshToken
				password = string(authTokenDecodedBytes)
			case SCM_TYPE_GITLAB:
				// GitLab API uses token auth: username and password are stored in the token information
				username = tokenRecord.RefreshToken
				password = string(authTokenDecodedBytes)
			default:
				return StratosProject{}, tempDir, fmt.Errorf("unknown SCM type '%s'", info.SCM)
			}

			if len(username) == 0 {
				return StratosProject{}, tempDir, errors.New("username is empty")
			}

			// mask the credentials for the logs and env var
			parsedURL.User = url.UserPassword("REDACTED", "REDACTED")
			loggerURL = parsedURL.String()

			// apply the correct credentials
			parsedURL.User = url.UserPassword(username, password)
			cloneURL = parsedURL.String()
		}
	}

	log.Debugf("GitSCM SCM: %s, Source: %s, branch %s, url: %s", info.SCM, info.Project, info.Branch, loggerURL)
	cloneDetails := CloneDetails{
		Url:       cloneURL,
		LoggerUrl: loggerURL,
		Branch:    info.Branch,
		Commit:    info.CommitHash,
		SkipSSL:   skipSSL,
	}
	info.CommitHash, err = cloneRepository(cloneDetails, clientWebSocket, tempDir)
	if err != nil {
		return StratosProject{}, tempDir, err
	}

	sendEvent(clientWebSocket, EVENT_CLONED)

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	info.Timestamp = time.Now().Unix()
	stratosProject := StratosProject{
		DeploySource: info,
	}

	return stratosProject, tempDir, nil
}

func getGitURLSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (StratosProject, string, error) {

	var (
		err error
	)

	// The msg data is JSON for the GitHub info
	info := GitUrlSourceInfo{}

	if err = json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return StratosProject{}, tempDir, err
	}

	log.Debugf("Git Url Source: %s, branch %s", info.Url, info.Branch)
	cloneDetails := CloneDetails{
		Url:    info.Url,
		Branch: info.Branch,
		Commit: info.CommitHash,
	}
	info.CommitHash, err = cloneRepository(cloneDetails, clientWebSocket, tempDir)
	if err != nil {
		return StratosProject{}, tempDir, err
	}

	sendEvent(clientWebSocket, EVENT_CLONED)

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	info.Timestamp = time.Now().Unix()
	stratosProject := StratosProject{
		DeploySource: info,
	}

	return stratosProject, tempDir, nil
}

func getDockerURLSource(clientWebSocket *websocket.Conn, tempDir string, msg SocketMessage) (StratosProject, string, error) {

	var (
		err error
	)

	// The msg data is JSON for the docker info
	info := DockerImageSourceInfo{}

	if err = json.Unmarshal([]byte(msg.Message), &info); err != nil {
		return StratosProject{}, tempDir, err
	}

	log.Debugf("Docker Image: '%s', Username '%s'", info.DockerImage, info.DockerUsername)

	// Create a manifest using the application name. This sets up the environment as if it were a git clone
	applicationData := RawManifestApplication{
		Name: info.ApplicationName,
	}

	manifest := Applications{
		Applications: []RawManifestApplication{applicationData},
	}

	marshalledYaml, err := yaml.Marshal(manifest)
	if err != nil {
		return StratosProject{}, tempDir, err
	}

	manifestPath := fmt.Sprintf("%s/manifest.yml", tempDir)

	err = os.WriteFile(manifestPath, marshalledYaml, 0600)
	if err != nil {
		log.Warnf("Failed to write manifest in path %s", manifestPath)
		return StratosProject{}, tempDir, err
	}

	sendEvent(clientWebSocket, EVENT_CLONED)

	// Return a string that can be added to the manifest as an application env var to trace where the source originated
	info.Timestamp = time.Now().Unix()
	stratosProject := StratosProject{
		DeploySource: info,
	}

	return stratosProject, tempDir, nil
}

func getMarshalledSocketMessage(data string, messageType MessageType) ([]byte, error) {

	messageStruct := SocketMessage{
		Message:   string(data),
		Timestamp: time.Now().Unix(),
		Type:      messageType,
	}
	marshalledJSON, err := json.Marshal(messageStruct)
	return marshalledJSON, err
}

func (cfAppPush *CFAppPush) getConfigData(echoContext echo.Context, cnsiGUID string, orgGUID string, spaceGUID string, spaceName string, orgName string, clientWebSocket *websocket.Conn) (*CFPushAppConfig, error) {

	cnsiRecord, err := cfAppPush.portalProxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		log.Warnf("Failed to retrieve record for CNSI %s, error is %+v", cnsiGUID, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_CNSI)
		return nil, err
	}

	userID, err := cfAppPush.portalProxy.GetSessionStringValue(echoContext, "user_id")

	if err != nil {
		log.Warnf("Failed to retrieve session user")
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_SESSION)
		return nil, err
	}

	token, found := cfAppPush.portalProxy.GetCNSITokenRecord(cnsiGUID, userID)
	if !found {
		log.Warnf("Failed to retrieve record for CNSI %s", cnsiGUID)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_CNSI_USERTOKEN)
		return nil, errors.New("failed to find token record")
	}

	config := &CFPushAppConfig{
		AuthorizationEndpoint:  cnsiRecord.AuthorizationEndpoint,
		CFClient:               cnsiRecord.ClientId,
		CFClientSecret:         cnsiRecord.ClientSecret,
		APIEndpointURL:         cnsiRecord.APIEndpoint.String(),
		DopplerLoggingEndpoint: cnsiRecord.DopplerLoggingEndpoint,
		SkipSSLValidation:      cnsiRecord.SkipSSLValidation,
		CACert:                 cnsiRecord.CACert,
		AuthToken:              token.AuthToken,
		OrgGUID:                orgGUID,
		OrgName:                orgName,
		SpaceGUID:              spaceGUID,
		SpaceName:              spaceName,
		EndpointID:             cnsiGUID,
		UserID:                 userID,
	}

	return config, nil
}

func cloneRepository(cloneDetails CloneDetails, clientWebSocket *websocket.Conn, tempDir string) (string, error) {

	if len(cloneDetails.Branch) == 0 {
		err := errors.New("no branch supplied")
		log.Infof("Failed to checkout repo %s due to %+v", cloneDetails.LoggerUrl, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILED_NO_BRANCH)
		return "", err
	}

	vcsGit := GetVCS()

	err := vcsGit.Create(cloneDetails.SkipSSL, tempDir, cloneDetails.Url, cloneDetails.Branch)
	if err != nil {
		log.Infof("Failed to clone repo %s due to %+v", cloneDetails.LoggerUrl, err)
		sendErrorMessage(clientWebSocket, err, CLOSE_FAILED_CLONE)
		return "", err
	}

	return getCommit(cloneDetails, clientWebSocket, tempDir, vcsGit)

}

func getCommit(cloneDetails CloneDetails, clientWebSocket *websocket.Conn, tempDir string, vcsGit *vcsCmd) (string, error) {

	if cloneDetails.Commit != "" {
		log.Debugf("Checking out commit %s", cloneDetails.Commit)
		err := vcsGit.ResetBranchToCommit(tempDir, cloneDetails.Commit)
		if err != nil {
			log.Infof("Failed to checkout commit %s", cloneDetails.Commit)
			sendErrorMessage(clientWebSocket, err, CLOSE_FAILED_CLONE)
			return "", err
		}
		return cloneDetails.Commit, nil
	}

	head, err := vcsGit.Head(tempDir)
	if err != nil {
		log.Infof("Unable to fetch HEAD in branch due to %s", err)
		return "", err
	}
	return strings.TrimSpace(head), nil

}

// Check if file exists
func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// This assumes manifest lives in the root of the app
func fetchManifest(repoPath string, stratosProject StratosProject, clientWebSocket *websocket.Conn) (Applications, string, error) {

	var manifest Applications

	// Can be either manifest.yml or manifest.yaml
	manifestPath := filepath.Join(repoPath, "manifest.yml")
	if !fileExists(manifestPath) {
		manifestPath = filepath.Join(repoPath, "manifest.yaml")
		if !fileExists(manifestPath) {
			return manifest, manifestPath, fmt.Errorf("can not find manifest file")
		}
	}

	// Read the manifest
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		log.Warnf("Failed to read manifest in path %s", manifestPath)
		sendErrorMessage(clientWebSocket, err, CLOSE_NO_MANIFEST)
		return manifest, manifestPath, err
	}

	err = yaml.Unmarshal(data, &manifest)
	if err != nil {
		log.Warnf("Failed to unmarshall manifest in path %s", manifestPath)
		sendErrorMessage(clientWebSocket, err, CLOSE_INVALID_MANIFEST)
		return manifest, manifestPath, err
	}

	marshalledJSON, _ := json.Marshal(stratosProject)
	envVarMetaData := string(marshalledJSON)

	// If we have metadata to indicate the source origin, add it to the manifest
	if len(envVarMetaData) > 0 {
		for i, app := range manifest.Applications {
			if len(app.EnvironmentVariables) == 0 {
				app.EnvironmentVariables = make(map[string]string)
			}
			app.EnvironmentVariables[stratosProjectKey] = envVarMetaData
			manifest.Applications[i] = app
		}

		marshalledYaml, err := yaml.Marshal(manifest)
		if err != nil {
			log.Warnf("Failed to marshall manifest in path %v", manifest)
			sendErrorMessage(clientWebSocket, err, CLOSE_FAILURE)
			return manifest, manifestPath, err
		}
		os.WriteFile(manifestPath, marshalledYaml, 0600)
	}

	return manifest, manifestPath, nil
}

func (sw *SocketWriter) Write(data []byte) (int, error) {

	defer func() {
		if r := recover(); r != nil {
			fmt.Println("WebSocket write recovered from panic", r)
		}
	}()

	message, _ := getMarshalledSocketMessage(string(data), DATA)

	err := sw.clientWebSocket.WriteMessage(websocket.TextMessage, message)
	if err != nil {
		log.Warnf("Failed to write data to web socket: %s", err)
		return 0, err
	}
	return len(data), nil
}

func sendManifest(manifest Applications, clientWebSocket *websocket.Conn) error {

	manifestBytes, err := json.Marshal(manifest)
	if err != nil {
		return err
	}
	manifestJSON := string(manifestBytes)
	message, _ := getMarshalledSocketMessage(manifestJSON, MANIFEST)

	clientWebSocket.WriteMessage(websocket.TextMessage, message)
	return nil
}

func sendErrorMessage(clientWebSocket *websocket.Conn, err error, errorType MessageType) {
	closingMessage, _ := getMarshalledSocketMessage(fmt.Sprintf("Failed due to %s!", err), errorType)
	if err := clientWebSocket.WriteMessage(websocket.TextMessage, closingMessage); err != nil {
		log.Warnf("Failed to write error message to web socket: %s", err)
	}
}

func sendEvent(clientWebSocket *websocket.Conn, event MessageType) {
	msg, _ := getMarshalledSocketMessage("", event)
	if err := clientWebSocket.WriteMessage(websocket.TextMessage, msg); err != nil {
		log.Warnf("Failed to write message to web socket: %s", err)
	}
}

// SendEvent sends a message over the web socket
func (cfAppPush *CFAppPush) SendEvent(clientWebSocket *websocket.Conn, event MessageType, data string) {
	msg, _ := getMarshalledSocketMessage(data, event)
	if err := clientWebSocket.WriteMessage(websocket.TextMessage, msg); err != nil {
		log.Warnf("Failed to write message to web socket: %s", err)
	}
}
