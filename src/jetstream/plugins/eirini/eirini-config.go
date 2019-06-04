package eirini

import (
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"

	"github.com/govau/cf-common/env"
)

// Config represents the configuration required
type Config struct {
	Enabled      bool   `configName:"EIRINI"`
	PodNamespace string `configName:"EIRINI_POD_NAMESPACE"`
}

// LoadConfig loads the configuration for inviting users
func (eirini *Eirini) LoadConfig(env env.VarSet) (*Config, error) {

	c := &Config{}

	if err := config.Load(c, env.Lookup); err != nil {
		return c, fmt.Errorf("Unable to load eirini configuration. %v", err)
	}

	return c, nil
}
