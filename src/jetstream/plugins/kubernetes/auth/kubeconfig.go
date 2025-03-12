package auth

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/config"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const AuthConnectTypeKubeConfig = "kubeconfig"

// KubeConfigAuth will look at the kube config file and use the appropriate auth provider

// KubeConfigAuth is same as OIDC with different name
type KubeConfigAuth struct {
	OIDCKubeAuth
}

// InitKubeConfigAuth
func InitKubeConfigAuth(portalProxy api.PortalProxy) KubeAuthProvider {
	return &KubeConfigAuth{*InitOIDCKubeAuth(portalProxy)}
}

func (c *KubeConfigAuth) GetName() string {
	return AuthConnectTypeKubeConfig
}

func (c *KubeConfigAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
	log.Error("KubeConfigAuth: AddAuthInfo: Not supported")
	return fmt.Errorf("Not supported: %s", tokenRec.AuthType)
}

func (c *KubeConfigAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
	log.Debug("FetchToken (KubeConfigAuth)")

	req := ec.Request()

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig, err := config.ParseKubeConfig(body)
	kubeConfigUser, err := kubeConfig.GetUserForCluster(cnsiRecord.APIEndpoint.String())
	if err != nil {
		return nil, nil, fmt.Errorf("Unable to find cluster in kubeconfig")
	}

	// OIDC ? == CaaSP V3
	if kubeConfigUser.User.AuthProvider.Name == "oidc" {
		return c.GetTokenFromKubeConfigUser(cnsiRecord, kubeConfigUser)
	}

	// Check for Certificate == CaaSP V4
	if len(kubeConfigUser.User.ClientCertificate) > 0 && len(kubeConfigUser.User.ClientKeyData) > 0 {
		return c.GetCertAuth(cnsiRecord, kubeConfigUser)
	}

	// Check for Token == CaaSP V4
	if len(kubeConfigUser.User.Token) > 0 {
		tokenRecord := NewKubeTokenAuthTokenRecord(c.portalProxy, kubeConfigUser.User.Token)

		// Could try and make a K8S Api call to validate the token
		// Or, maybe we can verify the access token with the auth URL ?
		return tokenRecord, &cnsiRecord, nil
	}

	return nil, nil, fmt.Errorf("OIDC: Unsupported authentication provider for user: %s", kubeConfigUser.User.AuthProvider.Name)
}

func (c *KubeConfigAuth) GetCertAuth(cnsiRecord api.CNSIRecord, user *config.KubeConfigUser) (*api.TokenRecord, *api.CNSIRecord, error) {

	kubeCertAuth := &KubeCertificate{}

	cert, err := base64.StdEncoding.DecodeString(user.User.ClientCertificate)
	if err != nil {
		return nil, nil, err
	}
	certKey, err := base64.StdEncoding.DecodeString(user.User.ClientKeyData)
	if err != nil {
		return nil, nil, err
	}

	kubeCertAuth.Certificate = string(cert)
	kubeCertAuth.CertificateKey = string(certKey)

	jsonString, err := kubeCertAuth.GetJSON()
	if err != nil {
		return nil, nil, err
	}

	// Refresh token isn't required since the AccessToken will never expire
	refreshToken := jsonString

	accessToken := jsonString

	// Tokens lasts forever
	disconnected := false

	tokenRecord := c.portalProxy.InitEndpointTokenRecord(getLargeExpiryTime(), accessToken, refreshToken, disconnected)
	tokenRecord.AuthType = authConnectTypeCertAuth
	return &tokenRecord, &cnsiRecord, nil
}

func (c *KubeConfigAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
		Handler:  c.portalProxy.DoOidcFlowRequest,
		UserInfo: nil,
	})
}

func getLargeExpiryTime() int64 {
	expiry := time.Now().Local().Add(time.Hour * time.Duration(100000))
	return expiry.Unix()
}
