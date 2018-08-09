package setupe2e

import (
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/SUSE/stratos-ui/plugins/cfapppush"
	"github.com/SUSE/stratos-ui/plugins/cfapppush/pushapp"
	"github.com/cloudfoundry-community/go-cfclient"
	uuid "github.com/satori/go.uuid"
)

type ServiceCreator struct {
	brokerUrl string
	client    *cfclient.Client
	fixture   FixtureConfig
	endpoint  Endpoint
}

func CreateServiceCreator(cfClient *cfclient.Client, endpoint Endpoint, fixture FixtureConfig) *ServiceCreator {

	return &ServiceCreator{
		brokerUrl: "https://github.com/irfanhabib/worlds-simplest-service-broker",
		client:    cfClient,
		fixture:   fixture,
		endpoint:  endpoint,
	}

}

func (this *ServiceCreator) createBrokerApp(serviceName string, baseGUID string) (string, error) {

	tempDir, err := ioutil.TempDir("", "cf-push-")
	if err != nil {
		return "", fmt.Errorf("Failed to create tmp dir due to %+v", err)
	}
	defer os.RemoveAll(tempDir)

	// Clone broker

	vcsGit := cfapppush.GetVCS()

	err = vcsGit.Create(tempDir, this.brokerUrl, "master")
	if err != nil {
		return "", fmt.Errorf("Failed to clone due to %+v", err)
	}

	orgEntity, err := this.client.GetOrgByName(this.fixture.Organization)
	if err != nil {
		return "", err
	}

	spaceEntity, err := this.client.GetSpaceByName(this.fixture.Space, orgEntity.Guid)
	if err != nil {
		return "", err
	}
	pushConfig, err := this.getPushConfig(orgEntity.Guid, spaceEntity.Guid)
	if err != nil {
		return "", fmt.Errorf("Failed to create push config")
	}

	cfPush := pushapp.Constructor(pushConfig)

	appName := fmt.Sprintf("%s-broker", serviceName)
	cfPush.Init(appName, tempDir, "", []pushapp.PushArg{
		pushapp.PushArg{
			Flag:  fmt.Sprintf("%s-broker", serviceName),
			NoArg: true,
		},
		pushapp.PushArg{
			Flag:  "--no-start",
			NoArg: true,
		},
		pushapp.PushArg{
			Flag:  "-m",
			Value: "128M",
			NoArg: false,
		},
		pushapp.PushArg{
			Flag:  "-k",
			Value: "256M",
			NoArg: false,
		},
	})

	// Push Broker
	err = cfPush.Push()
	if err != nil {
		return "", fmt.Errorf("Failed to push app due to %s", err)
	}

	appEntity, err := this.client.AppByName(appName, spaceEntity.Guid, orgEntity.Guid)
	if err != nil {
		return "", fmt.Errorf("Failed to get app due to %s", err)
	}
	// Configure Broker
	this.setEnvVar(appEntity.Guid, "BASE_GUID", baseGUID)
	this.setEnvVar(appEntity.Guid, "CREDENTIALS", "{\"port\": \"4000\", \"host\": \"1.2.3.4\"}")
	this.setEnvVar(appEntity.Guid, "SERVICE_NAME", serviceName)
	this.setEnvVar(appEntity.Guid, "SERVICE_PLAN_NAME", "shared")
	this.setEnvVar(appEntity.Guid, "TAGS", "simple,shared")

	// Start
	this.setAppState(appEntity.Guid, "STARTED")

	// Wait till broker is started

	for {
		app, err := this.client.AppByGuid(appEntity.Guid)
		if err != nil {
			return "", fmt.Errorf("Failed to fetch app by guid due to %s", err)
		}

		time.Sleep(10 * time.Second)
		if app.State == "STARTED" && app.PackageState == "STAGED" {
			break
		}
	}

	routes, err := this.client.GetAppRoutes(appEntity.Guid)
	domain, err := this.getDomain(routes[0].DomainGuid)
	serviceURL := fmt.Sprintf("%s.%s", routes[0].Host, domain.Name)
	return serviceURL, nil

}

func (this *ServiceCreator) getDomain(guid string) (*cfclient.SharedDomain, error) {
	domains, err := this.client.ListSharedDomains()
	if err != nil {
		return nil, fmt.Errorf("Failed to fetch app by guid due to %s", err)
	}

	for _, domain := range domains {
		if domain.Guid == guid {
			return &domain, nil
		}
	}
	return nil, fmt.Errorf("Failed to find domain")
}

type ServiceVisibility struct {
	// Space scoped
	SpaceScoped bool
	SpaceGUID   string
	// Privately scoped
	Private bool
	OrgGuid string
}

func (this *ServiceCreator) CreateService(serviceName string, visibility ServiceVisibility) error {

	baseGUID := uuid.NewV4().String()
	serviceURL, err := this.createBrokerApp(serviceName, baseGUID)
	if err != nil {
		return fmt.Errorf("Failed to create broker due to %s", err)
	}
	_, err = this.client.CreateServiceBroker(cfclient.CreateServiceBrokerRequest{
		Name:      serviceName,
		BrokerURL: fmt.Sprintf("https://%s", serviceURL),
		Username:  "admin",
		Password:  "admin",
		SpaceGUID: visibility.SpaceGUID,
	})
	if err != nil {
		return fmt.Errorf("Failed to create broker due to %s", err)
	}
	// Set visibility
	if visibility.SpaceScoped {
		// Nothing needs to be done
		if visibility.SpaceGUID == "" {
			return fmt.Errorf("To create a space scoped service, please provide a space guid")
		}
	}

	// Private service
	if visibility.Private {
		if visibility.OrgGuid == "" {
			return fmt.Errorf("To create a private service, please provide an org guid")
		}
		err = this.createServiceVisibility(baseGUID, visibility.OrgGuid)
		if err != nil {
			return fmt.Errorf("To create a private service due to %s", err)
		}

	}

	// create public service
	if !visibility.SpaceScoped && !visibility.Private {
		servicePlanGUID, err := this.getServicePlanGUID(baseGUID)
		if err != nil {
			return fmt.Errorf("Failed to get service plan guid due to %s", err)
		}
		err = this.client.MakeServicePlanPublic(servicePlanGUID)
		if err != nil {
			return fmt.Errorf("Failed to make service plan public due to %s", err)
		}

	}
	return nil
}

func (this *ServiceCreator) getServicePlanGUID(baseGUID string) (string, error) {
	servicePlanUniqueId := fmt.Sprintf("%s-plan-shared", baseGUID)

	servicePlans, err := this.client.ListServicePlans()
	if err != nil {
		return "", fmt.Errorf("Failed to list service plans due to %s", err)
	}
	for _, servicePlan := range servicePlans {
		if servicePlan.UniqueId == servicePlanUniqueId {
			return servicePlan.Guid, nil
		}
	}
	return "", fmt.Errorf("Unable to find service")
}

func (this *ServiceCreator) createServiceVisibility(baseGUID string, orgGuid string) error {
	servicePlanGuid, err := this.getServicePlanGUID(baseGUID)
	if err != nil {
		return fmt.Errorf("Failed to get service plan due to %s", err)
	}
	_, err = this.client.CreateServicePlanVisibility(servicePlanGuid, orgGuid)
	if err != nil {
		return fmt.Errorf("Failed to create service visibility due to %s", err)
	}
	return nil
}

func (this *ServiceCreator) setEnvVar(appGuid string, key string, value string) error {

	appEnv, err := this.client.GetAppEnv(appGuid)
	if err != nil {
		return fmt.Errorf("Failed to get env vars for app due to %s", err)
	}

	envJson := appEnv.Environment
	envJson[key] = value
	_, err = this.client.UpdateApp(appGuid, cfclient.AppUpdateResource{
		Environment: envJson,
	})
	if err != nil {
		return fmt.Errorf("Failed to update env vars for app due to %s", err)
	}

	return nil
}

func (this *ServiceCreator) setAppState(appGuid string, state string) error {
	_, err := this.client.UpdateApp(appGuid, cfclient.AppUpdateResource{
		State: state,
	})
	return err
}
func (this *ServiceCreator) getPushConfig(orgGuid string, spaceGuid string) (*pushapp.CFPushAppConfig, error) {

	info, err := this.client.GetInfo()
	if err != nil {
		return nil, err
	}

	token, err := this.client.Config.TokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("Unable to get token")
	}

	config := &pushapp.CFPushAppConfig{
		AuthorizationEndpoint:  info.AuthorizationEndpoint,
		CFClient:               this.endpoint.UAA.CFClient,
		CFClientSecret:         this.endpoint.UAA.CFClientSecret,
		APIEndpointURL:         this.endpoint.URL,
		DopplerLoggingEndpoint: info.DopplerLoggingEndpoint,
		SkipSSLValidation:      this.endpoint.SkipSSLValidation,
		AuthToken:              fmt.Sprintf("bearer %s", token.AccessToken),
		RefreshToken:           token.RefreshToken,
		OrgGUID:                orgGuid,
		OrgName:                this.fixture.Organization,
		SpaceGUID:              spaceGuid,
		SpaceName:              this.fixture.Space,
		OutputWriter:           ioutil.Discard,
		DialTimeout:            "",
		DisableTraceLogging:    true,
	}
	return config, nil
}
