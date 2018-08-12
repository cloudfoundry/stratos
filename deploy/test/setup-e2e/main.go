package main

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/SUSE/stratos-ui/plugins/setupe2e"
	log "github.com/Sirupsen/logrus"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
	yaml "gopkg.in/yaml.v2"
)

var (
	verbose          = kingpin.Flag("verbose", "Verbose mode.").Short('v').Bool()
	configPath       = kingpin.Arg("config", "path of the config to apply").Required().String()
	setupEndpoint    = kingpin.Flag("up", "Bring CF up").Bool()
	teardownEndpoint = kingpin.Flag("down", "Bring down CF").Short('d').Bool()
)

func main() {

	kingpin.Parse()
	setupE2E := &setupe2e.SetupE2EHelper{}

	config, err := getConfig()
	if err != nil {
		log.Errorf("Unable to fetch Config due to %s", err)
		os.Exit(1)
	}

	if *setupEndpoint {
		// Cleanup any previous state in the CF
		err = setupE2E.TearDownEndpointForFixture(config.Endpoint, config.Fixture, true)
		if err != nil {
			log.Errorf("Failed to tear down setup due to %s", err)
			os.Exit(1)
		}

		err = setupE2E.SetupEndpointForFixture(config.Endpoint, config.Fixture)
		if err != nil {
			log.Errorf("Failed to setup due to %s", err)
			os.Exit(1)
		}

	}

	if *teardownEndpoint {
		setupE2E.TearDownEndpointForFixture(config.Endpoint, config.Fixture, false)
	}
}

func getConfig() (*setupe2e.Config, error) {

	f, err := ioutil.ReadFile(*configPath)
	if err != nil {
		return nil, fmt.Errorf("Unable to read config file due to %s", err)
	}

	config := &setupe2e.Config{}
	err = yaml.Unmarshal(f, config)
	if err != nil {
		return nil, fmt.Errorf("Unable to parse config.yaml due to %s", err)
	}
	return config, nil
}
