package kubernetes

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"time"

	// "github.com/SermoDigital/jose/jws"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/aws/aws-sdk-go/aws/credentials"
)

type KubeCertAuth struct {
	Certificate    string `json:"cert"`
	CertificateKey string `json:"certKey"`
}

func (k *KubeCertAuth) GetJSON() (string, error) {
	jsonString, err := json.Marshal(k)
	if err != nil {
		return "", err
	}
	return string(jsonString), nil
}

func (c *AWSIAMUserInfo) Retrieve() (credentials.Value, error) {
	return credentials.Value{
		AccessKeyID:     c.AccessKey,
		SecretAccessKey: c.SecretKey,
	}, nil
}

func (c *AWSIAMUserInfo) IsExpired() bool {
	return true
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
	refreshToken := ""

	accessToken := jsonString

	// Tokens last forever
	expiry := time.Now().Local().Add(time.Hour * time.Duration(math.MaxInt64))
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

	authHandler := c.portalProxy.OAuthHandlerFunc(cnsiRequest, req, c.RefreshIAMToken)
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *KubernetesSpecification) RefreshCertAuth(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshCertAuth")

	userToken, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	// Refresh token is the IAM info
	var iamInfo AWSIAMUserInfo
	err = json.Unmarshal([]byte(userToken.RefreshToken), &iamInfo)
	if err != nil {
		return userToken, fmt.Errorf("Could not get the IAM info from the refresh token: %v+", err)
	}

	token, err := c.getTokenIAM(iamInfo)
	if err != nil {
		return userToken, fmt.Errorf("Could not get new token using the IAM info: %v+", err)
	}

	userToken.AuthToken = token
	return userToken, nil
}
