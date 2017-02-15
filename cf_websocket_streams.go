package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/cloudfoundry/noaa"
	"github.com/cloudfoundry/noaa/consumer"
	noaa_errors "github.com/cloudfoundry/noaa/errors"
	"github.com/cloudfoundry/sonde-go/events"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	// Time allowed to read the next pong message from the peer
	pongWait = 30 * time.Second

	// Send ping messages to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Time allowed to write a ping message
	pingWriteTimeout = 10 * time.Second
)

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (p *portalProxy) appStream(c echo.Context) error {
	return p.commonStreamHandler(c, appStreamHandler)
}

func (p *portalProxy) firehose(c echo.Context) error {
	return p.commonStreamHandler(c, firehoseStreamHandler)
}

func (p *portalProxy) commonStreamHandler(c echo.Context, bespokeStreamHandler func (echo.Context, *AuthorizedConsumer, *websocket.Conn) error) error {
	ac, err := p.openNoaaConsumer(c)
	if err != nil {
		return err
	}
	defer ac.consumer.Close()

	clientWebSocket, pingTicker, err := upgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer clientWebSocket.Close()
	defer pingTicker.Stop()

	if err := bespokeStreamHandler(c, ac, clientWebSocket); err != nil {
		return err
	}

	// This blocks until the WebSocket is closed
	drainClientMessages(clientWebSocket)
	return nil
}

type AuthorizedConsumer struct {
	consumer *consumer.Consumer
	authToken string
	refreshToken func() error
}

// Refresh the Authorization token if needed and create a new Noaa consumer
func (p *portalProxy) openNoaaConsumer(c echo.Context) (*AuthorizedConsumer, error) {

	ac := &AuthorizedConsumer{}

	// Get the CNSI and app IDs from route parameters
	cnsiGUID := c.Param("cnsiGuid")
	userGUID := c.Get("user_id").(string)

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := p.getCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get record for CNSI %s: [%v]", cnsiGUID, err)
	}

	ac.refreshToken = func() error {
		newTokenRecord, err := p.refreshToken(cnsiRecord.SkipSSLValidation, cnsiGUID, userGUID, p.Config.HCFClient, p.Config.HCFClientSecret, cnsiRecord.TokenEndpoint)
		if err != nil {
			msg := fmt.Sprintf("Error refreshing token for CNSI %s : [%v]", cnsiGUID, err)
			return echo.NewHTTPError(http.StatusUnauthorized, msg)
		}
		ac.authToken = "bearer " + newTokenRecord.AuthToken
		return nil
	}

	dopplerAddress := cnsiRecord.DopplerLoggingEndpoint
	logger.Debugf("CNSI record Obtained! Using Doppler Logging Endpoint: %s", dopplerAddress)

	// Get the auth token for the CNSI from the DB, refresh it if it's expired
	if tokenRecord, ok := p.getCNSITokenRecord(cnsiGUID, userGUID); ok {
		ac.authToken = "bearer " + tokenRecord.AuthToken
		expTime := time.Unix(tokenRecord.TokenExpiry, 0)
		if expTime.Before(time.Now()) {
			logger.Debug("Token obtained has expired, refreshing!")
			if err = ac.refreshToken(); err != nil {
				return nil, err
			}
		}
	} else {
		return nil, fmt.Errorf("Error getting token for user %s on CNSI %s", userGUID, cnsiGUID)
	}

	// Open a Noaa consumer to the doppler endpoint
	logger.Debugf("Creating Noaa consumer for Doppler endpoint %s", dopplerAddress)
	ac.consumer = consumer.New(dopplerAddress, &tls.Config{InsecureSkipVerify: true}, http.ProxyFromEnvironment)

	return ac, nil
}

// Upgrade the HTTP connection to a WebSocket with a Ping ticker
func upgradeToWebSocket(c echo.Context) (*websocket.Conn, *time.Ticker, error) {

	// Adapt echo.Context to Gorilla handler
	responseWriter := c.Response().(*standard.Response).ResponseWriter
	request := c.Request().(*standard.Request).Request

	// We're now ok talking to HCF, time to upgrade the request to a WebSocket connection
	logger.Debugf("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("Upgrading connection to a WebSocket failed: [%v]", err)
	}
	logger.Debugf("Successfully upgraded to a WebSocket connection")

	// HSC-1276 - handle pong messages and reset the read deadline
	clientWebSocket.SetReadDeadline(time.Now().Add(pongWait))
	clientWebSocket.SetPongHandler(func(string) error {
		clientWebSocket.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// HSC-1276 - send regular Pings to prevent the WebSocket being closed on us
	ticker := time.NewTicker(pingPeriod)
	go func() {
		for range ticker.C {
			clientWebSocket.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(pingWriteTimeout))
		}
	}()

	return clientWebSocket, ticker, nil
}

// Attempts to get the recent logs, if we get an unauthorized error we will refresh the auth token and retry once
func getRecentLogs(ac *AuthorizedConsumer, cnsiGUID, appGUID string) ([]*events.LogMessage, error) {
	logger.Debug("getRecentLogs")
	messages, err := ac.consumer.RecentLogs(appGUID, ac.authToken)
	if err != nil {
		errorPattern := "Failed to get recent messages for App %s on CNSI %s [%v]"
		if _, ok := err.(*noaa_errors.UnauthorizedError); ok {
			// If unauthorized, we may need to refresh our Auth token
			// Note: annoyingly, older versions of CF also send back "401 - Unauthorized" when the app doesn't exist...
			// This means we sometimes end up here even when our token is legit
			if err := ac.refreshToken(); err != nil {
				return nil, fmt.Errorf(errorPattern, appGUID, cnsiGUID, err)
			}
			messages, err = ac.consumer.RecentLogs(appGUID, ac.authToken)
			if err != nil {
				msg := fmt.Sprintf(errorPattern, appGUID, cnsiGUID, err)
				return nil, echo.NewHTTPError(http.StatusUnauthorized, msg)
			}
		} else {
			return nil, fmt.Errorf(errorPattern, appGUID, cnsiGUID, err)
		}
	}
	return messages, nil
}

func drainErrors(errorChan <-chan error) {
	for err := range errorChan {
		// Note: we receive a nil error before the channel is closed so check here...
		if err != nil {
			logger.Errorf("Received error from Doppler %v", err.Error())
		}
	}
}

func drainLogMessages(msgChan <-chan *events.LogMessage, callback func(msg *events.LogMessage)) {
	for msg := range msgChan {
		callback(msg)
	}
}

func drainFirehoseEvents(eventChan <-chan *events.Envelope, callback func(msg *events.Envelope)) {
	for event := range eventChan {
		callback(event)
	}
}

// Drain and discard incoming messages from the WebSocket client, effectively making our WebSocket read-only
func drainClientMessages(clientWebSocket *websocket.Conn) {
	for {
		_, _, err := clientWebSocket.ReadMessage()
		if err != nil {
			// We get here when the client (browser) disconnects
			break
		}
	}
}

func appStreamHandler(c echo.Context, ac *AuthorizedConsumer, clientWebSocket *websocket.Conn) error {
	// Get the CNSI and app IDs from route parameters
	cnsiGUID := c.Param("cnsiGuid")
	appGUID := c.Param("appGuid")

	logger.Infof("Received request for log stream for App ID: %s - in CNSI: %s", appGUID, cnsiGUID)

	messages, err := getRecentLogs(ac, cnsiGUID, appGUID)
	if err != nil {
		return err
	}
	// Reusable closure to pump messages from Noaa to the client WebSocket
	// N.B. We convert protobuf messages to JSON for ease of use in the frontend
	relayLogMsg := func(msg *events.LogMessage) {
		if jsonMsg, err := json.Marshal(msg); err != nil {
			logger.Errorf("Received unparsable message from Doppler %v, %v", jsonMsg, err)
		} else {
			err := clientWebSocket.WriteMessage(websocket.TextMessage, jsonMsg)
			if err != nil {
				logger.Errorf("Error writing data to WebSocket, %v", err)
			}
		}
	}

	// Send the recent messages, sorted in Chronological order
	for _, msg := range noaa.SortRecent(messages) {
		relayLogMsg(msg)
	}

	msgChan, errorChan := ac.consumer.TailingLogs(appGUID, ac.authToken)

	// Process the app stream
	go drainErrors(errorChan)
	go drainLogMessages(msgChan, relayLogMsg)

	logger.Infof("Now streaming log for App ID: %s - on CNSI: %s", appGUID, cnsiGUID)
	return nil
}

func firehoseStreamHandler(c echo.Context, ac *AuthorizedConsumer, clientWebSocket *websocket.Conn) error {
	logger.Debug("firehose")

	// Get the CNSI and app IDs from route parameters
	cnsiGUID := c.Param("cnsiGuid")

	logger.Infof("Received request for Firehose stream for CNSI: %s", cnsiGUID)

	userGUID := c.Get("user_id").(string)
	firehoseSubscriptionId := userGUID + "@" + strconv.FormatInt(time.Now().UnixNano(), 10);
	logger.Debugf("Connecting the Firehose with subscription ID: %s", firehoseSubscriptionId)

	eventChan, errorChan := ac.consumer.Firehose(firehoseSubscriptionId, ac.authToken)

	// Process the app stream
	go drainErrors(errorChan)
	go drainFirehoseEvents(eventChan, func(msg *events.Envelope) {
		if jsonMsg, err := json.Marshal(msg); err != nil {
			logger.Errorf("Received unparsable message from Doppler %v, %v", jsonMsg, err)
		} else {
			err := clientWebSocket.WriteMessage(websocket.TextMessage, jsonMsg)
			if err != nil {
				logger.Errorf("Error writing data to WebSocket, %v", err)
			}
		}
	})

	logger.Infof("Firehose connected and streaming for CNSI: %s - subscription ID: %s", cnsiGUID, firehoseSubscriptionId)
	return nil
}