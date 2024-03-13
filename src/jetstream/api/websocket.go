package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
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

// Upgrade the HTTP connection to a WebSocket with a Ping ticker
func UpgradeToWebSocket(echoContext echo.Context) (*websocket.Conn, *time.Ticker, error) {

	// Adapt echo.Context to Gorilla handler
	responseWriter := echoContext.Response().Writer
	request := echoContext.Request()

	// We're now ok talking to CF, time to upgrade the request to a WebSocket connection
	log.Debugf("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("Upgrading connection to a WebSocket failed: [%v]", err)
	}
	log.Debugf("Successfully upgraded to a WebSocket connection")

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
