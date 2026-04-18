package main

import (
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func TestPortalConfigIncludesConcurrencyFields(t *testing.T) {
	config := api.PortalConfig{}
	config.EndpointCardConcurrency = 3
	config.EndpointRequestConcurrency = 5

	if config.EndpointCardConcurrency != 3 {
		t.Errorf("EndpointCardConcurrency not set: expected 3, got %d", config.EndpointCardConcurrency)
	}
	if config.EndpointRequestConcurrency != 5 {
		t.Errorf("EndpointRequestConcurrency not set: expected 5, got %d", config.EndpointRequestConcurrency)
	}
}

func TestInfoConfigurationIncludesConcurrencyFields(t *testing.T) {
	info := api.Info{}
	info.Configuration.EndpointCardConcurrency = 2
	info.Configuration.EndpointRequestConcurrency = 3

	if info.Configuration.EndpointCardConcurrency != 2 {
		t.Errorf("EndpointCardConcurrency not set on Info.Configuration: expected 2, got %d", info.Configuration.EndpointCardConcurrency)
	}
	if info.Configuration.EndpointRequestConcurrency != 3 {
		t.Errorf("EndpointRequestConcurrency not set on Info.Configuration: expected 3, got %d", info.Configuration.EndpointRequestConcurrency)
	}
}
