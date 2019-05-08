import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { OrgFormPage } from './org-form-page.po';

describe('Create Organization', () => {
  let e2eSetup;
  let orgFormPage: OrgFormPage;
  let cfTopLevelPage: CfTopLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgName: string;
  let secondOrgName: string;
  let quotaName: string;

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
      secondOrgName = orgName + '2';
      quotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');

      cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.addOrgQuota(cfGuid, quotaName);
    });
  });

  beforeEach(() => {
    cfTopLevelPage = new CfTopLevelPage();
    orgFormPage = new OrgFormPage(`/cloud-foundry/${cfGuid}/add-org`);
    orgFormPage.navigateTo();
    orgFormPage.waitForPage();
  });

  it('- should reach create organization page', () => {
    expect(orgFormPage.isActivePage()).toBeTruthy();
  });

  it('- should create organization with default quota', () => {
    orgFormPage.stepper.setOrg(orgName);
    orgFormPage.submit();

    cfTopLevelPage.clickOnOrg(orgName);
  });

  it('- should create organization with specific quota', () => {
    orgFormPage.stepper.setOrg(secondOrgName);
    orgFormPage.stepper.setQuotaDefinition(quotaName);
    orgFormPage.submit();

    cfTopLevelPage.clickOnOrg(secondOrgName);
    expect(element(by.tagName('app-card-cf-org-user-details')).getText()).toContain(quotaName);
  });

  afterAll(() => {
    return promise.all([
      cfHelper.deleteOrgIfExisting(cfGuid, orgName),
      cfHelper.deleteOrgIfExisting(cfGuid, secondOrgName)
    ]).then(() => cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, quotaName));
  });
});
