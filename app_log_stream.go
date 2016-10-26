package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Sirupsen/logrus"
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
	logger.Debug("appStream")
	var userGUID, dopplerAddress, authToken string

	// Get the CNSI and app IDs from route parameters
	cnsiGUID := c.Param("cnsiGuid")
	appGUID := c.Param("appGuid")

	logger.Infof("Received request for log stream for App ID: %s - from CNSI: %s\n", appGUID, cnsiGUID)

	// The session middleware will have populated c."user_id" for us
	userGUID = c.Get("user_id").(string)

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := p.getCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("Failed to get record for CNSI %s: %s", cnsiGUID, err)
	}

	dopplerAddress = cnsiRecord.DopplerLoggingEndpoint
	logger.Debugf("CNSI record Obtained! Using Doppler Logging Endpoint: %s", dopplerAddress)

	// Reusable closure to refresh the authToken
	refreshTokenRecord := func() error {
		newTokenRecord, errRefresh := p.refreshToken(cnsiRecord.SkipSSLValidation, cnsiGUID, userGUID, p.Config.HCFClient, p.Config.HCFClientSecret, cnsiRecord.TokenEndpoint)
		if errRefresh != nil {
			return fmt.Errorf("Error refreshing token for CNSI %s : [%v]", cnsiGUID, errRefresh)
		}
		authToken = "bearer " + newTokenRecord.AuthToken
		return nil
	}

	// Get the auth token for the CNSI from the DB, refresh it if it's expired
	if tokenRecord, ok := p.getCNSITokenRecord(cnsiGUID, userGUID); ok {
		authToken = "bearer " + tokenRecord.AuthToken
		expTime := time.Unix(tokenRecord.TokenExpiry, 0)
		if expTime.Before(time.Now()) {
			logger.Debug("Token obtained has expired, refreshing!")
			if err := refreshTokenRecord(); err != nil {
				return err
			}
		}
	} else {
		return fmt.Errorf("Error getting token for user %s on CNSI %s", userGUID, cnsiGUID)
	}

	// Adapt echo.Context to Gorilla handler
	responseWriter := c.Response().(*standard.Response).ResponseWriter
	request := c.Request().(*standard.Request).Request

	// Open a Noaa consumer to the doppler endpoint
	logger.Infof("Opening Noaa consumer to Doppler endpoint", dopplerAddress)
	noaaConsumer := consumer.New(dopplerAddress, &tls.Config{InsecureSkipVerify: true}, http.ProxyFromEnvironment)
	defer noaaConsumer.Close()

	messages, err := getRecentLogs(noaaConsumer, cnsiGUID, appGUID, authToken, refreshTokenRecord)
	if err != nil {
		return err
	}

	// We're now ok talking to HCF, time to upgrade the request to a WebSocket connection
	logger.Info("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		logger.Errorf("Oops Upgrade to a WebSocket connection failed: %+v\n", err)
		return err
	}
	logger.Info("Successfully upgraded to a WebSocket connection")
	defer clientWebSocket.Close()
	// Graceful close of WebSocket, not really needed
	//defer clientWebSocket.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""), time.Time{})

	// HSC-1276 - handle pong messages and reset the read deadline
	clientWebSocket.SetReadDeadline(time.Now().Add(pongWait))
	clientWebSocket.SetPongHandler(func(string) error {
		clientWebSocket.SetReadDeadline(time.Now().Add(pongWait));
		return nil
	})

	// HSC-1276 - send regular Pings to prevent the WebSocket being closed on us
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			clientWebSocket.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(pingWriteTimeout));
		}
	}()

	// Reusable closure to pump messages from Noaa to the client WebSocket
	// N.B. We parse the messages as JSON for ease of use in the frontend
	relayLogMsg := func(msg *events.LogMessage) {
		if jsonMsg, err := json.Marshal(msg); err != nil {
			logger.Errorf("Received unparsable message from Doppler %v, %v\n", jsonMsg, err)
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

	logger.WithFields(logrus.Fields{
		"app":  appGUID,
		"cnsi": cnsiGUID,
	}).Debug("Now streaming app log..")
	msgChan, errorChan := noaaConsumer.TailingLogs(appGUID, authToken)

	// Process the app stream
	go drainErrChan(errorChan)
	go drainMsgChan(msgChan, relayLogMsg)

	// Drain and discard incoming messages from the WebSocket client, effectively making our WebSocket read-only
	for {
		_, _, err := clientWebSocket.ReadMessage()
		if err != nil {
			// We get here when the client (browser) disconnects
			break
		}
	}

	return nil
}

// Attempts to get the recent logs, if we get an unauthorized error we attempt to refresh our auth token
func getRecentLogs(noaaConsumer *consumer.Consumer, cnsiGUID, appGUID, authToken string, refreshTokenRecord func() error) ([]*events.LogMessage, error) {
	logger.Debug("getRecentLogs")
	messages, err := noaaConsumer.RecentLogs(appGUID, authToken)
	if err != nil {
		if ua, ok := err.(*noaa_errors.UnauthorizedError); ok {
			// Annoyingly, CF also sends back "401 - Unauthorized" when the app doesn't exist...
			// So we may end up here even when our token is legit
			logger.Debugf("Unauthorized error! Trying to refresh our token! %+v\n", ua)
			if err := refreshTokenRecord(); err != nil {
				return messages, err
			}
			messages, err = noaaConsumer.RecentLogs(appGUID, authToken)
			if err != nil {
				msg := fmt.Sprintf("After refreshing token, we still failed to get recent messages for App %s on CNSI %s [%v]", appGUID, cnsiGUID, err)
				return messages, echo.NewHTTPError(http.StatusUnauthorized, msg)
			}
		} else {
			return messages, fmt.Errorf("Error getting recent messages for App %s on CNSI %s [%v]", appGUID, cnsiGUID, err)
		}
	}
	return messages, nil
}

func drainErrChan(errorChan <-chan error) {
	logger.Debug("drainErrChan")
	for err := range errorChan {
		// Note: we receive a nil error before the channel is closed so check here...
		if err != nil {
			logger.Errorf("Received error from Doppler %v\n", err.Error())
		}
	}
}

func drainMsgChan(msgChan <-chan *events.LogMessage, callback func(msg *events.LogMessage)) {
	logger.Debug("drainMsgChan")
	for msg := range msgChan {
		callback(msg)
	}
}
