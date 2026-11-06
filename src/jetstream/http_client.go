package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"syscall"
	"time"
)

var (
	// Standard clients
	httpClient        = http.Client{}
	httpClientSkipSSL = http.Client{}
	// Clients to use typically for mutating operations - typically allow a longer request timeout
	httpClientMutating        = http.Client{}
	httpClientMutatingSkipSSL = http.Client{}

	defaultHTTPClientTimeout           int64
	defaultHTTPClientMutatingTimeout   int64
	defaultHTTPClientConnectionTimeout int64
)

func initializeHTTPClients(timeout int64, timeoutMutating int64, connectionTimeout int64) {
	slog.Debug("initializeHTTPClients")

	// Apply sensible defaults when not configured via environment variables
	if timeout <= 0 {
		timeout = 60
	}
	if timeoutMutating <= 0 {
		timeoutMutating = 120
	}
	if connectionTimeout <= 0 {
		connectionTimeout = 10
	}

	// Store default timeouts for when we create a client when a CA Cert is used
	defaultHTTPClientTimeout = timeout
	defaultHTTPClientMutatingTimeout = timeoutMutating
	defaultHTTPClientConnectionTimeout = connectionTimeout

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
		Timeout:   time.Duration(defaultHTTPClientConnectionTimeout) * time.Second,
		KeepAlive: 30 * time.Second, // should be less than any proxy connection timeout (typically 2-3 minutes)
	}).DialContext

	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     tlsConfig,
		MaxIdleConnsPerHost: 20, // Increased from 6 to handle burst parallel API requests
	}

	return tr
}

func (p *portalProxy) GetHttpClient(skipSSLValidation bool, caCert string) http.Client {
	return p.getHttpClient(skipSSLValidation, caCert, false)
}

// guardedDialControl refuses connections to loopback and link-local
// addresses (link-local covers the 169.254.169.254 cloud metadata
// endpoint). It runs after DNS resolution on the concrete IP about to be
// dialed, so a hostname that rebinds to a blocked address is still caught.
func guardedDialControl(network, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return err
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return fmt.Errorf("refusing to dial unresolvable address %q", address)
	}
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return fmt.Errorf("refusing to connect to blocked address %s", ip)
	}
	return nil
}

// GetGuardedHttpClient returns an Http Client that refuses to connect to
// loopback or link-local addresses. Use it wherever the backend fetches a
// URL supplied by the caller (Kube API cert probe, Helm chart download) so
// an operator cannot turn the request into SSRF against internal or cloud
// metadata services. Private (RFC1918) ranges are deliberately allowed —
// Kubernetes API servers legitimately live there.
func (p *portalProxy) GetGuardedHttpClient(skipSSLValidation bool) http.Client {
	dialer := &net.Dialer{
		Timeout:   time.Duration(defaultHTTPClientConnectionTimeout) * time.Second,
		KeepAlive: 30 * time.Second,
		Control:   guardedDialControl,
	}
	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dialer.DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: skipSSLValidation},
		MaxIdleConnsPerHost: 20,
	}
	return http.Client{
		Transport: tr,
		Timeout:   time.Duration(defaultHTTPClientTimeout) * time.Second,
	}
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
		// TODO: Remove
		slog.Warn("Using HTTP client with CA Cert")
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
	rootCAs, err := x509.SystemCertPool()

	if rootCAs == nil || err != nil {
		rootCAs = x509.NewCertPool()
	}

	// Append our cert to the system pool
	if ok := rootCAs.AppendCertsFromPEM([]byte(caCert)); !ok {
		slog.Warn("Could not append the CA - using system certs only")
	}

	config := &tls.Config{
		InsecureSkipVerify: false,
		RootCAs:            rootCAs,
	}

	tr := createTransport(config)
	client := &http.Client{Transport: tr}
	if mutating {
		client.Timeout = time.Duration(defaultHTTPClientTimeout) * time.Second
	} else {
		client.Timeout = time.Duration(defaultHTTPClientMutatingTimeout) * time.Second
	}
	return client
}
