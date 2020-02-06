package cfappssh

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
)

// See: https://docs.cloudfoundry.org/devguide/deploy-apps/ssh-apps.html

// WebScoket code based on: https://github.com/gorilla/websocket/blob/master/examples/command/main.go

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Inactivity timeout
	inActivityTimeout = 10 * time.Second

	md5FingerprintLength          = 47 // inclusive of space between bytes
	base64Sha256FingerprintLength = 43
)

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// KeyCode - JSON object that is passed from the front-end to notify of a key press or a term resize
type KeyCode struct {
	Key  string `json:"key"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

func (cfAppSsh *CFAppSSH) appSSH(c echo.Context) error {
	// Need to get info for the endpoint
	// Get the CNSI and app IDs from route parameters
	cnsiGUID := c.Param("cnsiGuid")
	userGUID := c.Get("user_id").(string)

	var p = cfAppSsh.portalProxy

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return sendSSHError("Could not get endpoint information")
	}

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time
	apiEndpoint := cnsiRecord.APIEndpoint

	cfPlugin, err := p.GetEndpointTypeSpec("cf")
	if err != nil {
		return sendSSHError("Can not get Cloud Foundry endpoint plugin")
	}

	_, info, err := cfPlugin.Info(apiEndpoint.String(), cnsiRecord.SkipSSLValidation)
	if err != nil {
		return sendSSHError("Can not get Cloud Foundry info")
	}

	cfInfo, found := info.(interfaces.V2Info)
	if !found {
		return sendSSHError("Can not get Cloud Foundry info")
	}

	appGUID := c.Param("appGuid")
	appInstance := c.Param("appInstance")

	host, _, err := net.SplitHostPort(cfInfo.AppSSHEndpoint)
	if err != nil {
		host = cfInfo.AppSSHEndpoint
	}

	// Build the Username
	// cf:APP-GUID/APP-INSTANCE-INDEX@SSH-ENDPOINT
	username := fmt.Sprintf("cf:%s/%s@%s", appGUID, appInstance, host)

	// Need to get SSH Code
	// Refresh token first - makes sure it will be valid when we make the request to get the code
	refreshedTokenRec, err := p.RefreshOAuthToken(cnsiRecord.SkipSSLValidation, cnsiRecord.GUID, userGUID, cnsiRecord.ClientId, cnsiRecord.ClientSecret, cnsiRecord.TokenEndpoint)
	if err != nil {
		return sendSSHError("Couldn't get refresh token for CNSI with GUID %s", cnsiRecord.GUID)
	}

	code, err := getSSHCode(cnsiRecord.TokenEndpoint, cfInfo.AppSSHOauthCLient, refreshedTokenRec.AuthToken, cnsiRecord.SkipSSLValidation)
	if err != nil {
		return sendSSHError("Couldn't get SSH Code: %s", err)
	}

	sshConfig := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(code),
		},
		HostKeyCallback: sshHostKeyChecker(cfInfo.AppSSHHostKeyFingerprint),
	}

	connection, err := ssh.Dial("tcp", cfInfo.AppSSHEndpoint, sshConfig)
	if err != nil {
		return fmt.Errorf("Failed to dial: %s", err)
	}

	session, err := connection.NewSession()
	if err != nil {
		return fmt.Errorf("Failed to create session: %s", err)
	}

	defer connection.Close()

	// Upgrade the web socket
	ws, pingTicker, err := interfaces.UpgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer ws.Close()
	defer pingTicker.Stop()

	modes := ssh.TerminalModes{
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	// NB: rows, cols
	if err := session.RequestPty("xterm", 84, 80, modes); err != nil {
		session.Close()
		return fmt.Errorf("request for pseudo terminal failed: %s", err)
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		return fmt.Errorf("Unable to setup stdin for session: %v", err)
	}

	stdout, err := session.StdoutPipe()
	if err != nil {
		return fmt.Errorf("Unable to setup stdout for session: %v", err)
	}

	defer session.Close()

	stdoutDone := make(chan struct{})
	go pumpStdout(ws, stdout, stdoutDone)
	go session.Shell()

	// Read the input from the web socket and pipe it to the SSH client
	for {
		_, r, err := ws.ReadMessage()
		if err != nil {
			log.Error("Error reading message from web socket")
			log.Warnf("%+v", err)
			return err
		}

		res := KeyCode{}
		json.Unmarshal(r, &res)

		if res.Cols == 0 {
			stdin.Write([]byte(res.Key))
		} else {
			// Terminal resize request
			if err := windowChange(session, res.Rows, res.Cols); err != nil {
				log.Error("Can not resize the PTY")
			}
		}
	}
}

func sendSSHError(format string, a ...interface{}) error {
	if len(a) == 0 {
		log.Error("App SSH Error: " + format)
	} else {
		log.Errorf("App SSH Error: "+format, a)
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf(format, a...))
}

func sshHostKeyChecker(fingerprint string) ssh.HostKeyCallback {
	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		switch len(fingerprint) {
		case base64Sha256FingerprintLength:
			if fmt.Sprintf("SHA256:%s", fingerprint) == ssh.FingerprintSHA256(key) {
				return nil
			}
		case md5FingerprintLength:
			if fingerprint == ssh.FingerprintLegacyMD5(key) {
				return nil
			}
		default:
			return errors.New("Unsupported host key fingerprint format")
		}
		return errors.New("Host key fingerprint is incorrect")
	}
}

// RFC 4254 Section 6.7.
type windowChangeRequestMsg struct {
	Columns uint32
	Rows    uint32
	Width   uint32
	Height  uint32
}

func windowChange(s *ssh.Session, h, w int) error {

	req := windowChangeRequestMsg{
		Columns: uint32(w),
		Rows:    uint32(h),
		Width:   uint32(w * 8),
		Height:  uint32(h * 8),
	}
	ok, err := s.SendRequest("window-change", true, ssh.Marshal(&req))
	if err == nil && !ok {
		err = errors.New("ssh: window-change failed")
	}
	return err
}

func pumpStdout(ws *websocket.Conn, r io.Reader, done chan struct{}) {
	buffer := make([]byte, 32768)
	for {
		len, err := r.Read(buffer)
		if err != nil {
			if err != io.EOF {
				log.Errorf("App SSH encountered an error reading from stdout; %v", err)
			}
			ws.Close()
			break
		}

		ws.SetWriteDeadline(time.Now().Add(writeWait))
		bytes := fmt.Sprintf("% x\n", buffer[:len])
		if err := ws.WriteMessage(websocket.TextMessage, []byte(bytes)); err != nil {
			log.Error("App SSH Failed to write nessage")
			ws.Close()
			break
		}
	}
}

// ErrPreventRedirect - Error to indicate a redirect - used to make a redirect that we want to prevent later
var ErrPreventRedirect = errors.New("prevent-redirect")

func getSSHCode(authorizeEndpoint, clientID, token string, skipSSLValidation bool) (string, error) {
	authorizeURL, err := url.Parse(authorizeEndpoint)
	if err != nil {
		return "", err
	}

	values := url.Values{}
	values.Set("response_type", "code")
	values.Set("grant_type", "authorization_code")
	values.Set("client_id", clientID)

	authorizeURL.Path += "/oauth/authorize"
	authorizeURL.RawQuery = values.Encode()

	authorizeReq, err := http.NewRequest("GET", authorizeURL.String(), nil)
	if err != nil {
		return "", err
	}

	authorizeReq.Header.Add("authorization", "Bearer "+token)

	httpClientWithoutRedirects := &http.Client{
		CheckRedirect: func(req *http.Request, _ []*http.Request) error {
			return ErrPreventRedirect
		},
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			DisableKeepAlives: true,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: skipSSLValidation,
			},
			Proxy:               http.ProxyFromEnvironment,
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}

	resp, err := httpClientWithoutRedirects.Do(authorizeReq)
	if resp != nil {
		log.Infof("%+v", resp)
	}
	if err == nil {
		return "", errors.New("Authorization server did not redirect with one time code")
	}

	if netErr, ok := err.(*url.Error); !ok || netErr.Err != ErrPreventRedirect {
		return "", errors.New("Error requesting one time code from server")
	}

	loc, err := resp.Location()
	if err != nil {
		return "", errors.New("Error getting the redirected location")
	}

	codes := loc.Query()["code"]
	if len(codes) != 1 {
		return "", errors.New("Unable to acquire one time code from authorization response")
	}

	return codes[0], nil
}
