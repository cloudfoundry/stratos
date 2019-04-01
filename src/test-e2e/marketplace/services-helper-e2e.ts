import { browser, promise, protractor } from 'protractor';

import { CFResponse, createEmptyCfResponse } from '../../frontend/packages/store/src/types/api.types';
import { e2e, E2ESetup } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
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
  serviceInstanceName: string;

  constructor(public e2eSetup: E2ESetup, createServiceInstance: CreateMarketplaceServiceInstance = null, seed?: ServicesHelperE2E) {
    this.cfRequestHelper = seed ? seed.cfRequestHelper : new CFRequestHelpers(e2eSetup);
    this.cfHelper = seed ? seed.cfHelper : new CFHelpers(e2eSetup);
    this.serviceInstanceName = seed ? seed.serviceInstanceName : E2EHelpers.createCustomName(customServiceLabel).toLowerCase();
    e2e.log('constructor: Setting Name', this.serviceInstanceName);
    expect(this.serviceInstanceName.length)
      .toBeLessThanOrEqual(50, `Service name should not exceed 50 characters: ${this.serviceInstanceName}`);
    if (!!createServiceInstance) {
      this.createServiceInstance = createServiceInstance;
    }
  }

  addPrefixToServiceName = (prefix: string) => {
    this.serviceInstanceName = `${prefix}-${this.serviceInstanceName}`;
    e2e.log('addPrefixToServiceName: Setting Name', this.serviceInstanceName);
    expect(this.serviceInstanceName.length)
      .toBeLessThanOrEqual(50, `Service name should not exceed 50 characters: ${this.serviceInstanceName}`);
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

  fetchServicesInstances = (cfGuid: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      'service_instances?page=1&results-per-page=100'
    );
  }

  deleteServiceInstance = (cfGuid: string, serviceGuid: string): promise.Promise<CFResponse> => {
    const id = `${cfGuid}:${serviceGuid}`;
    e2e.log(`Deleting service instance... ${id}`);
    return this.cfRequestHelper.sendCfDelete(
      cfGuid,
      `service_instances/${serviceGuid}?async=false&recursive=true`
    )
      .then(res => {
        e2e.log(`Deleting service instance... Success... ${id}`, res);
        return res;
      })
      .catch(err => {
        e2e.log(`Deleting service instance... Failed... ${id}`, err);
        throw err;
      });
  }

  fetchServiceInstanceByName = (cfGuid: string, serviceInstanceName: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      `service_instances?name=${serviceInstanceName}`
    );
  }

  createService = (serviceName: string, marketplaceMode = false, bindApp: string = null) => {
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

      this.setServiceInstanceDetail();

      this.createInstanceAttempt(0, 3, serviceName);
    });
  }

  createInstanceAttempt = (retryNumber: number, maxRetries: number, serviceName: string) => {
    this.createServiceInstance.stepper.next();
    browser.wait(until.or(
      until.invisibilityOf(this.createServiceInstance.stepper.nextButton()),
      this.createServiceInstance.stepper.canNext.bind(this.createServiceInstance.stepper)
    ), 10000);

    this.createServiceInstance.stepper.canNext().then(canNext => {
      if (canNext) {
        const attemptsLeft = maxRetries - retryNumber;
        if (!!attemptsLeft) {
          e2e.log(`Failed to create service instance '${this.serviceInstanceName}' of type '${serviceName}'.
           Attempting ${attemptsLeft} more time/s`);
          browser.sleep(1000);
          this.createInstanceAttempt(retryNumber + 1, maxRetries, serviceName);
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

  setServiceInstanceDetail = (isEditServiceInstance = false) => {
    this.createServiceInstance.stepper.waitForStep('Service Instance');
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    if (!isEditServiceInstance) {
      expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    } else {
      expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    }
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    e2e.log('setServiceInstanceDetail: Setting Name', this.serviceInstanceName);
    this.createServiceInstance.stepper.setServiceName(this.serviceInstanceName);
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

  cleanUpServiceInstances(serviceInstanceNames: string[]): promise.Promise<any> {
    e2e.log('cleanUpServiceInstances: Cleaning up service instances... ', serviceInstanceNames);
    // Sleeping because the service instance may not be listed in the `get services` request
    browser.sleep(1000);
    if (serviceInstanceNames.length === 0) {
      return promise.fullyResolved(createEmptyCfResponse());
    }
    const getCfCnsi = this.cfRequestHelper.getCfGuid();
    let cfGuid: string;
    return getCfCnsi.then(guid => {
      cfGuid = guid;
      return this.fetchServicesInstances(cfGuid).catch(failure => {
        if (failure && failure.error && failure.error.statusCode === 404) {
          e2e.log('cleanUpServiceInstances: Failed to fetch SI... ', failure.error);
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
      const serviceInstances = [];
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
        e2e.log('cleanUpServiceInstances: Failed to find some service instances... ', notFoundSI);
        e2e.log('cleanUpServiceInstances: Found SI', services.map(service => service.entity.name));
        e2e.log('cleanUpServiceInstances: cfGuid', cfGuid);
      }
      return serviceInstances.length ?
        promise.all(serviceInstances.map(serviceInstance => this.cleanUpService(cfGuid, serviceInstance.metadata.guid))) :
        promise.fullyResolved(createEmptyCfResponse());
    });
  }

  private cleanUpService(cfGuid: string, serviceGuid: string): promise.Promise<any> {
    return this.deleteServiceInstance(cfGuid, serviceGuid).catch(e => e2e.log(`Ignoring failed service instance delete: ${e}`));
  }

  getServiceCardWithTitle(list: ListComponent, serviceName: string, filter = true) {
    if (filter) {
      list.header.waitUntilShown();
      list.header.setSearchText(serviceName);
    }
    return list.cards.waitForCardByTitle(serviceName);
  }

}

