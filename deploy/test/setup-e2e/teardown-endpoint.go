package main

import (
	"fmt"

	uaa "github.com/cloudfoundry-community/go-uaa"
)

func (e2e *E2ESetupHelper) tearDownEndpoint(endpoint Endpoint, fixture FixtureConfig) error {
	uaaAPI, err := e2e.createUAAClient(endpoint)

	// Delete User
	err = e2e.DeleteUser(uaaAPI, fixture.NonAdminUser)
	if err != nil {
		fmt.Printf("Failed to delete user %+v", fixture.NonAdminUser)
		return err
	}
	return nil
}

func (e2e *E2ESetupHelper) DeleteUser(uaaClient *uaa.API, userConfig User) error {

	// Create UAA user

	user, err := uaaClient.GetUserByUsername(userConfig.Username, "", "")
	if err != nil {
		return fmt.Errorf("Failed to create uaa user due to %s", err)
	}

	user, err = uaaClient.DeleteUser(user.ID)
	fmt.Printf("Deleteed User with ID: %s", user.ID)
	return nil
}
