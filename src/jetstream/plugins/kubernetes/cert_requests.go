package kubernetes

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
)

type KubeCertAuth struct {
	Certificate    string `json:"cert"`
	CertificateKey string `json:"certKey"`
	Token          string `json:"token,omitempty"`
}

func (k *KubeCertAuth) GetJSON() (string, error) {
	jsonString, err := json.Marshal(k)
	if err != nil {
		return "", err
	}
	return string(jsonString), nil
}
func (k *KubeCertAuth) GetCerticate() (tls.Certificate, error) {
	cert, err := tls.X509KeyPair([]byte(k.Certificate), []byte(k.CertificateKey))
	if err != nil {
		return tls.Certificate{}, err
	}
	return cert, nil
}

func (c *KubernetesSpecification) extractCerts(ec echo.Context) (*KubeCertAuth, error) {

	kubeCertAuth := &KubeCertAuth{}

	bodyReader := ec.Request().Body
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

func (c *KubernetesSpecification) FetchCertAuth(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {
	log.Info("FetchCerts")

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
	tokenRecord.AuthType = AuthConnectTypeCertAuth
	return &tokenRecord, &cnsiRecord, nil
}

func (c *KubernetesSpecification) GetCNSIUserFromCertAuth(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: "Kube Cert Auth",
		Name: "Cert Auth",
	}, true
}

func (c *KubernetesSpecification) doCertAuthFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doCertAuthFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {

		kubeAuthToken := &KubeCertAuth{}
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
				InsecureSkipVerify: true,
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

func (c *KubernetesSpecification) RefreshCertAuth(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshCertAuth")
	// This shouldn't be called since cert-auth K8S shouldn't expire

	userToken, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	return userToken, nil
}
