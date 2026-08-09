package api

import (
	"context"
	"errors"
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

	// Bound for writing a single outgoing message
	writeTimeout = 10 * time.Second

	// Consecutive missed pongs tolerated before the peer is considered dead
	maxMissedPongs = 2
)

// WriteText sends a text message, bounding the write so a wedged peer cannot
// block the caller forever
func WriteText(conn *websocket.Conn, data []byte) error {
	ctx, cancel := context.WithTimeout(context.Background(), writeTimeout)
	defer cancel()
	return conn.Write(ctx, websocket.MessageText, data)
}

// UpgradeToWebSocket upgrades the HTTP connection to a WebSocket and starts a
// keepalive ping loop that closes the connection when the peer stops
// answering, so a handler blocked in Read observes a half-open connection.
// Pongs are only processed while a read is pending, so this variant is for
// handlers that keep a standing read on the connection; use
// UpgradeToWebSocketNoPongCheck otherwise.
func UpgradeToWebSocket(echoContext echo.Context) (*websocket.Conn, error) {
	return upgradeToWebSocket(echoContext, true)
}

// UpgradeToWebSocketNoPongCheck is UpgradeToWebSocket for handlers that go
// long periods without a pending read (e.g. app deploy during the push
// phase): missed pongs are expected there and only a failure to write the
// ping closes the connection.
func UpgradeToWebSocketNoPongCheck(echoContext echo.Context) (*websocket.Conn, error) {
	return upgradeToWebSocket(echoContext, false)
}

func upgradeToWebSocket(echoContext echo.Context, enforcePong bool) (*websocket.Conn, error) {

	log.Debugf("Upgrading request to the WebSocket protocol...")
	clientWebSocket, err := websocket.Accept(echoContext.Response().Writer, echoContext.Request(), &websocket.AcceptOptions{
		// Allow connections from any Origin
		InsecureSkipVerify: true,
		CompressionMode:    websocket.CompressionDisabled,
	})
	if err != nil {
		return nil, fmt.Errorf("Upgrading connection to a WebSocket failed: [%v]", err)
	}
	log.Debugf("Successfully upgraded to a WebSocket connection")

	// HSC-1276 - send regular Pings to prevent the WebSocket being closed on
	// us. The request context ends when the handler returns, terminating the
	// loop for finished connections.
	requestContext := echoContext.Request().Context()
	go func() {
		ticker := time.NewTicker(pingPeriod)
		defer ticker.Stop()
		missedPongs := 0
		for {
			select {
			case <-requestContext.Done():
				return
			case <-ticker.C:
			}

			ctx, cancel := context.WithTimeout(requestContext, pingWait)
			err := clientWebSocket.Ping(ctx)
			cancel()

			switch {
			case err == nil:
				missedPongs = 0
			case errors.Is(err, context.DeadlineExceeded):
				// No pong observed - either the peer is gone or no read was
				// pending to process it
				missedPongs++
				if enforcePong && missedPongs > maxMissedPongs {
					log.Debug("WebSocket peer stopped answering pings - closing the connection")
					clientWebSocket.CloseNow()
					return
				}
			default:
				// The ping could not be written - the connection is dead
				clientWebSocket.CloseNow()
				return
			}
		}
	}()

	return clientWebSocket, nil
}
