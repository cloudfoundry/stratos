package kubernetes

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	// "github.com/SermoDigital/jose/jws"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sts"
	"github.com/kubernetes-sigs/aws-iam-authenticator/pkg/token"
)

type AWSIAMUserInfo struct {
	Cluster   string `json:"cluster"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
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

func (c *KubernetesSpecification) FetchIAMToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {
	log.Debug("FetchIAMToken")

	// Place the IAM properties into a JSON Struct and store that in the Refresh Token
	// Then use the refresh method to get a current access token
	cluster := ec.FormValue("cluster")
	accessKey := ec.FormValue("access_key")
	secretKey := ec.FormValue("secret_key")

	if len(cluster) == 0 || len(accessKey) == 0 || len(secretKey) == 0 {
		return nil, nil, errors.New("Need cluster, access key and secret key")
	}

	info := AWSIAMUserInfo{
		Cluster:   cluster,
		AccessKey: accessKey,
		SecretKey: secretKey,
	}

	jsonString, err := json.Marshal(info)
	if err != nil {
		return nil, nil, err
	}

	refreshToken := string(jsonString)

	// Use the AWS IAM library to get a token
	accessToken, err := c.getTokenIAM(info)

	// Tokens last 15 minutes
	expiry := time.Now().Local().Add(time.Minute * time.Duration(15))

	tokenRecord := c.portalProxy.InitEndpointTokenRecord(expiry.Unix(), accessToken, refreshToken, false)
	tokenRecord.AuthType = AuthConnectTypeAWSIAM
	return &tokenRecord, &cnsiRecord, nil
}

func (c *KubernetesSpecification) GetCNSIUserFromIAMToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: "AWS IAM",
		Name: "IAM",
	}, true
}

func (c *KubernetesSpecification) getTokenIAM(info AWSIAMUserInfo) (string, error) {
	generator, err := token.NewGenerator(false)
	if err != nil {
		return "", fmt.Errorf("AWS IAM: Failed to create generator due to %+v", err)
	}

	sess, err := session.NewSessionWithOptions(session.Options{
		AssumeRoleTokenProvider: token.StdinStderrTokenProvider,
		SharedConfigState:       session.SharedConfigEnable,
	})
	if err != nil {
		return "", fmt.Errorf("AWS IAM: Failed to create new session %+v", err)
	}

	creds := credentials.NewCredentials(&info)
	stsAPI := sts.New(sess, &aws.Config{Credentials: creds})
	token, err := generator.GetWithSTS(info.Cluster, stsAPI)
	if err != nil {
		return "", fmt.Errorf("AWS IAM: Failed to get token due to: %+v ", err)
	}

	// Got the token
	return token, nil
}

func (c *KubernetesSpecification) doAWSIAMFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doAWSIAMFlowRequest")

	authHandler := c.portalProxy.OAuthHandlerFunc(cnsiRequest, req, c.RefreshIAMToken)
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *KubernetesSpecification) RefreshIAMToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshIAMToken")

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
