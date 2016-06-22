package main

import (
	"net/http"
	"fmt"
	"github.com/cloudfoundry/noaa/consumer"
	noaa_errors "github.com/cloudfoundry/noaa/errors"
	"github.com/gorilla/websocket"
	"crypto/tls"
	"log"
	"github.com/cloudfoundry/noaa"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type ConsoleDebugPrinter struct{}

func (c ConsoleDebugPrinter) Print(title, dump string) {
	println("DEBUG PRINTER: ", title)
	println("DEBUG PRINTER: ", dump)
}

func (p *portalProxy) tailAppLogs(c echo.Context) error {
	var userGuid, dopplerAddress, authToken string
	cnsiGuid := c.Param("cnsiGuid")
	appGuid := c.Param("appGuid")

	userGuidIntf, ok := p.getSessionValue(c, "user_id")
	if !ok {
		userGuid = "77e99faf-3875-4c10-877d-974ec25b77b0"
		log.Println("Failed to get userGuid, using hardcoded default for Julien", userGuid)
	} else {
		log.Println("userGuid Obtained from session!", userGuidIntf)
		userGuid = userGuidIntf.(string)
	}

	cnsiRecord, ok := p.getCNSIRecord(cnsiGuid)
	if !ok {
		log.Println("Failed to get CNSIRecord")
		return fmt.Errorf("Failed to get CNSIRecord with GUID %s", cnsiGuid)
	} else {
		log.Println("CNSIRecord Obtained!", cnsiRecord)
		dopplerAddress = cnsiRecord.DopplerLoggingEndpoint
		log.Println("Using Doppler Logging Endpoint: ", dopplerAddress)
	}

	token, ok := p.getCNSITokenRecord(cnsiGuid, userGuid)
	if !ok {
		log.Println("Failed to get token")
	} else {
		log.Println("Token Obtained!", token)
		authToken = "bearer " + token.AuthToken
	}

	log.Printf("Tailing log requested for App ID: %s - from CNSI: %s\n", appGuid, cnsiGuid)

	responseWriter := c.Response().(*standard.Response).ResponseWriter
	request := c.Request().(*standard.Request).Request

	log.Println("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		fmt.Println("Oops Upgrade to a WebSocket connection failed:", err)
		return err
	}
	fmt.Println("Successfully upgraded to a WebSocket connection")
	defer clientWebSocket.Close()

	// Open a Noaa consumer to the doppler endpoint
	fmt.Println("Opening Noaa consumer to Doppler endpoint...")
	noaaConsumer := consumer.New(dopplerAddress, &tls.Config{InsecureSkipVerify: true}, nil)
	defer noaaConsumer.Close()

	noaaConsumer.SetDebugPrinter(ConsoleDebugPrinter{})

	relayLogMsg := func(msg []byte) {
		err := clientWebSocket.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Ooops Error writing data to WebSocket", err)
		}
	}

	// Stream the recent log lines
	messages, err := noaaConsumer.RecentLogs(appGuid, authToken)
	if err != nil {
		if ua, ok := err.(*noaa_errors.UnauthorizedError); ok {
			fmt.Println("Unauthorized error! Need to refresh our token!", ua)
		} else {
			log.Printf("===== Error getting recent messages: %v\n", err)
		}
		return err
	} else {
		log.Println("===== Got recent logs")
		for _, msg := range noaa.SortRecent(messages) {
			//log.Println(msg)
			relayLogMsg(msg.GetMessage())
		}
	}

	log.Println("===== Now streaming app log")
	msgChan, errorChan := noaaConsumer.TailingLogs(appGuid, authToken)

	// Drain the error channel
	go func() {
		for err := range errorChan {
			// Note: we receive a nil error before the channel is closed so check here...
			if err != nil {
				log.Printf("DEBUG: received error from Doppler %v\n", err.Error())
			}
		}
		log.Println("DEBUG: errorChan was closed")
	}()

	// Drain the message channel
	go func() {
		for msg := range msgChan {
			log.Printf("DEBUG: received message from Doppler %v\n", msg)
			relayLogMsg(msg.GetMessage())
		}
		log.Println("DEBUG: msgChan was closed")
	}()

	// Drain and discard incoming messages from the client
	for {
		_, message, err := clientWebSocket.ReadMessage()
		if err != nil {
			// We get here when the client (browser) disconnects
			log.Println("################ Read Error!", err)
			break
		}
		log.Printf("\n\n\n********************* recv: %s **************************************\n\n\n", message)
	}

	return nil
}
