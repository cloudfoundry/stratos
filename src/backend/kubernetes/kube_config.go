package kubernetes

import (
	// "bytes"
	// "encoding/json"
	// "fmt"
	// "io"
	"encoding/json"
	"errors"
	"io/ioutil"
	"reflect"

	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

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

type KubeConfigUser struct {
	Name string `yaml:"name"`
	User struct {
		AuthProvider struct {
			Name   string                 `yaml:"name"`
			Config map[string]interface{} `yaml:"config"`
		} `yaml:"auth-provider"`
	}
}

type KubeConfigAuthProviderOIDC struct {
	ClientID     string `yaml:"client-id"`
	ClientSecret string `yaml:"client-secret"`
	IDToken      string `yaml:"id-token"`
	IdpIssuerURL string `yaml:"idp-issuer-url"`
	RefreshToken string `yaml:"refresh-token"`
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

func (p *KubernetesSpecification) FetchKubeConfigToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {

	req := c.Request().(*standard.Request).Request

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig := KubeConfigFile{}
	err = yaml.Unmarshal(body, &kubeConfig)
	if err != nil {
		return nil, nil, err
	}

	// Verify that this is a Kube Config file
	if kubeConfig.ApiVersion != "v1" || kubeConfig.Kind != "Config" {
		return nil, nil, errors.New("Not a valid Kubernetes Config file")
	}

	// Find the config corresponding to our API Endpoint
	var name string
	for _, cluster := range kubeConfig.Clusters {
		if cluster.Cluster.Server == cnsiRecord.APIEndpoint.String() {
			name = cluster.Name
			break
		}
	}

	var userName string
	var user *KubeConfigUser

	log.Info(name)
	if len(name) > 0 {

		// Now find context to determine which user to use
		for _, context := range kubeConfig.Contexts {
			if context.Context.Cluster == name {
				userName = context.Context.User
				break
			}
		}

		if len(userName) > 0 {
			for _, u := range kubeConfig.Users {
				if u.Name == userName {
					user = &u
					break
				}
			}
		}
	}

	if user == nil {
		return nil, nil, errors.New("Can not find config for Kubernetes cluster")
	}

	// We onlt support OIDC auth provider at the moment
	if user.User.AuthProvider.Name != "oidc" {
		return nil, nil, errors.New("Unsupported authentication provider")
	}

	oidcConfig := KubeConfigAuthProviderOIDC{}
	err = unMarshalHelper(user.User.AuthProvider.Config, &oidcConfig)
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}

	// Decode the token and get the expiry time
	token, err := jws.ParseJWT([]byte(oidcConfig.IDToken))
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not parse JWT Access token")
	}
	log.Info(token)

	expiry, ok := token.Claims().Expiration()
	if !ok {
		return nil, nil, errors.New("Can not get Acces Token expiry time")
	}

	tokenRecord := p.portalProxy.InitEndpointTokenRecord(expiry.Unix(), oidcConfig.IDToken, oidcConfig.RefreshToken, false)
	tokenRecord.AuthType = interfaces.AuthTypeOAuth2

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

func unMarshalHelper(values map[string]interface{}, intf interface{}) error {

	log.Info(values)

	value := reflect.ValueOf(intf)

	if value.Kind() != reflect.Ptr {
		return errors.New("config: must provide pointer to struct value")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("config: must provide pointer to struct value")
	}

	// params := reflect.ValueOf(values).Elem()
	// log.Info(params)

	nFields := value.NumField()
	typ := value.Type()

	for i := 0; i < nFields; i++ {
		field := value.Field(i)
		strField := typ.Field(i)
		tag := strField.Tag.Get("yaml")
		if tag == "" {
			continue
		}

		log.Info(field)
		log.Info(tag)

		log.Info(values[tag])

		// paramValue:= params.FieldByName(tag)
		// log.Info(paramValue)
		// if paramValue != nil {
		// 	if err := config.SetStructFieldValue(value, field, paramValue.(string)); err != nil {
		// 		return err
		// 	}
		//}

		if tagValue, ok := values[tag].(string); ok {
			if err := config.SetStructFieldValue(value, field, tagValue); err != nil {
				return err
			}
		}
	}

	return nil
}
