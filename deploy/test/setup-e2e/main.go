package main

import (
	"fmt"
	"os"
)

type E2ESetupHelper struct {
}

func main() {

	e2eSetup := &E2ESetupHelper{}

	config, err := e2eSetup.getConfig()
	if err != nil {
		fmt.Printf("Unable to fetch Config due to %s", err)
		os.Exit(1)
	}
	fmt.Printf("%+v", config)

	for _, endpoint := range config.Endpoints {
		e2eSetup.setupEndpoint(endpoint, config.Fixture)
	}

}
