import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfOrgLevelPage } from '../org-level/cf-org-level-page.po';
import { OrgFormPage } from './org-form-page.po';

describe('Edit Organization', () => {
  let e2eSetup;
  let orgFormPage: OrgFormPage;
  let cfOrgLevelPage: CfOrgLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let orgName: string;
  let quotaName: string;
  let newOrgName: string;

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
      newOrgName = orgName + '2';
      quotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');

      cfHelper = new CFHelpers(e2eSetup);
      return promise.all([
        cfHelper.addOrgQuota(cfGuid, quotaName) as promise.Promise<any>,
        cfHelper.baseAddOrg(cfGuid, orgName).then(org => orgGuid = org.metadata.guid),
      ]);
    });
  });

  beforeEach(() => {
    cfOrgLevelPage = new CfOrgLevelPage();
    orgFormPage = new OrgFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/edit-org`);
    orgFormPage.navigateTo();
    orgFormPage.waitForPage();
  });

  it('- should reach edit organization page', () => {
    expect(orgFormPage.isActivePage()).toBeTruthy();
  });

  it('- should update org name and quota', () => {
    orgFormPage.stepper.setOrg(newOrgName);
    orgFormPage.stepper.setQuotaDefinition(quotaName);
    orgFormPage.submit();

    expect(cfOrgLevelPage.header.getTitleText()).toBe(newOrgName);
    expect(element(by.tagName('app-card-cf-org-user-details')).getText()).toContain(quotaName);
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, newOrgName)
      .then(() => cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, quotaName));
  });
});
