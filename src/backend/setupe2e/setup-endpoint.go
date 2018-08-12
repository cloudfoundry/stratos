package setupe2e

import (
	"fmt"
	"sync"

	log "github.com/Sirupsen/logrus"
	cfclient "github.com/cloudfoundry-community/go-cfclient"
	uaa "github.com/cloudfoundry-community/go-uaa"
)

func (e2e *SetupE2EHelper) createCFClent(endpoint Endpoint) (*cfclient.Client, error) {
	c := &cfclient.Config{
		ApiAddress:        endpoint.URL,
		Username:          endpoint.AdminUser.Username,
		Password:          endpoint.AdminUser.Password,
		SkipSslValidation: endpoint.SkipSSLValidation,
	}
	return cfclient.NewClient(c)

}

func (e2e *SetupE2EHelper) createUAAClient(endpoint Endpoint) (*uaa.API, error) {
	return uaa.NewWithClientCredentials(
		endpoint.UAA.URL,
		endpoint.UAA.ZoneID,
		endpoint.UAA.Client,
		endpoint.UAA.ClientSecret,
		uaa.JSONWebToken,
		endpoint.UAA.SkipSSLValidation)
}

func (e2e *SetupE2EHelper) SetupEndpointForFixture(endpoint Endpoint, fixture FixtureConfig) error {

	cfAPI, err := e2e.createCFClent(endpoint)
	if err != nil {
		return fmt.Errorf("Failed to log in to CF due to %s", err)
	}

	uaaAPI, err := e2e.createUAAClient(endpoint)
	if err != nil {
		return fmt.Errorf("Failed to log in to UAA %s", err)
	}
	uaaAPI.Verbose = true

	log.Infof("Creating User %s\n", fixture.NonAdminUser.Username)

	userEntity, err := e2e.CreateUser(cfAPI, uaaAPI, fixture.NonAdminUser)
	if err != nil {
		return fmt.Errorf("Failed to create user due to %+v\n", err)

	}
	log.Debugf("Created User with ID: %s\n", userEntity.Guid)

	log.Infof("Creating Org %s", fixture.Organization)
	org, err := e2e.CreateOrg(cfAPI, fixture.Organization)
	if err != nil {
		return fmt.Errorf("Failed to create org due to %+v", err)
	}

	log.Debugf("Created org with ID: %s\n", org.Guid)

	log.Debug("Associate Org with User")
	err = e2e.AssociateOrgUser(cfAPI, org.Guid, userEntity.Guid)
	if err != nil {
		return fmt.Errorf("Failed to associate role due to %s", err)
	}

	log.Infof("Creating Space %s\n", fixture.Space)
	spaceEntity, err := e2e.CreateSpace(cfAPI, fixture.Space, org.Guid, userEntity.Guid)
	if err != nil {
		return fmt.Errorf("Failed to create space due to %s\n", err)
	}
	log.Infof("Creating Services %+v\n", fixture.Services)

	err = e2e.CreateServices(cfAPI, endpoint, fixture, spaceEntity.Guid, org.Guid)
	if err != nil {
		return fmt.Errorf("Failed to create service due to %s\n", err)
	}

	log.Infof("All done!")

	return nil
}

func (e2e *SetupE2EHelper) AssociateOrgUser(client *cfclient.Client, orgGuid string, userGuid string) error {
	_, err := client.AssociateOrgUser(orgGuid, userGuid)
	if err != nil {
		return err
	}
	_, err = client.AssociateOrgManager(orgGuid, userGuid)
	return err
}

func (e2e *SetupE2EHelper) CreateUser(client *cfclient.Client, uaaClient *uaa.API, user User) (*cfclient.User, error) {

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

	log.Debugf("Created User with ID: %s\n", createdUser.ID)
	userRequest := cfclient.UserRequest{Guid: createdUser.ID}
	userEntity, err := client.CreateUser(userRequest)
	if err != nil {
		return nil, fmt.Errorf("Failed to create cf user due to %s", err)
	}
	return &userEntity, nil
}

func (e2e *SetupE2EHelper) CreateOrg(client *cfclient.Client, org string) (*cfclient.Org, error) {

	orgRequest := cfclient.OrgRequest{Name: org}
	orgEntity, err := client.CreateOrg(orgRequest)
	if err != nil {
		return nil, fmt.Errorf("Failed to create org", err)
	}
	return &orgEntity, nil

}

func (e2e *SetupE2EHelper) CreateSpace(client *cfclient.Client, space string, orgGuid string, userGuid string) (*cfclient.Space, error) {

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

func (e2e *SetupE2EHelper) CreateServices(client *cfclient.Client, endpoint Endpoint, fixture FixtureConfig, spaceGUID string, orgGuid string) error {

	serviceCreator := CreateServiceCreator(client, endpoint, fixture)
	servicesConfig := fixture.Services
	wg := new(sync.WaitGroup)
	wg.Add(1)
	go func() {

		// Create public service
		if servicesConfig.PublicService != "" {
			err := serviceCreator.CreateService(servicesConfig.PublicService, ServiceVisibility{SpaceScoped: false, Private: false})
			if err != nil {
				log.Errorf("Failed to create public service due to: %s", err)
			}
		}
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		// Create private service
		if servicesConfig.PrivateService != "" {
			err := serviceCreator.CreateService(servicesConfig.PrivateService, ServiceVisibility{SpaceScoped: false, Private: true, OrgGuid: orgGuid})
			if err != nil {
				log.Errorf("Failed to create private service due to: %s", err)
			}
		}
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		// Create space scoped service
		if servicesConfig.PrivateSpaceScopedService != "" {
			err := serviceCreator.CreateService(servicesConfig.PrivateSpaceScopedService, ServiceVisibility{SpaceScoped: true, Private: false, SpaceGUID: spaceGUID})
			if err != nil {
				log.Errorf("Failed to create space scoped service due to: %s", err)
			}
		}
		wg.Done()
	}()
	wg.Wait()
	return nil
}
