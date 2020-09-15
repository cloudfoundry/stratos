import { browser } from 'protractor';

import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { CREATE_APP_DEPLOY_TEST_TYPE, createApplicationDeployTests } from './application-deploy-helper';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageSummaryTab } from './po/application-page-summary.po';

let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

describe('Application Deploy Docker -', () => {

  const testAppStack = e2e.secrets.getDefaultCFEndpoint().testDeployAppStack;
  let defaultStack = '';

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    cfHelper = new CFHelpers(setup);
  });

  beforeAll(() => {
    return cfHelper.fetchDefaultCFEndpointStack().then(stack => defaultStack = stack);
  });

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  const deployRes = createApplicationDeployTests(CREATE_APP_DEPLOY_TEST_TYPE.DOCKER);
  const { testAppName, appDetails, dockerUrl } = deployRes;


  describe('Tab Tests (app status dependent) -', () => {

    it('App Summary', () => {
      // Expects app to be fully started
      const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.appGuid);
      appSummary.goToSummaryTab();
      appSummary.cardStatus.waitForStatus('Deployed');
      appSummary.cardStatus.waitForSubStatus('Online');

      appSummary.cardInstances.waitForRunningInstancesText('1 / 1');

      const cfName = e2e.secrets.getDefaultCFEndpoint().name;
      const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
      const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

      expect(appSummary.cardCfInfo.cf.getValue()).toBe(cfName);
      expect(appSummary.cardCfInfo.org.getValue()).toBe(orgName);
      expect(appSummary.cardCfInfo.space.getValue()).toBe(spaceName);

      expect(appSummary.cardUptime.getTitle()).not.toBe('Application is not running');
      expect(appSummary.cardUptime.getUptime().isDisplayed()).toBeTruthy();
      expect(appSummary.cardUptime.getUptimeText()).not.toBeNull();

      expect(appSummary.cardInfo.memQuota.getValue()).toBe('1 GB');
      expect(appSummary.cardInfo.diskQuota.getValue()).toBe('1 GB');
      expect(appSummary.cardInfo.appState.getValue()).toBe('STARTED');
      expect(appSummary.cardInfo.packageState.getValue()).toBe('STAGED');
      expect(appSummary.cardInfo.services.getValue()).toBe('0');
      expect(appSummary.cardInfo.routes.getValue()).toBe('1');

      expect(appSummary.cardBuildInfo.buildPack.getValue()).toBe('-');
      expect(appSummary.cardBuildInfo.stack.getValue()).toBe(testAppStack || defaultStack);

      appSummary.cardDeployInfo.waitForTitle('Deployment Info');
      expect(appSummary.cardDeployInfo.docker.isDisplayed()).toBeTruthy();
      appSummary.cardDeployInfo.docker.getValue().then(uiDockerUrl => {
        expect(uiDockerUrl).toBeDefined();
        expect(uiDockerUrl).toEqual(dockerUrl);
      });
    });


  });


  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
