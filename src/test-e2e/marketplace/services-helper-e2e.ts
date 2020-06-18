import { browser, promise, protractor } from 'protractor';

import { IServiceInstance } from '../../frontend/packages/cloud-foundry/src/cf-api-svc.types';
import { CFResponse, createEmptyCfResponse } from '../../frontend/packages/cloud-foundry/src/store/types/cf-api.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { e2e, E2ESetup } from '../e2e';
import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { ListComponent } from '../po/list.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';

const customServiceLabel = E2EHelpers.e2eItemPrefix + process.env.USER;
const until = protractor.ExpectedConditions;

export class ServicesHelperE2E {

  cfRequestHelper: CFRequestHelpers;
  cfHelper: CFHelpers;
  createServiceInstance: CreateMarketplaceServiceInstance;

  constructor(public e2eSetup: E2ESetup, createServiceInstance: CreateMarketplaceServiceInstance = null, seed?: ServicesHelperE2E) {
    this.cfRequestHelper = seed ? seed.cfRequestHelper : new CFRequestHelpers(e2eSetup);
    this.cfHelper = seed ? seed.cfHelper : new CFHelpers(e2eSetup);
    if (!!createServiceInstance) {
      this.createServiceInstance = createServiceInstance;
    }
  }

  createServiceInstanceName(): string {
    const serviceInstanceName = E2EHelpers.createCustomName(customServiceLabel).toLowerCase();
    this.checkServiceInstanceName(serviceInstanceName);
    return serviceInstanceName;
  }

  addPrefixToServiceName = (prefix: string, serviceInstanceName: string): string => {
    const newServiceInstanceName = `${prefix}-${serviceInstanceName}`;
    this.checkServiceInstanceName(newServiceInstanceName);
    return newServiceInstanceName;
  }

  private checkServiceInstanceName(serviceInstanceName: string) {
    expect(serviceInstanceName.length)
      .toBeLessThanOrEqual(50, `Service name should not exceed 50 characters: ${serviceInstanceName}`);
  }

  setCreateServiceInstance = (createServiceInstance: CreateMarketplaceServiceInstance) => {
    this.createServiceInstance = createServiceInstance;
  }

  fetchServices = (cfGuid: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      'services?page=1&results-per-page=100&inline-relations-depth=1&include-relations=service_plans'
    );
  }

  fetchServicesInstances = (cfGuid: string, userProvided = false): promise.Promise<CFResponse> => {
    const url = userProvided ? 'user_provided_service_instances?page=1&results-per-page=100' : 'service_instances?page=1&results-per-page=100';
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      url
    );
  }

  deleteServiceInstance = (cfGuid: string, serviceGuid: string, userProvided = false): promise.Promise<CFResponse> => {
    const id = `${cfGuid}:${serviceGuid}`;
    const url = userProvided ? `user_provided_service_instances/${serviceGuid}?async=false&recursive=true` : `service_instances/${serviceGuid}?async=false&recursive=true`;
    return this.cfRequestHelper.sendCfDelete(
      cfGuid,
      url
    ).catch(err => {
      e2e.log(`Deleting service instance '${id}' (cf:si guid) failed: `, err);
      throw err;
    });
  }

  fetchServiceInstanceByName = (cfGuid: string, serviceInstanceName: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      `service_instances?name=${serviceInstanceName}`
    );
  }

  createService = (serviceName: string, serviceInstanceName: string, marketplaceMode = false, bindApp: string = null) => {
    this.createServiceInstance.waitForPage();

    // Select CF/Org/Space
    this.setCfOrgSpace(null, null, marketplaceMode);
    this.createServiceInstance.stepper.next();

    // Select Service
    if (!marketplaceMode) {
      // Select Service
      this.setServiceSelection(serviceName);
      this.createServiceInstance.stepper.next();
    }

    // Select Service Plan
    this.setServicePlan();
    this.createServiceInstance.stepper.next();

    // Bind App
    this.createServiceInstance.stepper.isBindAppStepDisabled().then(bindAppDisabled => {
      if (!bindAppDisabled) {
        this.setBindApp(bindApp);
        this.createServiceInstance.stepper.next();
      }

      this.setServiceInstanceDetail(serviceInstanceName);

      this.createInstanceAttempt(0, 8, serviceName, serviceInstanceName);
    });
  }

  createUserProvidedService = (serviceName: string, serviceInstanceName: string, bindApp: string = null) => {
    this.createServiceInstance.waitForPage();

    // Select CF/Org/Space
    this.setCfOrgSpace(null, null, false);
    this.createServiceInstance.stepper.next();

    // Bind App
    this.createServiceInstance.stepper.isBindAppStepDisabled().then(bindAppDisabled => {
      if (!bindAppDisabled) {
        this.setBindApp(bindApp);
        this.createServiceInstance.stepper.next();
      }

      this.setServiceInstanceDetail(serviceInstanceName);

      this.createInstanceAttempt(0, 8, serviceName, serviceInstanceName);
    });
  }

  createInstanceAttempt = (retryNumber: number, maxRetries: number, serviceName: string, serviceInstanceName: string) => {
    this.createServiceInstance.stepper.next();
    browser.wait(until.or(
      until.invisibilityOf(this.createServiceInstance.stepper.nextButton()),
      this.createServiceInstance.stepper.canNext.bind(this.createServiceInstance.stepper)
    ), 20000);

    this.createServiceInstance.stepper.canNext().then(canNext => {
      if (canNext) {
        const attemptsLeft = maxRetries - retryNumber;
        if (!!attemptsLeft) {
          e2e.log(`Failed to create service instance '${serviceInstanceName}' of type '${serviceName}'.
           Attempting ${attemptsLeft} more time/s`);
          // Wait 10 seonds until we try again
          browser.sleep(10000);
          this.createInstanceAttempt(retryNumber + 1, maxRetries, serviceName, serviceInstanceName);
        } else {
          fail(`Failed to create service instance after ${maxRetries} retries`);
        }
      }
    });
  }

  canBindAppStep = (): promise.Promise<boolean> => {
    return this.cfHelper.fetchDefaultSpaceGuid(true)
      .then(spaceGuid => this.cfHelper.fetchAppsCountInSpace(CFHelpers.cachedDefaultCfGuid, spaceGuid))
      .then(totalAppsInSpace => !!totalAppsInSpace);
  }

  setServiceInstanceDetail = (serviceInstanceName: string, isEditServiceInstance = false) => {
    this.createServiceInstance.stepper.waitForStep('Service Instance');
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    if (!isEditServiceInstance) {
      expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    } else {
      expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    }
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    this.createServiceInstance.stepper.setServiceName(serviceInstanceName);
  }

  setBindApp = (bindApp: string = null) => {
    this.createServiceInstance.stepper.waitForStep('Bind App (Optional)');

    if (!!bindApp) {
      this.createServiceInstance.stepper.setBindApp(bindApp);
    }
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServicePlan = (isEditServiceInstance = false) => {
    this.createServiceInstance.stepper.waitForStep('Select Plan');
    // Should have a plan auto-selected
    if (!isEditServiceInstance) {
      expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    } else {
      expect(this.createServiceInstance.stepper.canPrevious()).toBeFalsy();
    }
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServiceSelection = (serviceName: string, expectFailure = false) => {
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    this.createServiceInstance.stepper.waitForStep('Select Service');
    this.createServiceInstance.stepper.waitForStepNotBusy();
    this.createServiceInstance.stepper.setService(serviceName, expectFailure);
    if (!expectFailure) {
      expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
      expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    }
  }

  setCfOrgSpace = (orgName: string = null, spaceName: string = null, marketplaceMode = false) => {

    if (!marketplaceMode) {
      this.createServiceInstance.stepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    }
    this.createServiceInstance.stepper.setOrg(!!orgName ? orgName : e2e.secrets.getDefaultCFEndpoint().testOrg);
    this.createServiceInstance.stepper.setSpace(!!spaceName ? spaceName : e2e.secrets.getDefaultCFEndpoint().testSpace);
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  cleanUpServiceInstance(serviceInstanceName: string): promise.Promise<any> {
    return this.cleanUpServiceInstances([serviceInstanceName]);
  }

  cleanUpServiceInstances(serviceInstanceNames: string[], userProvided = false): promise.Promise<any> {
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    if (serviceInstanceNames.length === 0) {
      return promise.fullyResolved(createEmptyCfResponse());
    }
    const getCfCnsi = this.cfRequestHelper.getCfGuid();
    let cfGuid: string;
    return getCfCnsi.then(guid => {
      cfGuid = guid;
      return this.fetchServicesInstances(cfGuid, userProvided).catch(failure => {
        if (failure && failure.error && failure.error.statusCode === 404) {
          e2e.debugLog('cleanUpServiceInstances: Failed to fetch SI... ', failure.error);
          const emptyRes: CFResponse = {
            next_url: '',
            prev_url: '',
            resources: [],
            total_pages: 0,
            total_results: 0
          };
          return emptyRes;
        }
        throw failure;
      });
    }).then(response => {
      const services = response.resources;
      const serviceInstances: APIResource<IServiceInstance>[] = [];
      const notFoundSI = [];
      serviceInstanceNames.forEach(name => {
        const serviceInstance = services.find(si => name === si.entity.name);
        if (serviceInstance) {
          serviceInstances.push(serviceInstance);
        } else {
          notFoundSI.push(name);
        }
      });

      if (!!notFoundSI.length) {
        e2e.debugLog('cleanUpServiceInstances: Failed to find some service instances... ', notFoundSI);
        e2e.debugLog('cleanUpServiceInstances: Found SI', services.map(service => service.entity.name));
        e2e.debugLog('cleanUpServiceInstances: cfGuid', cfGuid);
      }
      return serviceInstances.length ?
        promise.all(serviceInstances.map(serviceInstance =>
          this.cleanUpService(cfGuid, serviceInstance.metadata.guid, serviceInstance.entity.name, userProvided))) :
        promise.fullyResolved(createEmptyCfResponse());
    });
  }

  private cleanUpService(
    cfGuid: string,
    serviceInstanceGuid: string,
    serviceInstanceName: string,
    userProvided = false): promise.Promise<any> {
    return this.deleteInstanceAttempt(cfGuid, serviceInstanceGuid, 0, 3, serviceInstanceName, userProvided);
  }

  private deleteInstanceAttempt = (
    cfGuid: string,
    serviceInstanceGuid: string,
    retryNumber: number,
    maxRetries: number,
    serviceInstanceName: string,
    userProvided = false) => {
    return this.deleteServiceInstance(cfGuid, serviceInstanceGuid, userProvided)
      .catch(e => {
        const attemptsLeft = maxRetries - retryNumber;
        if (!!attemptsLeft) {
          e2e.log(`Failed to delete service instance '${serviceInstanceName}''.
         Attempting ${attemptsLeft} more time/s`);
          browser.sleep(1000);
          this.deleteInstanceAttempt(cfGuid, serviceInstanceGuid, retryNumber + 1, maxRetries, serviceInstanceName, userProvided);
        } else {
          e2e.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
          e2e.log(`Failed to delete service instance after ${maxRetries} retries. Please delete manually`);
          e2e.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        }
      });
  }

  getServiceCardWithTitle(list: ListComponent, serviceName: string, filter = true) {
    if (filter) {
      list.header.waitUntilShown();
      list.header.setSearchText(serviceName);
    }
    return list.cards.waitForCardByTitle(serviceName);
  }

  noServiceCardWithTitle(list: ListComponent, serviceName: string, filter = true): promise.Promise<number> {
    if (filter) {
      list.header.waitUntilShown();
      list.header.setSearchText(serviceName);
    }
    const totalResults = list.getTotalResults();
    return totalResults;
  }

  noServiceCardWithTitleAttempt(
    list: ListComponent,
    serviceName: string,
    retryNumber: number,
    maxRetries: number,
    filter = true): promise.Promise<number> {
    return this.noServiceCardWithTitle(list, serviceName, filter)
      .then(totalResults => {
        if (totalResults === 0) {
          return 0;
        }
        const attemptsLeft = maxRetries - retryNumber;
        if (!!attemptsLeft) {
          e2e.log(`Found service with name '${serviceName}' when not expecting to, refreshing list and checking again`);
          browser.sleep(1000);
          return list.header.refresh()
            .then(() => this.noServiceCardWithTitleAttempt(list, serviceName, retryNumber + 1, maxRetries, filter));
        }
        fail(`Continued to find service with name '${serviceName}' after ${maxRetries} when not expecting to`);
        return list.getTotalResults();
      });
  }

}

