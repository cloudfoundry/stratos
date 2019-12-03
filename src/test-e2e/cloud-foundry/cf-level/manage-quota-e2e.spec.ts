import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { extendE2ETestTime } from '../../helpers/extend-test-helpers';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { QuotaFormPage } from './quota-form-page.po';
import { TableComponent } from '../../po/table.po';

describe('Manage Quota', () => {
  let e2eSetup;
  let quotaFormPage: QuotaFormPage;
  let cfTopLevelPage: CfTopLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
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
      return cfHelper.addOrgQuota(cfGuid, quotaName).then((quota) => {
        return cfHelper.baseAddOrg(cfGuid, orgName, { quota_definition_guid: quota.metadata.guid });
      });
    });
  });

  beforeEach(() => {
    cfTopLevelPage = new CfTopLevelPage();
  });

  describe('#create', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    beforeEach(() => {
      quotaFormPage = new QuotaFormPage(`/cloud-foundry/${cfGuid}/add-quota`);
      quotaFormPage.navigateTo();
      quotaFormPage.waitForPage();
    });

    it('- should reach create quota page', () => {
      expect(quotaFormPage.isActivePage()).toBeTruthy();
    });

    it('- should validate quota name', () => {
      expect(quotaFormPage.stepper.canNext()).toBeFalsy();

      quotaFormPage.stepper.setName(secondQuotaName);
      expect(element(by.css('.add-quota-stepper')).getText()).not.toContain('quota with this name already exists.');

      quotaFormPage.stepper.setName(quotaName);
      expect(element(by.css('.add-quota-stepper')).getText()).toContain('A quota with this name already exists.');
    });

    it('- should create quota', () => {
      quotaFormPage.stepper.setName(secondQuotaName);
      quotaFormPage.stepper.setTotalServices('1');
      quotaFormPage.stepper.setTotalRoutes('10');
      quotaFormPage.stepper.setMemoryLimit('1024');
      quotaFormPage.stepper.setInstanceMemoryLimit('1');
      quotaFormPage.stepper.setTotalReservedRoutePorts('1');
      quotaFormPage.stepper.setAppInstanceLimit('1');
      quotaFormPage.submit();
      quotaFormPage.stepper.waitUntilNotShown();
      cfTopLevelPage.clickOnQuota(secondQuotaName);
    });

    it('- should go to quotas when canceled', () => {
      quotaFormPage.stepper.cancel();
      expect(cfTopLevelPage.subHeader.getTitleText()).toBe('Organization Quotas');
    });
  });

  describe('#destroy', () => {
    beforeEach(() => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.goToQuotasTab();
    });

    it('- should delete quota', () => {
      expect(element(by.tagName('app-table')).getText()).toContain(secondQuotaName);
      cfTopLevelPage.deleteQuota(secondQuotaName);
      expect(element(by.tagName('app-table')).getText()).not.toContain(secondQuotaName);
    });

    it('- should not delete quota if attached to org', () => {
      expect(element(by.tagName('app-table')).getText()).toContain(quotaName);
      cfTopLevelPage.deleteQuota(quotaName, false);
      // Wait until the delete operation has finished
      const table = new TableComponent();
      table.waitUntilNotBusy();
      expect(element(by.css('.table-row__error')).getText()).toContain('Please delete the organization associations');
    });
  });

  describe('#update', () => {
    beforeEach(() => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.goToQuotasTab();
      cfTopLevelPage.clickOnQuota(quotaName);

      cfTopLevelPage.header.clickIconButton('edit');
    });

    it('- should update quota name', () => {
      quotaFormPage = new QuotaFormPage();
      quotaFormPage.stepper.setName(secondQuotaName);
      quotaFormPage.submit();

      expect(cfTopLevelPage.header.getTitleText()).toBe(secondQuotaName);
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
