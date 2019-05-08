import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfOrgLevelPage } from './cf-org-level-page.po';
import { SpaceFormPage } from './space-form-page.po';

describe('Create Space', () => {
  let e2eSetup;
  let orgFormPage: SpaceFormPage;
  let cfOrgLevelPage: CfOrgLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgName: string;
  let orgGuid: string;
  let spaceName: string;
  let secondSpaceName: string;
  let spaceQuotaName: string;

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
      spaceName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'space');
      secondSpaceName = orgName + '2';
      spaceQuotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');

      cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => {
        orgGuid = org.metadata.guid;
        return cfHelper.addSpaceQuota(cfGuid, orgGuid, spaceQuotaName);
      });
    });
  });

  beforeEach(() => {
    cfOrgLevelPage = new CfOrgLevelPage();
    orgFormPage = new SpaceFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/add-space`);
    orgFormPage.navigateTo();
    orgFormPage.waitForPage();
  });

  it('- should reach create organization page', () => {
    expect(orgFormPage.isActivePage()).toBeTruthy();
  });

  it('- should create organization with default quota', () => {
    orgFormPage.stepper.setSpaceName(spaceName);
    orgFormPage.submit();

    cfOrgLevelPage.clickOnSpace(spaceName);
  });

  it('- should create organization with specific quota', () => {
    orgFormPage.stepper.setSpaceName(secondSpaceName);
    orgFormPage.stepper.setQuotaDefinition(spaceQuotaName);
    orgFormPage.submit();

    cfOrgLevelPage.clickOnSpace(secondSpaceName);
    expect(element(by.tagName('app-card-cf-space-details')).getText()).toContain(spaceQuotaName);
  });

  afterAll(() => {
    return promise.all([
      cfHelper.deleteOrgIfExisting(cfGuid, orgName),
    ]).then(() => cfHelper.deleteSpaceQuotaDefinitionIfExisting(cfGuid, spaceQuotaName));
  });
});
