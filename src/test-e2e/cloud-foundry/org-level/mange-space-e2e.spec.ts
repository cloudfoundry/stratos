import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfSpaceLevelPage } from '../space-level/cf-space-level-page.po';
import { CfOrgLevelPage } from './cf-org-level-page.po';
import { SpaceFormPage } from './space-form-page.po';

describe('Manage Space', () => {
  let e2eSetup;
  let spaceFormPage: SpaceFormPage;
  let cfOrgLevelPage: CfOrgLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgName: string;
  let orgGuid: string;
  let spaceName: string;
  let secondSpaceName: string;
  let spaceQuotaName: string;
  let secondSpaceQuotaName: string;

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
      secondSpaceName = spaceName + '2';
      spaceQuotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');
      secondSpaceQuotaName = '2' + spaceQuotaName;

      cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => {
        orgGuid = org.metadata.guid;
        return promise.all([
          cfHelper.addSpaceQuota(cfGuid, orgGuid, spaceQuotaName),
          cfHelper.addSpaceQuota(cfGuid, orgGuid, secondSpaceQuotaName),
        ]);
      });
    });
  });

  beforeEach(() => {
    cfOrgLevelPage = new CfOrgLevelPage();
  });

  describe('#create', () => {
    beforeEach(() => {
      spaceFormPage = new SpaceFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/add-space`);
      spaceFormPage.navigateTo();
      spaceFormPage.waitForPage();
    });

    it('- should reach create space page', () => {
      expect(spaceFormPage.isActivePage()).toBeTruthy();
    });

    it('- should create space with default quota', () => {
      spaceFormPage.stepper.setSpaceName(spaceName);
      spaceFormPage.submit();

      cfOrgLevelPage.clickOnSpace(spaceName);
    });

    it('- should go to spaces when canceled', () => {
      spaceFormPage.stepper.cancel();
      expect(cfOrgLevelPage.subHeader.getTitleText()).toBe('Spaces');
    });

    it('- should validate space name', () => {
      expect(spaceFormPage.stepper.canNext()).toBeFalsy();

      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      expect(spaceFormPage.stepper.canNext()).toBeTruthy();

      spaceFormPage.stepper.setSpaceName(spaceName);
      expect(spaceFormPage.stepper.canNext()).toBeFalsy();
    });

    it('- should create space with specific quota', () => {
      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      spaceFormPage.stepper.setQuotaDefinition(spaceQuotaName);
      spaceFormPage.submit();

      cfOrgLevelPage.clickOnSpace(secondSpaceName);
      expect(element(by.tagName('app-card-cf-space-details')).getText()).toContain(spaceQuotaName);
    });
  });

  describe('#destroy', () => {
    beforeEach(() => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpacesTab();
    });

    it('- should delete space', () => {
      expect(element(by.tagName('app-cards')).getText()).toContain(secondSpaceName);
      cfOrgLevelPage.deleteSpace(secondSpaceName);
      expect(element(by.tagName('app-cards')).getText()).not.toContain(secondSpaceName);
    });
  });

  describe('#update', () => {
    let cfSpaceLevelPage: CfSpaceLevelPage;

    beforeEach(() => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpacesTab();
      cfOrgLevelPage.clickOnSpace(spaceName);

      cfSpaceLevelPage = new CfSpaceLevelPage();
      cfSpaceLevelPage.subHeader.clickIconButton('edit');
    });

    it('- should update space name and quota', () => {
      spaceFormPage = new SpaceFormPage();
      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      spaceFormPage.stepper.setQuotaDefinition(spaceQuotaName);
      spaceFormPage.submit();

      expect(cfOrgLevelPage.header.getTitleText()).toBe(secondSpaceName);
      expect(element(by.tagName('app-card-cf-space-details')).getText()).toContain(spaceQuotaName);
    });
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, orgName).then(() =>
      promise.all([
        cfHelper.deleteSpaceQuotaDefinitionIfExisting(cfGuid, spaceQuotaName),
        cfHelper.deleteSpaceQuotaDefinitionIfExisting(cfGuid, secondSpaceQuotaName)
      ])
    );
  });
});
