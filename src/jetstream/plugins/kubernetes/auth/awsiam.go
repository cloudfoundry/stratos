package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	// "github.com/SermoDigital/jose/jws"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sts"
	"sigs.k8s.io/aws-iam-authenticator/pkg/token"
)

// AWSIAMUserInfo is the user info needed to connect to AWS Kubernetes
type AWSIAMUserInfo struct {
	Cluster   string `json:"cluster"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
}

// AWSKubeAuth is AWS IAM Authentication for Kubernetes
type AWSKubeAuth struct {
	portalProxy api.PortalProxy
}

const authConnectTypeAWSIAM = "aws-iam"

// InitAWSKubeAuth creates a GKEKubeAuth
func InitAWSKubeAuth(portalProxy api.PortalProxy) KubeAuthProvider {
	return &AWSKubeAuth{portalProxy: portalProxy}
}

// GetName returns the Auth Provider name
func (c *AWSKubeAuth) GetName() string {
	return authConnectTypeAWSIAM
}

func (c *AWSKubeAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
	awsInfo := &AWSIAMUserInfo{}
	err := json.Unmarshal([]byte(tokenRec.RefreshToken), &awsInfo)
	if err != nil {
		return err
	}

	// NOTE: We really should check first to see if the token has expired before we try and get another

	// Get an access token
	token, err := c.getTokenIAM(*awsInfo)
	if err != nil {
		return fmt.Errorf("Could not get new token using the IAM info: %v+", err)
	}

	info.Token = token
	return nil
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

func (c *AWSKubeAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
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
	tokenRecord.AuthType = authConnectTypeAWSIAM
	return &tokenRecord, &cnsiRecord, nil
}

func (c *AWSKubeAuth) GetUserFromToken(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	return &api.ConnectedUser{
		GUID: "AWS IAM",
		Name: "IAM",
	}, true
}

func (c *AWSKubeAuth) getTokenIAM(info AWSIAMUserInfo) (string, error) {
	generator, err := token.NewGenerator(false, false)
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
	tok, err := generator.GetWithSTS(info.Cluster, stsAPI)
	if err != nil {
		return "", fmt.Errorf("AWS IAM: Failed to get token due to: %+v ", err)
	}

	// Got the token
	return tok.Token, nil
}

func (c *AWSKubeAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
		Handler:  c.DoFlowRequest,
		UserInfo: c.GetUserFromToken,
	})
}

func (c *AWSKubeAuth) DoFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doAWSIAMFlowRequest")

	authHandler := c.portalProxy.OAuthHandlerFunc(cnsiRequest, req, c.RefreshIAMToken)
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *AWSKubeAuth) RefreshIAMToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t api.TokenRecord, err error) {
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
