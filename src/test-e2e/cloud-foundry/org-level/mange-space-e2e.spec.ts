import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { TableComponent } from '../../po/table.po';
import { CfSpaceLevelPage } from '../space-level/cf-space-level-page.po';
import { CfOrgLevelPage } from './cf-org-level-page.po';
import { SpaceFormPage } from './space-form-page.po';

describe('Manage Space', () => {
  let e2eSetup;
  let spaceFormPage: SpaceFormPage;
  let cfOrgLevelPage: CfOrgLevelPage = new CfOrgLevelPage();
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
  });

  beforeAll(() => {
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
        cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
        return promise.all([
          cfHelper.addSpaceQuota(cfGuid, orgGuid, spaceQuotaName),
          cfHelper.addSpaceQuota(cfGuid, orgGuid, secondSpaceQuotaName),
        ]);
      });
    });
  });

  describe('#create', () => {

    beforeAll(() => {
      spaceFormPage = new SpaceFormPage(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/add-space`);
      spaceFormPage.navigateTo();
      spaceFormPage.waitForPage();
    });

    it('- should reach create space page', () => {
      expect(spaceFormPage.isActivePage()).toBeTruthy();

      spaceFormPage.stepper.cancel();
      spaceFormPage.stepper.waitUntilNotShown();
      expect(cfOrgLevelPage.subHeader.getTitleText()).toBe('Spaces');
    });

    it('- should create space with default quota', () => {
      cfOrgLevelPage.subHeader.clickIconButton('add');

      spaceFormPage.waitForPage();
      spaceFormPage.stepper.setSpaceName(spaceName);
      spaceFormPage.submit();
      spaceFormPage.stepper.waitUntilNotShown();

      cfOrgLevelPage.clickOnCard(spaceName);
      const cfSpaceLevelPage = new CfSpaceLevelPage();
      expect(cfSpaceLevelPage.subHeader.getTitleText()).toBe('Summary');

      cfSpaceLevelPage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
        // Back to org page
        breadcrumbs[1].click();
        // Back to spaces page
        cfOrgLevelPage.waitForChildPage('/spaces');
      });

    });

    it('- should validate space name', () => {
      cfOrgLevelPage.subHeader.clickIconButton('add');
      spaceFormPage.waitForPage();

      expect(spaceFormPage.stepper.canNext()).toBeFalsy();

      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      expect(spaceFormPage.stepper.canNext()).toBeTruthy();

      spaceFormPage.stepper.setSpaceName(spaceName);
      expect(spaceFormPage.stepper.canNext()).toBeFalsy();

      spaceFormPage.stepper.cancel();
      spaceFormPage.stepper.waitUntilNotShown();
    });

    it('- should create space with specific quota', () => {
      cfOrgLevelPage.subHeader.clickIconButton('add');
      spaceFormPage.waitForPage();

      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      spaceFormPage.stepper.setQuotaDefinition(spaceQuotaName);
      spaceFormPage.submit();

      cfOrgLevelPage.clickOnCard(secondSpaceName);
      expect(element(by.tagName('app-card-cf-space-details')).getText()).toContain(spaceQuotaName);
    });
  });

  describe('#destroy', () => {
    it('Nav to spaces tab', () => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpacesTab();
    });

    it('- should delete space', () => {
      expect(element(by.tagName('app-cards')).getText()).toContain(secondSpaceName);
      cfOrgLevelPage.deleteSpace(secondSpaceName);
      const table = new TableComponent();
      table.waitUntilNotBusy();
      expect(element(by.tagName('app-cards')).getText()).not.toContain(secondSpaceName);
    });
  });

  describe('#update', () => {
    let cfSpaceLevelPage: CfSpaceLevelPage;

    it('Nav to spaces tab', () => {
      cfOrgLevelPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      cfOrgLevelPage.navigateTo();
      cfOrgLevelPage.goToSpacesTab();
      cfOrgLevelPage.clickOnCard(spaceName);

      cfSpaceLevelPage = new CfSpaceLevelPage();
      cfSpaceLevelPage.subHeader.clickIconButton('edit');
    });

    it('- should update space name and quota', () => {
      spaceFormPage = new SpaceFormPage();
      spaceFormPage.stepper.setSpaceName(secondSpaceName);
      spaceFormPage.stepper.setQuotaDefinition(spaceQuotaName);
      spaceFormPage.submit();
      spaceFormPage.stepper.waitUntilNotShown();

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
