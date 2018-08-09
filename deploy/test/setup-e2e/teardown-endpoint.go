package main

import (
	"fmt"
	"strings"

	cfclient "github.com/cloudfoundry-community/go-cfclient"
	uaa "github.com/cloudfoundry-community/go-uaa"
)

func (e2e *E2ESetupHelper) tearDownEndpoint(endpoint Endpoint, fixture FixtureConfig) error {
	uaaAPI, err := e2e.createUAAClient(endpoint)
	cfAPI, _ := e2e.createCFClent(endpoint)

	err = e2e.deleteUser(uaaAPI, fixture.NonAdminUser)
	if err != nil {
		fmt.Printf("Failed to delete user %+v", fixture.NonAdminUser)
		return err
	}

	err = e2e.deleteServiceBrokers(cfAPI, fixture)
	if err != nil {
		fmt.Printf("Failed to delete org due to %s", err)
		return err
	}

	err = e2e.deleteOrg(cfAPI, fixture)
	if err != nil {
		fmt.Printf("Failed to delete org due to %s", err)
		return err
	}
	return nil

}

func (e2e *E2ESetupHelper) deleteOrg(cfClient *cfclient.Client, fixture FixtureConfig) error {

	orgEntity, err := cfClient.GetOrgByName(fixture.Organization)
	if err != nil {
		fmt.Printf("Failed to get Org due to to %s, continuing", err)
		return nil
	}
	err = cfClient.DeleteOrg(orgEntity.Guid, true, false)
	if err != nil {
		return fmt.Errorf("Failed to get Org due to to %s", err)
	}
	return nil
}

func (e2e *E2ESetupHelper) deleteUser(uaaClient *uaa.API, userConfig User) error {

	// Create UAA user

	user, err := uaaClient.GetUserByUsername(userConfig.Username, "", "")
	if err != nil {
		return fmt.Errorf("Failed to create uaa user due to %s", err)
	}

	user, err = uaaClient.DeleteUser(user.ID)
	fmt.Printf("Deleteed User with ID: %s", user.ID)
	return nil
}

func (e2e *E2ESetupHelper) deleteServiceBrokers(cfClient *cfclient.Client, fixture FixtureConfig) error {

	brokers, err := cfClient.ListServiceBrokers()
	if err != nil {
		return fmt.Errorf("Failed to list brokers due to %s", err)
	}

	for _, broker := range brokers {
		if strings.Contains(broker.Name, fixture.Services.PublicService) ||
			strings.Contains(broker.Name, fixture.Services.PrivateService) ||
			strings.Contains(broker.Name, fixture.Services.PrivateSpaceScopedService) {
			err = cfClient.DeleteServiceBroker(broker.Guid)
			if err != nil {
				fmt.Printf("Failed to delete broker due to %s, continuing...", err)
			}
		}
	}
	return nil
}
