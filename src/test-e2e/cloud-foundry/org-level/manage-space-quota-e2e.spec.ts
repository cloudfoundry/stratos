import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { extendE2ETestTime } from '../../helpers/extend-test-helpers';
import { CfOrgLevelPage } from '../org-level/cf-org-level-page.po';
import { SpaceQuotaFormPage } from './space-quota-form-page.po';

describe('Manage Space Quota', () => {
  let e2eSetup;
  let quotaFormPage: SpaceQuotaFormPage;
  let cfOrgLevelPage: CfOrgLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let orgName: string;
  let quotaName: string;
  let secondQuotaName: string;

  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);

    return protractor.promise.controlFlow().execute(() => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();
      // Only available until after `info` call has completed as part of setup
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      orgName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'org');
      quotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');
      secondQuotaName = '2' + quotaName;

      cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => orgGuid = org.metadata.guid)
      .then(() => cfHelper.addSpaceQuota(cfGuid, orgGuid, quotaName));
    });
  });

  beforeEach(() => {
    cfOrgLevelPage = new CfOrgLevelPage();
  });

  describe('#create', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    beforeEach(() => {
      quotaFormPage = new SpaceQuotaFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/add-space-quota`);
      quotaFormPage.navigateTo();
      quotaFormPage.waitForPage();
    });

    it('- should reach create quota page', () => {
      expect(quotaFormPage.isActivePage()).toBeTruthy();
    });

    it('- should validate quota name', () => {
      expect(quotaFormPage.stepper.canNext()).toBeFalsy();

      quotaFormPage.stepper.setName(secondQuotaName);
      expect(element(by.css('.add-space-quota-stepper')).getText()).not.toContain('quota with this name already exists.');

      quotaFormPage.stepper.setName(quotaName);
      expect(element(by.css('.add-space-quota-stepper')).getText()).toContain('A space quota with this name already exists.');
    });

    it('- should create quota', () => {
      quotaFormPage.stepper.setName(secondQuotaName);
      quotaFormPage.stepper.setTotalServices('1');
      quotaFormPage.stepper.setTotalRoutes('10');
      quotaFormPage.stepper.setMemoryLimit('1024');
      quotaFormPage.stepper.setInstanceMemoryLimit('1');
      quotaFormPage.stepper.setTotalReservedRoutePorts('0');
      quotaFormPage.stepper.setAppInstanceLimit('1');
      quotaFormPage.submit();
      quotaFormPage.stepper.waitUntilNotShown();
      cfOrgLevelPage.clickOnSpaceQuota(secondQuotaName);
    });

    it('- should go to quotas when canceled', () => {
      quotaFormPage.stepper.cancel();
      expect(cfOrgLevelPage.subHeader.getTitleText()).toBe('Space Quotas');
    });
  });

  describe('#destroy', () => {
    beforeEach(() => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpaceQuotasTab();
    });

    it('- should delete space quota', () => {
      expect(element(by.tagName('app-table')).getText()).toContain(secondQuotaName);
      cfOrgLevelPage.deleteSpaceQuota(secondQuotaName);
      expect(element(by.tagName('app-table')).getText()).not.toContain(secondQuotaName);
    });
  });

  describe('#update', () => {
    beforeEach(() => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpaceQuotasTab();
      cfOrgLevelPage.clickOnSpaceQuota(quotaName);

      cfOrgLevelPage.header.clickIconButton('edit');
    });

    it('- should update quota name', () => {
      quotaFormPage = new SpaceQuotaFormPage();
      quotaFormPage.stepper.setName(secondQuotaName);
      quotaFormPage.submit();

      expect(cfOrgLevelPage.header.getTitleText()).toBe(secondQuotaName);
    });
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, orgName).then(() =>
      promise.all([
        cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, quotaName),
        cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, secondQuotaName)
      ])
    );
  });
});
