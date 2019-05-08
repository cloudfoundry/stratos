import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfSpaceLevelPage } from '../space-level/cf-space-level-page.po';
import { SpaceFormPage } from './space-form-page.po';

describe('Edit Space', () => {
  let e2eSetup;
  let spaceFormPage: SpaceFormPage;
  let cfOrgLevelPage: CfSpaceLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let orgName: string;
  let spaceQuotaName: string;
  let spaceGuid: string;
  let spaceName: string;
  let newSpaceName: string;

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
      newSpaceName = orgName + '2';
      spaceQuotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');

      cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => {
        orgGuid = org.metadata.guid;

        return promise.all([
          cfHelper.addSpaceQuota(cfGuid, orgGuid, spaceQuotaName) as promise.Promise<any>,
          cfHelper.baseAddSpace(cfGuid, orgGuid, spaceName).then(space => spaceGuid = space.metadata.guid),
        ]);
      });
    });
  });

  beforeEach(() => {
    cfOrgLevelPage = new CfSpaceLevelPage();
    spaceFormPage = new SpaceFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}/edit-space`);
    spaceFormPage.navigateTo();
    spaceFormPage.waitForPage();
  });

  it('- should reach edit space page', () => {
    expect(spaceFormPage.isActivePage()).toBeTruthy();
  });

  it('- should update space name and quota', () => {
    spaceFormPage.stepper.setSpaceName(newSpaceName);
    spaceFormPage.stepper.setQuotaDefinition(spaceQuotaName);
    spaceFormPage.submit();

    expect(cfOrgLevelPage.header.getTitleText()).toBe(newSpaceName);
    expect(element(by.tagName('app-card-cf-space-details')).getText()).toContain(spaceQuotaName);
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, newSpaceName)
      .then(() => cfHelper.deleteSpaceQuotaDefinitionIfExisting(cfGuid, spaceQuotaName));
  });
});
