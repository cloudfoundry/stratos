import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { extendE2ETestTime } from '../../helpers/extend-test-helpers';
import { TableComponent } from '../../po/table.po';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { QuotaFormPage } from './quota-form-page.po';

describe('Manage Quota', () => {
  let e2eSetup;
  let quotaFormPage: QuotaFormPage;
  let cfTopLevelPage: CfTopLevelPage = new CfTopLevelPage();
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
  });

  beforeAll(() => {
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

  describe('#create', () => {
    const timeout = 100000;
    extendE2ETestTime(timeout);

    beforeEach(() => {
      quotaFormPage = new QuotaFormPage(`/cloud-foundry/${cfGuid}/add-quota`);
      quotaFormPage.navigateTo();
      quotaFormPage.waitForPage();
    });

    it('- should validate quota name', () => {
      expect(quotaFormPage.isActivePage()).toBeTruthy();

      expect(quotaFormPage.stepper.canNext()).toBeFalsy();

      quotaFormPage.stepper.setName(secondQuotaName);
      // Change form constrols to ensure the validation happens
      quotaFormPage.stepper.setTotalServices('10');
      expect(element(by.css('.add-quota-stepper')).getText()).not.toContain('quota with this name already exists.');

      quotaFormPage.stepper.setName(quotaName);
      quotaFormPage.stepper.setTotalServices('10');
      expect(element(by.css('.add-quota-stepper')).getText()).toContain('A quota with this name already exists.');

      // should go to quotas when cancelled
      quotaFormPage.stepper.cancel();
      quotaFormPage.stepper.waitUntilNotShown();

      expect(cfTopLevelPage.subHeader.getTitleText()).toBe('Organization Quotas');
    });

    it('- should create quota', () => {
      const obj = {};
      obj[quotaFormPage.stepper.name] = secondQuotaName;
      obj[quotaFormPage.stepper.totalServices] = '1';
      obj[quotaFormPage.stepper.totalRoutes] = '10';
      obj[quotaFormPage.stepper.memoryLimit] = '1024';
      obj[quotaFormPage.stepper.instanceMemoryLimit] = '1';
      obj[quotaFormPage.stepper.totalReservedRoutePorts] = '1';
      obj[quotaFormPage.stepper.appInstanceLimit] = '1';
      quotaFormPage.stepper.getStepperForm().fill(obj);
      expect(quotaFormPage.stepper.canNext()).toBeTruthy();
      quotaFormPage.submit();
      quotaFormPage.stepper.waitUntilNotShown();
      cfTopLevelPage.clickOnQuota(secondQuotaName);
    });
  });

  describe('#destroy', () => {
    beforeAll(() => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.goToQuotasTab();
    });

    it('- should delete quota', () => {
      cfTopLevelPage.deleteQuota(secondQuotaName);
      const table = new TableComponent();
      table.waitUntilNotBusy();
    });

    it('- should not delete quota if attached to org', () => {
      cfTopLevelPage.deleteQuota(quotaName, false);
      // Wait until the delete operation has finished
      const table = new TableComponent();
      table.waitUntilNotBusy();
      expect(element(by.css('.table-row__error')).getText()).toContain('Please delete the organization associations');
    });
  });

  describe('#update', () => {
    it('Go To Quota', () => {
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
