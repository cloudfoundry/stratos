package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"time"
	"github.com/cloudfoundry/noaa"
	"github.com/cloudfoundry/noaa/consumer"
	noaa_errors "github.com/cloudfoundry/noaa/errors"
	"github.com/cloudfoundry/sonde-go/events"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (p *portalProxy) appStream(c echo.Context) error {
	var userGuid, dopplerAddress, authToken string

	// Get the CNSI and app IDs from route parameters
	cnsiGuid := c.Param("cnsiGuid")
	appGuid := c.Param("appGuid")

	log.Printf("Received request for log stream for App ID: %s - from CNSI: %s\n", appGuid, cnsiGuid)

	// Get user GUID from session
	userGuid, ok := getUserGuid(p, c)
	if !ok {
		return fmt.Errorf("Failed to get user id from session")
	}

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, ok := p.getCNSIRecord(cnsiGuid)
	if !ok {
		return fmt.Errorf("Failed to get record for CNSI %s", cnsiGuid)
	} else {
		dopplerAddress = cnsiRecord.DopplerLoggingEndpoint
		log.Printf("CNSI record Obtained! Using Doppler Logging Endpoint: %s", dopplerAddress)
	}

	// Reusable closure to refresh the authToken
	refreshTokenRecord := func() error {
		newTokenRecord, err := p.refreshToken(cnsiGuid, userGuid, p.Config.HCFClient, p.Config.HCFClientSecret, cnsiRecord.TokenEndpoint)
		if err != nil {
			return fmt.Errorf("Error refreshing token for CNSI %s : [%v]", cnsiGuid, err)
		}
		authToken = "bearer " + newTokenRecord.AuthToken
		return nil
	}

	// Get the auth token for the CNSI from the DB, refresh it if it's expired
	if tokenRecord, ok := p.getCNSITokenRecord(cnsiGuid, userGuid); ok {
		authToken = "bearer " + tokenRecord.AuthToken
		expTime := time.Unix(tokenRecord.TokenExpiry, 0)
		if expTime.Before(time.Now()) {
			log.Println("Token obtained has expired, refreshing!")
			if err := refreshTokenRecord(); err != nil {
				return err
			}
		}
	} else {
		return fmt.Errorf("Error getting token for user %s on CNSI %s", userGuid, cnsiGuid)
	}

	// Adapt echo.Context to Gorilla handler
	responseWriter := c.Response().(*standard.Response).ResponseWriter
	request := c.Request().(*standard.Request).Request

	// Open a Noaa consumer to the doppler endpoint
	fmt.Println("Opening Noaa consumer to Doppler endpoint", dopplerAddress)
	noaaConsumer := consumer.New(dopplerAddress, &tls.Config{InsecureSkipVerify: true}, nil)
	defer noaaConsumer.Close()

	messages, err := getRecentLogs(noaaConsumer, cnsiGuid, appGuid, authToken, refreshTokenRecord)
	if err != nil {
		return err
	}

	// We're now ok talking to HCF, time to upgrade the request to a WebSocket connection
	log.Println("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		fmt.Println("Oops Upgrade to a WebSocket connection failed:", err)
		return err
	}
	fmt.Println("Successfully upgraded to a WebSocket connection")
	defer clientWebSocket.Close()
	// Graceful close of WebSocket, not really needed
	//defer clientWebSocket.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""), time.Time{})

	// Reusable closure to pump messages from Noaa to the client WebSocket
	relayLogMsg := func(msg []byte) {
		err := clientWebSocket.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Ooops Error writing data to WebSocket", err)
		}
	}

	// Send the recent messages, sorted in Chronological order
	for _, msg := range noaa.SortRecent(messages) {
		relayLogMsg(msg.GetMessage())
	}

	log.Printf("Now streaming log from App ID: %s - on CNSI: %s\n", appGuid, cnsiGuid)
	msgChan, errorChan := noaaConsumer.TailingLogs(appGuid, authToken)

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

// Extract the userGuid from the session (Cookie)
func getUserGuid(p *portalProxy, c echo.Context) (string, bool) {
	var userGuid string
	userGuidIntf, ok := p.getSessionValue(c, "user_id")
	if !ok {
		return userGuid, false
	} else {
		log.Printf("User GUID obtained from session %v", userGuidIntf)
		userGuid = userGuidIntf.(string)
		return userGuid, true
	}
}

// Attempts to get the recent logs, if we get an unauthorized error we attempt to refresh our auth token
func getRecentLogs(noaaConsumer *consumer.Consumer, cnsiGuid, appGuid, authToken string, refreshTokenRecord func() error) ([]*events.LogMessage, error) {
	messages, err := noaaConsumer.RecentLogs(appGuid, authToken)
	if err != nil {
		if ua, ok := err.(*noaa_errors.UnauthorizedError); ok {
			// Annoyingly, CF also sends back "401 - Unauthorized" when the app doesn't exist...
			// So we may end up here even when our token is legit
			fmt.Println("Unauthorized error! Trying to refresh our token!", ua)
			if err := refreshTokenRecord(); err != nil {
				return messages, err
			}
			messages, err = noaaConsumer.RecentLogs(appGuid, authToken)
			if err != nil {
				msg := fmt.Sprintf("After refreshing token, we still failed to get recent messages for App %s on CNSI %s [%v]", appGuid, cnsiGuid, err)
				return messages, echo.NewHTTPError(http.StatusUnauthorized, msg)
			}
		} else {
			return messages, fmt.Errorf("Error getting recent messages for App %s on CNSI %s [%v]", appGuid, cnsiGuid, err)
		}
	}
	return messages, nil
}

func drainErrChan(errorChan <-chan error) {
	for err := range errorChan {
		// Note: we receive a nil error before the channel is closed so check here...
		if err != nil {
			log.Printf("Received error from Doppler %v\n", err.Error())
		}
	}
}

func drainMsgChan(msgChan <-chan *events.LogMessage, callback func(msg []byte)) {
	for msg := range msgChan {
		callback(msg.GetMessage())
	}
}
