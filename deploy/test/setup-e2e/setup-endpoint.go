package main

import (
	"fmt"
	"os"

	cfclient "github.com/cloudfoundry-community/go-cfclient"
	uaa "github.com/cloudfoundry-community/go-uaa"
)

func (e2e *E2ESetupHelper) createCFClent(endpoint Endpoint) (*cfclient.Client, error) {
	c := &cfclient.Config{
		ApiAddress:        endpoint.URL,
		Username:          endpoint.AdminUser.Username,
		Password:          endpoint.AdminUser.Password,
		SkipSslValidation: endpoint.SkipSSLValidation,
	}
	return cfclient.NewClient(c)

}

func (e2e *E2ESetupHelper) createUAAClient(endpoint Endpoint) (*uaa.API, error) {
	return uaa.NewWithClientCredentials(
		endpoint.UAA.URL,
		endpoint.UAA.ZoneID,
		endpoint.UAA.Client,
		endpoint.UAA.ClientSecret,
		uaa.JSONWebToken,
		endpoint.UAA.SkipSSLValidation)
}

func (e2e *E2ESetupHelper) setupEndpoint(endpoint Endpoint, fixture FixtureConfig) {

	// create clien

	cfAPI, _ := e2e.createCFClent(endpoint)
	uaaAPI, err := e2e.createUAAClient(endpoint)
	fmt.Printf("Failed to log in to UAA %+v", err)
	if err != nil {
		fmt.Printf("Failed to log in to UAA %+v", err)
		os.Exit(1)
	}
	uaaAPI.Verbose = true

	fmt.Println("Creating User")

	userEntity, err := e2e.CreateUser(cfAPI, uaaAPI, fixture.NonAdminUser)
	if err != nil || userEntity == nil {
		fmt.Printf("Failed to create user due to %+v\n", err)
		os.Exit(1)

	}

	fmt.Printf("Created User with ID: %s\n", userEntity.Guid)
	fmt.Println("Creating Org")
	org, err := e2e.CreateOrg(cfAPI, fixture.Organization)
	if err != nil {
		fmt.Printf("Failed to create org due to %+v", err)
		os.Exit(1)
	}
	fmt.Printf("Created org with ID: %s\n", org.Guid)

	fmt.Println("Associate Org with User")
	err = e2e.AssociateOrgUser(cfAPI, org.Guid, userEntity.Guid)
	if err != nil {
		fmt.Printf("Failed to associate role due to %s", err)
		os.Exit(1)
	}
	fmt.Printf("Creating Space Guids are: %s %s\n", org.Guid, userEntity.Guid)
	_, err = e2e.CreateSpace(cfAPI, fixture.Space, org.Guid, userEntity.Guid)
	if err != nil {
		fmt.Printf("Failed to create space due to %+v\n", err)
		os.Exit(1)
	}

	e2e.CreateServices(cfAPI, endpoint, fixture)
}

func (e2e *E2ESetupHelper) AssociateOrgUser(client *cfclient.Client, orgGuid string, userGuid string) error {
	_, err := client.AssociateOrgUser(orgGuid, userGuid)
	return err
}

func (e2e *E2ESetupHelper) CreateUser(client *cfclient.Client, uaaClient *uaa.API, user User) (*cfclient.User, error) {

	// Create UAA user
	trueVal := true
	UAAUser := uaa.User{
		Password: user.Password,
		Emails:   []uaa.Email{uaa.Email{Value: user.Username, Primary: &trueVal}},
		Name:     &uaa.UserName{FamilyName: user.Username, GivenName: user.Username},
		Origin:   "",
		Username: user.Username,
	}

	createdUser, err := uaaClient.CreateUser(UAAUser)
	if err != nil && createdUser == nil {
		return nil, fmt.Errorf("Failed to create uaa user due to %s", err)
	}

	fmt.Printf("Created User with ID: %s", createdUser.ID)
	userRequest := cfclient.UserRequest{Guid: createdUser.ID}
	userEntity, err := client.CreateUser(userRequest)
	if err != nil {
		return nil, fmt.Errorf("Failed to create cf user due to %s", err)
	}
	return &userEntity, nil
}

func (e2e *E2ESetupHelper) CreateOrg(client *cfclient.Client, org string) (*cfclient.Org, error) {

	orgRequest := cfclient.OrgRequest{Name: org}
	orgEntity, err := client.CreateOrg(orgRequest)
	if err != nil {
		return nil, fmt.Errorf("Failed to create org", err)
	}
	return &orgEntity, nil

}

func (e2e *E2ESetupHelper) CreateSpace(client *cfclient.Client, space string, orgGuid string, userGuid string) (*cfclient.Space, error) {

	spaceRequest := cfclient.SpaceRequest{
		Name:             space,
		OrganizationGuid: orgGuid,
		DeveloperGuid:    []string{userGuid},
		ManagerGuid:      []string{userGuid},
		AllowSSH:         true,
	}

	spaceEntity, err := client.CreateSpace(spaceRequest)
	if err != nil {
		return nil, fmt.Errorf("Failed to create space due to %s", err)
	}
	return &spaceEntity, nil
}

func (e2e *E2ESetupHelper) CreateServices(client *cfclient.Client, endpoint Endpoint, fixture FixtureConfig) {

	CreateServiceCreator(client, endpoint, fixture)

}
