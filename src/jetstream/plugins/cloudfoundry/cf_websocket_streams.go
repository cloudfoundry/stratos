package cloudfoundry

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	logcache "code.cloudfoundry.org/go-log-cache/v2"
	"code.cloudfoundry.org/go-log-cache/v2/rpc/logcache_v1"
	"code.cloudfoundry.org/go-loggregator/v9/rpc/loggregator_v2"
	"github.com/cloudfoundry/noaa/v2/consumer"
	"github.com/cloudfoundry/sonde-go/events"
	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/coder/websocket"
	"github.com/labstack/echo/v5"
)

func (c *CloudFoundrySpecification) appStream(echoContext *echo.Context) error {
	return c.commonStreamHandler(echoContext, appStreamHandler)
}

func (c *CloudFoundrySpecification) firehose(echoContext *echo.Context) error {
	return c.commonStreamHandler(echoContext, firehoseStreamHandler)
}

func (c *CloudFoundrySpecification) commonStreamHandler(echoContext *echo.Context, bespokeStreamHandler func(*echo.Context, *AuthorizedConsumer, *websocket.Conn) error) error {
	ac, err := c.openNoaaConsumer(echoContext)
	if err != nil {
		return err
	}
	defer func() { _ = ac.consumer.Close() }()

	clientWebSocket, err := api.UpgradeToWebSocket(echoContext)
	if err != nil {
		return err
	}
	defer clientWebSocket.CloseNow()

	// Drain and discard incoming messages from the WebSocket client,
	// effectively making our WebSocket read-only; the standing read also
	// processes the keepalive pongs. The context ends when the client
	// disconnects.
	readCtx, stopReading := context.WithCancel(echoContext.Request().Context())
	defer stopReading()
	go func() {
		defer stopReading()
		for {
			if _, _, err := clientWebSocket.Read(readCtx); err != nil {
				// We get here when the client (browser) disconnects
				return
			}
		}
	}()

	if err := bespokeStreamHandler(echoContext, ac, clientWebSocket); err != nil {
		return err
	}

	// This blocks until the WebSocket is closed
	<-readCtx.Done()
	return nil
}

type AuthorizedConsumer struct {
	consumer       *consumer.Consumer
	logCacheClient *logcache.Client
	authToken      string
	refreshToken   func() error
}

// dopplerTLSConfig builds the TLS config for the Doppler/Noaa connection that
// carries the user's CF OAuth bearer token. It honours the endpoint's
// SkipSSLValidation setting and CA certificate instead of unconditionally
// skipping verification (which exposed the bearer token to an on-path MITM),
// mirroring how every other CF connection for this endpoint is built.
func dopplerTLSConfig(cnsiRecord api.CNSIRecord) *tls.Config {
	config := &tls.Config{InsecureSkipVerify: cnsiRecord.SkipSSLValidation}
	if len(cnsiRecord.CACert) > 0 {
		rootCAs, err := x509.SystemCertPool()
		if rootCAs == nil || err != nil {
			rootCAs = x509.NewCertPool()
		}
		if ok := rootCAs.AppendCertsFromPEM([]byte(cnsiRecord.CACert)); !ok {
			slog.Warn("Could not append the CA for the Doppler endpoint - using system certs only")
		}
		config.RootCAs = rootCAs
	}
	return config
}

// Refresh the Authorization token if needed and create a new Noaa consumer
func (c *CloudFoundrySpecification) openNoaaConsumer(echoContext *echo.Context) (*AuthorizedConsumer, error) {

	ac := &AuthorizedConsumer{}

	// Get the CNSI and app IDs from route parameters
	cnsiGUID := echoContext.Param("cnsiGuid")
	userGUID := echoContext.Get("user_id").(string)

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := c.portalProxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get record for CNSI %s: [%v]", cnsiGUID, err)
	}

	ac.refreshToken = func() error {
		newTokenRecord, err := c.portalProxy.RefreshOAuthToken(cnsiRecord.SkipSSLValidation, cnsiGUID, userGUID, cnsiRecord.ClientId, cnsiRecord.ClientSecret, cnsiRecord.TokenEndpoint)
		if err != nil {
			msg := fmt.Sprintf("Error refreshing token for CNSI %s : [%v]", cnsiGUID, err)
			return echo.NewHTTPError(http.StatusUnauthorized, msg)
		}
		ac.authToken = "bearer " + newTokenRecord.AuthToken
		return nil
	}

	dopplerAddress := cnsiRecord.DopplerLoggingEndpoint
	slog.Debug("CNSI record obtained, using the Doppler logging endpoint", "doppler", dopplerAddress)

	// Get the auth token for the CNSI from the DB, refresh it if it's expired
	if tokenRecord, ok := c.portalProxy.GetCNSITokenRecord(cnsiGUID, userGUID); ok && !tokenRecord.Disconnected {
		ac.authToken = "bearer " + tokenRecord.AuthToken
		expTime := time.Unix(tokenRecord.TokenExpiry, 0)
		if expTime.Before(time.Now()) {
			slog.Debug("Token obtained has expired, refreshing", "cnsi", cnsiGUID, "user", userGUID)
			if err = ac.refreshToken(); err != nil {
				return nil, err
			}
		}
	} else {
		return nil, fmt.Errorf("Error getting token for user %s on CNSI %s", userGUID, cnsiGUID)
	}

	// Open a Noaa consumer to the doppler endpoint
	slog.Debug("Creating the Noaa consumer", "doppler", dopplerAddress)
	ac.consumer = consumer.New(dopplerAddress, dopplerTLSConfig(cnsiRecord), http.ProxyFromEnvironment)

	//Open a LogCache client to the log cache endpoint
	logCacheUrl := strings.Replace(cnsiRecord.APIEndpoint.String(), "api.sys.", "log-cache.sys.", 1)
	slog.Debug("Creating the LogCache client", "url", logCacheUrl)
	ac.logCacheClient = logcache.NewClient(logCacheUrl, logcache.WithHTTPClient(
		NewLogCacheHttpClient(func() string {
			return ac.authToken
		})),
	)

	return ac, nil
}

// Attempts to relay the recent logs, if we get an unauthorized error we will refresh the auth token and retry once
func relayRecentLogsFromCache(relay func(msg *events.LogMessage), ac *AuthorizedConsumer, appGUID string) error {
	logLineRequestCount := 1000
	var envelopes []*loggregator_v2.Envelope
	var err error

	for logLineRequestCount >= 1 {
		envelopes, err = ac.logCacheClient.Read(
			context.Background(),
			appGUID,
			time.Time{},
			logcache.WithEnvelopeTypes(logcache_v1.EnvelopeType_LOG),
			logcache.WithLimit(logLineRequestCount),
		)
		if err != nil && err.Error() == "unexpected status code 429" {
			err = ac.refreshToken()
			if err != nil {
				return fmt.Errorf("cannot refresh token when reading from cache again cause %v", err)
			}
			err = nil
			continue
		}
		if err == nil || err.Error() != "unexpected status code 429" {
			break
		}
		logLineRequestCount /= 2
	}
	if err != nil {
		return fmt.Errorf("failed to retrieve logs from Log Cache: %s", err)
	}

	for _, envelope := range envelopes {
		logEnvelope, ok := envelope.GetMessage().(*loggregator_v2.Envelope_Log)
		if !ok {
			continue
		}
		log := logEnvelope.Log
		relay(&events.LogMessage{
			Message: log.Payload,
			MessageType: func(t loggregator_v2.Log_Type) *events.LogMessage_MessageType {
				var r events.LogMessage_MessageType
				switch t {
				case loggregator_v2.Log_OUT:
					r = events.LogMessage_OUT
				case loggregator_v2.Log_ERR:
					r = events.LogMessage_ERR
				}
				return &r
			}(log.Type),
			Timestamp:      func(i int64) *int64 { return &i }(envelope.GetTimestamp()),
			AppId:          &appGUID,
			SourceType:     func(s string) *string { return &s }(envelope.GetTags()["source_type"]),
			SourceInstance: &envelope.InstanceId,
		})
	}

	return err
}

func drainErrors(errorChan <-chan error) {
	for err := range errorChan {
		// Note: we receive a nil error before the channel is closed so check here...
		if err != nil {
			slog.Error("Received an error from Doppler", "err", err)
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

func appStreamHandler(echoContext *echo.Context, ac *AuthorizedConsumer, clientWebSocket *websocket.Conn) error {
	// Get the CNSI and app IDs from route parameters
	cnsiGUID := echoContext.Param("cnsiGuid")
	appGUID := echoContext.Param("appGuid")

	slog.Info("Received a request for an app log stream", "app", appGUID, "cnsi", cnsiGUID)
	// Reusable closure to pump messages from Noaa to the client WebSocket
	// N.B. We convert protobuf messages to JSON for ease of use in the frontend
	relayLogMsg := func(msg *events.LogMessage) {
		if jsonMsg, err := json.Marshal(msg); err != nil {
			slog.Error("Received an unparsable message from Doppler", "message", jsonMsg, "err", err)
		} else {
			err := api.WriteText(clientWebSocket, jsonMsg)
			if err != nil {
				slog.Error("Error writing data to the WebSocket", "err", err)
			}
		}
	}

	/*
	 * Split into two parts…
	 *   1. LogCache Read for recent logs - inspired by CF CLI in order to replace noaa RecentLogs
	 *      https://github.com/cloudfoundry/stratos/issues/5037
	 *   2. Stream subsequent logs as before
	 */
	err := relayRecentLogsFromCache(relayLogMsg, ac, appGUID)
	if err != nil {
		slog.Error("Cannot relay the recent logs via the cache", "app", appGUID, "err", err)
	}

	msgChan, errorChan := ac.consumer.TailingLogs(appGUID, ac.authToken)

	// Process the app stream
	go drainErrors(errorChan)
	go drainLogMessages(msgChan, relayLogMsg)

	slog.Info("Now streaming the app log", "app", appGUID, "cnsi", cnsiGUID)
	return nil
}

func firehoseStreamHandler(echoContext *echo.Context, ac *AuthorizedConsumer, clientWebSocket *websocket.Conn) error {
	slog.Debug("firehose")

	// Get the CNSI and app IDs from route parameters
	cnsiGUID := echoContext.Param("cnsiGuid")

	slog.Info("Received a request for a Firehose stream", "cnsi", cnsiGUID)

	userGUID := echoContext.Get("user_id").(string)
	firehoseSubscriptionId := userGUID + "@" + strconv.FormatInt(time.Now().UnixNano(), 10)
	slog.Debug("Connecting the Firehose", "subscription", firehoseSubscriptionId)

	eventChan, errorChan := ac.consumer.Firehose(firehoseSubscriptionId, ac.authToken)

	// Process the app stream
	go drainErrors(errorChan)
	go drainFirehoseEvents(eventChan, func(msg *events.Envelope) {
		if jsonMsg, err := json.Marshal(msg); err != nil {
			slog.Error("Received an unparsable message from Doppler", "message", jsonMsg, "err", err)
		} else {
			err := api.WriteText(clientWebSocket, jsonMsg)
			if err != nil {
				slog.Error("Error writing data to the WebSocket", "err", err)
			}
		}
	})

	slog.Info("Firehose connected and streaming", "cnsi", cnsiGUID, "subscription", firehoseSubscriptionId)
	return nil
}
