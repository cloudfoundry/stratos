package config

import (
	"errors"
	"fmt"
	"reflect"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"

	"gopkg.in/yaml.v2"

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
		} `yaml:"auth-provider,omitempty"`
		ClientCertificate string `yaml:"client-certificate-data,omitempty"`
		ClientKeyData     string `yaml:"client-key-data,omitempty"`
		Token             string `yaml:"token,omitempty"`
	}
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

func ParseKubeConfig(kubeConfigData []byte) (*KubeConfigFile, error) {

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

func UnMarshalHelper(values map[string]interface{}, intf interface{}) error {

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
