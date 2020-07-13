package desktop

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"os/user"
	"path/filepath"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// CFConfigFile represents the data we need for CF config file
type CFConfigFile struct {
	APIEndpoint            string `json:"Target"`
	AuthorizationEndpoint  string `json:"AuthorizationEndpoint"`
	TokenEndpoint          string `json:"UaaEndpoint"`
	DopplerLoggingEndpoint string `json:"DopplerEndPoint"`
	SkipSSLValidation      bool   `json:"SSLDisabled"`
	ClientID               string `json:"UAAOAuthClient"`
	ClientSecret           string `json:"UAAOAuthClientSecret"`
	AccessToken            string `json:"AccessToken"`
	RefreshToken           string `json:"RefreshToken"`
}

// ListCloudFoundry will list Cloud Foundry endpoints configured locally (can be only one)
func ListCloudFoundry() ([]*interfaces.CNSIRecord, error) {
	cfg, apiEndpoint, err := readCFFile()
	if err != nil {
		return nil, err
	}

	eps := make([]*interfaces.CNSIRecord, 1)
	eps[0] = &interfaces.CNSIRecord{
		GUID:                   getEndpointGUID(cfg.APIEndpoint),
		Name:                   "CF",
		CNSIType:               "cf",
		APIEndpoint:            apiEndpoint,
		AuthorizationEndpoint:  cfg.AuthorizationEndpoint,
		DopplerLoggingEndpoint: cfg.DopplerLoggingEndpoint,
		TokenEndpoint:          cfg.TokenEndpoint,
		SkipSSLValidation:      cfg.SkipSSLValidation,
		SSOAllowed:             false,
		ClientId:               cfg.ClientID,
		ClientSecret:           cfg.ClientSecret,
		Local:                  true,
	}
	return eps, nil
}

// ListConnectedCloudFoundry will list Cloud Foundry endpoints configured locally (can be only one)
func ListConnectedCloudFoundry() ([]*interfaces.ConnectedEndpoint, error) {
	cfg, apiEndpoint, err := readCFFile()
	if err != nil {
		return nil, err
	}

	//TODO: Token expiry
	eps := make([]*interfaces.ConnectedEndpoint, 1)
	eps[0] = &interfaces.ConnectedEndpoint{
		GUID:                   getEndpointGUID(cfg.APIEndpoint),
		Name:                   "CF",
		CNSIType:               "cf",
		APIEndpoint:            apiEndpoint,
		Account:                "local",
		TokenExpiry:            20000,
		AuthorizationEndpoint:  cfg.AuthorizationEndpoint,
		DopplerLoggingEndpoint: cfg.DopplerLoggingEndpoint,
		SkipSSLValidation:      cfg.SkipSSLValidation,
		Local:                  true,
	}
	return eps, nil
}

func readCFFile() (*CFConfigFile, *url.URL, error) {

	var url *url.URL
	usr, err := user.Current()
	if err != nil {
		return nil, url, err
	}

	cfFile := filepath.Join(usr.HomeDir, ".cf", "config.json")

	// Check we can unmarshall the request
	data, err := ioutil.ReadFile(cfFile)
	if err != nil {
		return nil, url, fmt.Errorf("Can not read Cloud Foundry config file: %s", err)
	}

	config := &CFConfigFile{}
	if err = json.Unmarshal(data, config); err != nil {
		return nil, url, fmt.Errorf("Can not parse Cloud Foundry config file: %s", err)
	}

	url, err = url.Parse(config.APIEndpoint)
	if err != nil {
		return nil, url, err
	}
	return config, url, nil
}

func updateCFFIle(updates map[string]string) error {
	usr, err := user.Current()
	if err != nil {
		return err
	}

	cfFile := filepath.Join(usr.HomeDir, ".cf", "config.json")

	// Check we can unmarshall the request
	data, err := ioutil.ReadFile(cfFile)
	if err != nil {
		return fmt.Errorf("Can not read Cloud Foundry config file: %s", err)
	}

	file, err := os.Open(cfFile)
	if err != nil {
		return err
	}
	defer file.Close()
	stats, err := file.Stat()
	if err != nil {
		return err
	}

	var config map[string]interface{}
	if err = json.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("Can not parse Cloud Foundry config file: %s", err)
	}

	for k, v := range updates {
		config[k] = v
	}

	data, err = json.Marshal(config)
	if err != nil {
		return err
	}

	ioutil.WriteFile(cfFile, data, stats.Mode())
	return nil
}
