import { CFResponse } from '../../frontend/app/store/types/api.types';
import { E2ESetup, e2e } from '../e2e';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { promise } from 'protractor';
import { CFHelpers } from '../helpers/cf-helpers';
import { CreateServiceInstance } from './create-service-instance.po';

export class ServicesHelperE2E {

  cfRequestHelper: CFRequestHelpers;
  cfHelper: CFHelpers;
  createServiceInstance: CreateServiceInstance;
  serviceInstanceName: string;

  constructor(public e2eSetup: E2ESetup, createServiceInstance: CreateServiceInstance = null) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
    this.cfHelper = new CFHelpers(e2eSetup);
    this.createServiceInstance = createServiceInstance;
    const testTime = (new Date()).toISOString();
    this.serviceInstanceName = `serviceInstance-${testTime}`;
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

  createService = () => {

    // Select CF/Org/Space
    this.setCfOrgSpace();
    this.createServiceInstance.stepper.next();

    // Select Service
    this.setServiceSelection();
    this.createServiceInstance.stepper.next();

    // Select Service Plan
    this.setServicePlan();
    this.createServiceInstance.stepper.next();

    // Bind App
    this.setBindApp();
    this.createServiceInstance.stepper.next();

    this.setServiceInstanceDetail();

    this.createServiceInstance.stepper.next();

  }

  setServiceInstanceDetail = () => {
    this.createServiceInstance.stepper.waitForStep('Service Instance');
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    this.createServiceInstance.stepper.setServiceName(this.serviceInstanceName);
  }

  setBindApp = () => {
    this.createServiceInstance.stepper.waitForStep('Bind App (Optional)');
    // Optional step can be skipped
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServicePlan = () => {
    this.createServiceInstance.stepper.waitForStep('Select Plan');
    // Should have a plan auto-selected
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServiceSelection = () => {
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    this.createServiceInstance.stepper.waitForStep('Select Service');
    this.createServiceInstance.stepper.setService(e2e.secrets.getDefaultCFEndpoint().testService);
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setCfOrgSpace = () => {
    expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    this.createServiceInstance.stepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    this.createServiceInstance.stepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    this.createServiceInstance.stepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  cleanupServiceInstance(serviceIntanceName: string): promise.Promise<any> {
    const getCfCnsi = this.cfRequestHelper.getCfCnsi();
    let cfGuid: string;
    return getCfCnsi.then(endpointModel => {
      cfGuid = endpointModel.guid;
      return this.fetchServicesInstances(cfGuid);
    }).then(response => {
      const services = response.resources;
      const serviceInstance = services.filter(service => service.entity.name === serviceIntanceName)[0];
      return this.deleteServiceInstance(cfGuid, serviceInstance.metadata.guid);
    });
  }

}

