package main

import (
	"fmt"
	"io/ioutil"

	yaml "gopkg.in/yaml.v2"
)

type Config struct {
	Endpoints []Endpoint    `yaml:"endpoints"`
	Fixture   FixtureConfig `yaml:"fixture"`
}

type Endpoint struct {
	Url               string `yaml:"url"`
	SkipSSLValidation bool   `yaml:"skip-ssl"`
	AdminUser         User   `yaml:"admin-user"`
}

type FixtureConfig struct {
	NonAdminUser User          `yaml:"non-admin-user"`
	Organization string        `yaml:"organization"`
	Space        string        `yaml:"space"`
	Services     ServiceConfig `yaml:"services"`
}

type User struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type ServiceConfig struct {
	PublicService             string `yaml:"public-service"`
	PrivateService            string `yaml:"private-service"`
	PrivateSpaceScopedService string `yaml:"space-scoped-service"`
}

func (e2e *E2ESetupHelper) getConfig() (*Config, error) {

	f, err := ioutil.ReadFile("config.yaml")
	if err != nil {
		return nil, fmt.Errorf("Unable to read config file", err)
	}

	config := &Config{}
	err = yaml.Unmarshal(f, config)
	if err != nil {
		return nil, fmt.Errorf("Unable to parse config.yaml", err)
	}
	return config, nil
}
