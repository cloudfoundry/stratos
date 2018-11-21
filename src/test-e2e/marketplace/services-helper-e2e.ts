import { browser, promise } from 'protractor';

import { CFResponse, createEmptyCfResponse } from '../../frontend/app/store/types/api.types';
import { e2e, E2ESetup } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { ListComponent } from '../po/list.po';
import { CreateServiceInstance } from './create-service-instance.po';

const customServiceLabel = E2EHelpers.e2eItemPrefix + process.env.USER;

export class ServicesHelperE2E {

  cfRequestHelper: CFRequestHelpers;
  cfHelper: CFHelpers;
  createServiceInstance: CreateServiceInstance;
  serviceInstanceName: string;

  constructor(public e2eSetup: E2ESetup, createServiceInstance: CreateServiceInstance = null) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
    this.cfHelper = new CFHelpers(e2eSetup);
    this.serviceInstanceName = E2EHelpers.createCustomName(customServiceLabel).toLowerCase();
    expect(this.serviceInstanceName.length)
      .toBeLessThanOrEqual(50, `Service name should not exceed 50 characters: ${this.serviceInstanceName}`);
    if (!!createServiceInstance) {
      this.createServiceInstance = createServiceInstance;
    }
  }

  addPrefixToServiceName = (prefix: string) => {
    this.serviceInstanceName = `${prefix}-${this.serviceInstanceName}`;
    expect(this.serviceInstanceName.length)
      .toBeLessThanOrEqual(50, `Service name should not exceed 50 characters: ${this.serviceInstanceName}`);
  }
  setCreateServiceInstance = (createServiceInstance: CreateServiceInstance) => {
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
    return this.cfRequestHelper.sendCfDelete(
      cfGuid,
      `service_instances/${serviceGuid}?async=false&recursive=true`
    );
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

      this.createServiceInstance.stepper.next();
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
    expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
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
      const serviceInstances = services.filter(serviceInstance => {
        return serviceInstanceNames.findIndex(name => name === serviceInstance.entity.name) >= 0;
      });
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

