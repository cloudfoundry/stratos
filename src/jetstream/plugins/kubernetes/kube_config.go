package kubernetes

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"reflect"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	log "github.com/sirupsen/logrus"

	"gopkg.in/yaml.v2"

	"github.com/SermoDigital/jose/jws"
)

type KubeConfigClusterDetail struct {
	Server string `yaml:"server"`
}

type KubeConfigCluster struct {
	Name    string `yaml:"name"`
	Cluster struct {
		Server string
	}
}

type KubeConfigAuthProviderOIDC struct {
	ClientID     string `yaml:"client-id"`
	ClientSecret string `yaml:"client-secret"`
	IDToken      string `yaml:"id-token"`
	IdpIssuerURL string `yaml:"idp-issuer-url"`
	RefreshToken string `yaml:"refresh-token"`
	Expiry       time.Time
}

type KubeConfigUser struct {
	Name string `yaml:"name"`
	User struct {
		AuthProvider struct {
			Name   string                 `yaml:"name"`
			Config map[string]interface{} `yaml:"config"`
		} `yaml:"auth-provider,omitempty"`
		ClientCertificate string `yaml:"client-certificate-data,omitempty"`
		ClientKeyData     string `yaml:"client-key-data,omitempty"`
		Token             string `yaml:"token,omitempty"`
	}
}

func (k *KubeConfigUser) isOIDCAuth() bool {
	if k.User.AuthProvider.Name != "oidc" {
		return false
	}
	return true
}
func (k *KubeConfigUser) isAKSAuth() bool {
	if k.User.ClientCertificate == "" ||
		k.User.ClientKeyData == "" ||
		k.User.Token == "" {
		return false
	}
	return true
}

func (k *KubeConfigUser) getOIDCConfig() (*KubeConfigAuthProviderOIDC, error) {

	if !k.isOIDCAuth() {
		return nil, errors.New("User doesn't use OIDC")
	}
	OIDCConfig := &KubeConfigAuthProviderOIDC{}
	err := unMarshalHelper(k.User.AuthProvider.Config, OIDCConfig)
	if err != nil {
		log.Info(err)
		return nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}

	token, err := jws.ParseJWT([]byte(OIDCConfig.IDToken))
	if err != nil {
		log.Info(err)
		return nil, errors.New("Can not parse JWT Access token")
	}

	expiry, ok := token.Claims().Expiration()
	if !ok {
		return nil, errors.New("Can not get Acces Token expiry time")
	}
	OIDCConfig.Expiry = expiry

	return OIDCConfig, nil
}

func (k *KubeConfigUser) getAKSAuthConfig() (*KubeCertAuth, error) {

	if !k.isAKSAuth() {
		return nil, errors.New("User doesn't use AKS")
	}

	cert, err := base64.StdEncoding.DecodeString(k.User.ClientCertificate)
	if err != nil {
		return nil, errors.New("Unable to decode certificate")
	}
	certKey, err := base64.StdEncoding.DecodeString(k.User.ClientKeyData)
	if err != nil {
		return nil, errors.New("Unable to decode certificate key")
	}
	kubeCertAuth := &KubeCertAuth{
		Certificate:    string(cert),
		CertificateKey: string(certKey),
		Token:          k.User.Token,
	}
	return kubeCertAuth, nil
}

//ExtraScopes string `yaml:"extra-scopes"`

type KubeConfigContexts struct {
	Context struct {
		Cluster string
		User    string
	} `yaml:"context"`
}

type KubeConfigFile struct {
	ApiVersion string               `yaml:"apiVersion"`
	Kind       string               `yaml:"kind"`
	Clusters   []KubeConfigCluster  `yaml:"clusters"`
	Users      []KubeConfigUser     `yaml:"users"`
	Contexts   []KubeConfigContexts `yaml:"contexts"`
}

func (k *KubeConfigFile) GetClusterByAPIEndpoint(endpoint string) (*KubeConfigCluster, error) {
	for _, cluster := range k.Clusters {
		if cluster.Cluster.Server == endpoint {
			return &cluster, nil
		}
	}
	return nil, fmt.Errorf("Unable to find cluster")
}

func (k *KubeConfigFile) GetClusterContext(clusterName string) (*KubeConfigContexts, error) {
	for _, context := range k.Contexts {
		if context.Context.Cluster == clusterName {
			return &context, nil
		}
	}
	return nil, fmt.Errorf("Unable to find context")
}

func (k *KubeConfigFile) GetUser(userName string) (*KubeConfigUser, error) {
	for _, user := range k.Users {
		if user.Name == userName {
			return &user, nil
		}
	}
	return nil, fmt.Errorf("Unable to find user")
}

func (k *KubeConfigFile) GetUserForCluster(clusterEndpoint string) (*KubeConfigUser, error) {
	cluster, err := k.GetClusterByAPIEndpoint(clusterEndpoint)

	if err != nil {
		return nil, errors.New("Unable to find cluster in kubeconfig")
	}

	clusterName := cluster.Name

	if clusterName == "" {
		return nil, errors.New("Unable to find cluster")
	}

	context, err := k.GetClusterContext(clusterName)
	if err != nil {
		return nil, errors.New("Unable to find cluster context")
	}

	kubeConfigUser, err := k.GetUser(context.Context.User)
	if err != nil {
		return nil, errors.New("Can not find config for Kubernetes cluster")
	}

	return kubeConfigUser, nil
}

func (p *KubernetesSpecification) parseKubeConfig(kubeConfigData []byte) (*KubeConfigFile, error) {

	kubeConfig := &KubeConfigFile{}
	err := yaml.Unmarshal(kubeConfigData, &kubeConfig)
	if err != nil {
		return nil, err
	}
	if kubeConfig.ApiVersion != "v1" || kubeConfig.Kind != "Config" {
		return nil, errors.New("Not a valid Kubernetes Config file")
	}

	return kubeConfig, nil
}

func (p *KubernetesSpecification) FetchKubeConfigTokenOIDC(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {

	req := c.Request().(*standard.Request).Request

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig, err := p.parseKubeConfig(body)

	kubeConfigUser, err := kubeConfig.GetUserForCluster(cnsiRecord.APIEndpoint.String())

	if err != nil {
		return nil, nil, fmt.Errorf("Unable to find cluster in kubeconfig")
	}

	// We only support OIDC auth provider at the moment
	if kubeConfigUser.User.AuthProvider.Name != "oidc" {
		return nil, nil, errors.New("Unsupported authentication provider")
	}

	oidcConfig, err := kubeConfigUser.getOIDCConfig()
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}
	tokenRecord := p.portalProxy.InitEndpointTokenRecord(oidcConfig.Expiry.Unix(), oidcConfig.IDToken, oidcConfig.RefreshToken, false)
	tokenRecord.AuthType = interfaces.AuthTypeOIDC

	oauthMetadata := &interfaces.OAuth2Metadata{}
	oauthMetadata.ClientID = oidcConfig.ClientID
	oauthMetadata.ClientSecret = oidcConfig.ClientSecret
	oauthMetadata.IssuerURL = oidcConfig.IdpIssuerURL

	jsonString, err := json.Marshal(oauthMetadata)
	if err == nil {
		tokenRecord.Metadata = string(jsonString)
	}

	// Could try and make a K8S Api call to validate the token
	// Or, maybe we can verify the access token with the auth URL ?

	return &tokenRecord, &cnsiRecord, nil
}

func (p *KubernetesSpecification) FetchKubeConfigTokenAKS(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {

	req := c.Request().(*standard.Request).Request

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig, err := p.parseKubeConfig(body)

	kubeConfigUser, err := kubeConfig.GetUserForCluster(cnsiRecord.APIEndpoint.String())
	if err != nil {
		return nil, nil, errors.New("Unable to find cluster in kubeconfig")
	}

	authConfig, err := kubeConfigUser.getAKSAuthConfig()
	if err != nil {
		return nil, nil, errors.New("User doesn't use AKS auth")
	}

	jsonString, err := authConfig.GetJSON()
	if err != nil {
		return nil, nil, err
	}
	// Refresh token isn't required since the AccessToken will never expire
	refreshToken := jsonString

	accessToken := jsonString
	// Indefinite expiry
	expiry := time.Now().Local().Add(time.Hour * time.Duration(100000))

	tokenRecord := p.portalProxy.InitEndpointTokenRecord(expiry.Unix(), accessToken, refreshToken, false)
	tokenRecord.AuthType = AuthConnectTypeKubeConfigAz

	return &tokenRecord, &cnsiRecord, nil
}

func unMarshalHelper(values map[string]interface{}, intf interface{}) error {

	value := reflect.ValueOf(intf)

	if value.Kind() != reflect.Ptr {
		return errors.New("config: must provide pointer to struct value")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("config: must provide pointer to struct value")
	}

	nFields := value.NumField()
	typ := value.Type()

	for i := 0; i < nFields; i++ {
		field := value.Field(i)
		strField := typ.Field(i)
		tag := strField.Tag.Get("yaml")
		if tag == "" {
			continue
		}

		if tagValue, ok := values[tag].(string); ok {
			if err := config.SetStructFieldValue(value, field, tagValue); err != nil {
				return err
			}
		}
	}

	return nil
}
