package setupe2e

import (
	"fmt"
	"strings"

	log "github.com/Sirupsen/logrus"
	cfclient "github.com/cloudfoundry-community/go-cfclient"
	uaa "github.com/cloudfoundry-community/go-uaa"
)

func (e2e *SetupE2EHelper) TearDownEndpointForFixture(endpoint Endpoint, fixture FixtureConfig, ignoreFailures bool) error {
	uaaAPI, err := e2e.createUAAClient(endpoint)
	if err != nil {
		return fmt.Errorf("Failed to connect to UAA due to %s", err)
	}
	cfAPI, err := e2e.createCFClent(endpoint)
	if err != nil {
		return fmt.Errorf("Failed to connect to CF API due to %s", err)
	}

	log.Infof("Deleting user %s\n", fixture.NonAdminUser.Username)
	err = e2e.deleteUser(uaaAPI, cfAPI, fixture.NonAdminUser)
	if err != nil && !ignoreFailures {
		fmt.Printf("Failed to delete user %+v", fixture.NonAdminUser)
		return err
	}

	log.Info("Deleting services...")

	err = e2e.deleteServiceBrokers(cfAPI, fixture)
	if err != nil && !ignoreFailures {
		fmt.Printf("Failed to delete org due to %s", err)
		return err
	}

	log.Infof("Deleting org %s...\n", fixture.Organization)

	err = e2e.deleteOrg(cfAPI, fixture)
	if err != nil && !ignoreFailures {
		fmt.Printf("Failed to delete org due to %s", err)
		return err
	}
	return nil

}

func (e2e *SetupE2EHelper) deleteOrg(cfClient *cfclient.Client, fixture FixtureConfig) error {

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

func (e2e *SetupE2EHelper) deleteUser(uaaClient *uaa.API, cfClient *cfclient.Client, userConfig User) error {

	// Create UAA user

	uaaUser, err := uaaClient.GetUserByUsername(userConfig.Username, "", "")
	if err != nil {
		return fmt.Errorf("Failed to get uaa user due to %s", err)
	}

	// Delete from CF as well
	cfUsers, err := cfClient.ListUsers()
	if err != nil {
		return fmt.Errorf("Failed to get cf user due to %s", err)
	}
	var cfUser *cfclient.User
	for _, cfU := range cfUsers {
		if cfU.Username == userConfig.Username {
			cfUser = &cfU
		}
	}
	if cfUser != nil {
		err = cfClient.DeleteUser(cfUser.Guid)
		if err != nil {
			return fmt.Errorf("Failed to delete cf user due to %s", err)
		}
	}

	user, err := uaaClient.DeleteUser(uaaUser.ID)
	fmt.Printf("Deleteed User with ID: %s", user.ID)
	return nil
}

func (e2e *SetupE2EHelper) deleteServiceBrokers(cfClient *cfclient.Client, fixture FixtureConfig) error {

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
