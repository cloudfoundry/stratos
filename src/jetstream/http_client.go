package main

import (
	"crypto/tls"
	"crypto/x509"
	"net"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"
)

var (
	// Standard clients
	httpClient        = http.Client{}
	httpClientSkipSSL = http.Client{}
	// Clients to use typically for mutating operations - typically allow a longer request timeout
	httpClientMutating        = http.Client{}
	httpClientMutatingSkipSSL = http.Client{}

	defaulHTTPClientTimeout           int64
	defaulHTTPClientMutatingTimeout   int64
	defaulHTTPClientCcnnectionTimeout int64
	defaultDialer                     net.Dialer
)

func initializeHTTPClients(timeout int64, timeoutMutating int64, connectionTimeout int64) {
	log.Debug("initializeHTTPClients")

	// Store defaut timeouts for when we create a client when a CA Cert is used
	defaulHTTPClientTimeout = timeout
	defaulHTTPClientMutatingTimeout = timeoutMutating
	defaulHTTPClientCcnnectionTimeout = connectionTimeout

	tr := createTransport(&tls.Config{InsecureSkipVerify: false})
	httpClient.Transport = tr
	httpClient.Timeout = time.Duration(timeout) * time.Second

	trSkipSSL := createTransport(&tls.Config{InsecureSkipVerify: true})
	httpClientSkipSSL.Transport = trSkipSSL
	httpClientSkipSSL.Timeout = time.Duration(timeout) * time.Second

	// Clients with longer timeouts (use for mutating operations)
	httpClientMutating.Transport = tr
	httpClientMutating.Timeout = time.Duration(timeoutMutating) * time.Second
	httpClientMutatingSkipSSL.Transport = trSkipSSL
	httpClientMutatingSkipSSL.Timeout = time.Duration(timeoutMutating) * time.Second
}

func createTransport(tlsConfig *tls.Config) *http.Transport {
	// Common KeepAlive dialer shared by transports
	dial := (&net.Dialer{
		Timeout:   time.Duration(defaulHTTPClientCcnnectionTimeout) * time.Second,
		KeepAlive: 30 * time.Second, // should be less than any proxy connection timeout (typically 2-3 minutes)
	}).Dial

	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     tlsConfig,
		MaxIdleConnsPerHost: 6, // (default is 2)
	}

	return tr
}

func (p *portalProxy) GetHttpClient(skipSSLValidation bool, caCert string) http.Client {
	return p.getHttpClient(skipSSLValidation, caCert, false)
}

// GetHttpClientForRequest returns an Http Client for the giving request
func (p *portalProxy) GetHttpClientForRequest(req *http.Request, skipSSLValidation bool, caCert string) http.Client {
	isMutating := req.Method != "GET" && req.Method != "HEAD"
	client := p.getHttpClient(skipSSLValidation, caCert, isMutating)

	// Is this is a long-running request, then use a different timeout
	if req.Header.Get(longRunningTimeoutHeader) == "true" {
		longRunningClient := http.Client{}
		longRunningClient.Transport = client.Transport
		longRunningClient.Timeout = time.Duration(p.GetConfig().HTTPClientTimeoutLongRunningInSecs) * time.Second
		return longRunningClient
	}

	return client
}

func (p *portalProxy) getHttpClient(skipSSLValidation bool, caCert string, mutating bool) http.Client {
	// We need to create a client with the specified CA Cert
	if len(caCert) > 0 {
		return *getHttpClientWIthCA(caCert, mutating)
	}
	var client http.Client
	if !mutating {
		if skipSSLValidation {
			client = httpClientSkipSSL
		} else {
			client = httpClient
		}
	} else {
		if skipSSLValidation {
			client = httpClientMutatingSkipSSL
		} else {
			client = httpClientMutating
		}
	}
	return client
}

func getHttpClientWIthCA(caCert string, mutating bool) *http.Client {
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}

	// Append our cert to the system pool
	if ok := rootCAs.AppendCertsFromPEM([]byte(caCert)); !ok {
		log.Warn("Could not append the CA - using system certs only")
	}

	config := &tls.Config{
		InsecureSkipVerify: false,
		RootCAs:            rootCAs,
	}

	tr := createTransport(config)
	client := &http.Client{Transport: tr}
	if mutating {
		client.Timeout = time.Duration(defaulHTTPClientTimeout) * time.Second
	} else {
		client.Timeout = time.Duration(defaulHTTPClientMutatingTimeout) * time.Second
	}
	return client
}
