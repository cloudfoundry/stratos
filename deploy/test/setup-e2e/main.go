package main

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/SUSE/stratos-ui/plugins/setupe2e"
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
		fmt.Printf("Unable to fetch Config due to %s", err)
		os.Exit(1)
	}

	if *setupEndpoint {
		setupE2E.SetupEndpointForFixture(config.Endpoint, config.Fixture)
	}

	if *teardownEndpoint {
		setupE2E.TearDownEndpointForFixture(config.Endpoint, config.Fixture)
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
