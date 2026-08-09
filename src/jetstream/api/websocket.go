package api

import (
	"context"
	"fmt"
	"time"

	"github.com/coder/websocket"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

const (
	// Send ping messages to peer with this period
	pingPeriod = 27 * time.Second

	// Time allowed for a ping to be written and answered with a pong
	pingWait = 10 * time.Second
)

// Upgrade the HTTP connection to a WebSocket with a Ping ticker
func UpgradeToWebSocket(echoContext echo.Context) (*websocket.Conn, *time.Ticker, error) {

	log.Debugf("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := websocket.Accept(echoContext.Response().Writer, echoContext.Request(), &websocket.AcceptOptions{
		// Allow connections from any Origin
		InsecureSkipVerify: true,
		CompressionMode:    websocket.CompressionDisabled,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("Upgrading connection to a WebSocket failed: [%v]", err)
	}
	log.Debugf("Successfully upgraded to a WebSocket connection")

	// HSC-1276 - send regular Pings to prevent the WebSocket being closed on us.
	// A pong is only observed while a read is pending on the connection, so a
	// ping timeout is logged rather than treated as a dead peer - some handlers
	// (e.g. app deploy during the push phase) legitimately go long periods
	// without a pending read.
	ticker := time.NewTicker(pingPeriod)
	go func() {
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), pingWait)
			err := clientWebSocket.Ping(ctx)
			cancel()
			if err != nil {
				log.Debugf("Web socket ping did not complete: %v", err)
			}
		}
	}()

	return clientWebSocket, ticker, nil
}
