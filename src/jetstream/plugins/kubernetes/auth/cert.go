package auth

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	// "github.com/SermoDigital/jose/jws"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const authConnectTypeCertAuth = "kube-cert-auth"

// CertKubeAuth is GKE Authentication with Certificates
type CertKubeAuth struct {
	portalProxy interfaces.PortalProxy
}

// InitCertKubeAuth creates a GKEKubeAuth
func InitCertKubeAuth(portalProxy interfaces.PortalProxy) *CertKubeAuth {
	return &CertKubeAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *CertKubeAuth) GetName() string {
	return authConnectTypeCertAuth
}

func (c *CertKubeAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	kubeAuthToken := &KubeCertificate{}
	err := json.NewDecoder(strings.NewReader(tokenRec.AuthToken)).Decode(kubeAuthToken)
	if err != nil {
		return err
	}

	info.ClientCertificateData = []byte(kubeAuthToken.Certificate)
	info.ClientKeyData = []byte(kubeAuthToken.CertificateKey)
	info.Token = kubeAuthToken.Token

	return nil
}

func (c *CertKubeAuth) extractCerts(ec echo.Context) (*KubeCertificate, error) {

	kubeCertAuth := &KubeCertificate{}

	bodyReader := ec.Request().Body
	defer bodyReader.Close()
	buf := new(bytes.Buffer)
	buf.ReadFrom(bodyReader)
	body := buf.String()
	firstColon := strings.IndexByte(body, ':')

	cert, err := base64.StdEncoding.DecodeString(body[:firstColon])
	if err != nil {
		return nil, err
	}
	certKey, err := base64.StdEncoding.DecodeString(body[firstColon+1:])
	if err != nil {
		return nil, err
	}

	kubeCertAuth.Certificate = string(cert)
	kubeCertAuth.CertificateKey = string(certKey)
	return kubeCertAuth, nil

}

func (c *CertKubeAuth) FetchToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {
	log.Debug("Kube Certs - FetchToken")

	kubeCertAuth, err := c.extractCerts(ec)
	if err != nil {
		return nil, nil, errors.New("Unable to find required certificate and certificate key")
	}

	jsonString, err := kubeCertAuth.GetJSON()
	if err != nil {
		return nil, nil, err
	}

	// Refresh token isn't required since the AccessToken will never expire
	refreshToken := jsonString

	accessToken := jsonString

	// Tokens lasts forever
	expiry := time.Now().Local().Add(time.Hour * time.Duration(100000))
	disconnected := false
	tokenRecord := c.portalProxy.InitEndpointTokenRecord(expiry.Unix(), accessToken, refreshToken, disconnected)
	tokenRecord.AuthType = authConnectTypeCertAuth
	return &tokenRecord, &cnsiRecord, nil
}

func (c *CertKubeAuth) GetUserFromToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: "Kube Cert Auth",
		Name: "Cert Auth",
	}, true
}

func (c *CertKubeAuth) DoFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doCertAuthFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {

		kubeAuthToken := &KubeCertificate{}
		err := json.NewDecoder(strings.NewReader(tokenRec.AuthToken)).Decode(kubeAuthToken)
		if err != nil {
			return nil, err
		}
		cert, err := kubeAuthToken.GetCerticate()
		if err != nil {
			return nil, err
		}
		dial := (&net.Dialer{
			Timeout:   time.Duration(30) * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial

		sslTransport := &http.Transport{
			Proxy:               http.ProxyFromEnvironment,
			Dial:                dial,
			TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: cnsi.SkipSSLValidation,
				Certificates:       []tls.Certificate{cert},
			},
			MaxIdleConnsPerHost: 6, // (default is 2)
		}

		kubeCertClient := http.Client{}
		kubeCertClient.Transport = sslTransport
		kubeCertClient.Timeout = time.Duration(30) * time.Second

		if kubeAuthToken.Token != "" {
			req.Header.Set("Authorization", "bearer "+kubeAuthToken.Token)
		}

		res, err := kubeCertClient.Do(req)

		kubeCertClient.CloseIdleConnections()

		if err != nil {
			return nil, fmt.Errorf("Request failed: %v", err)
		}

		if res.StatusCode != 401 {
			return res, nil
		}
		return res, fmt.Errorf("Request failed with status code: %d ", res.StatusCode)

	}
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *CertKubeAuth) RefreshCertAuth(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshCertAuth")
	// This shouldn't be called since cert-auth K8S shouldn't expire

	userToken, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	return userToken, nil
}

func (c *CertKubeAuth) RegisterJetstreamAuthType(portal interfaces.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), interfaces.AuthProvider{
		Handler:  c.DoFlowRequest,
		UserInfo: c.GetUserFromToken,
	})
}
