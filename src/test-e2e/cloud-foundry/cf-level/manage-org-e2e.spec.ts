import { by, element, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CfOrgLevelPage } from '../org-level/cf-org-level-page.po';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { OrgFormPage } from './org-form-page.po';

describe('Manage Organization', () => {
  let e2eSetup;
  let orgFormPage: OrgFormPage;
  let cfTopLevelPage: CfTopLevelPage = new CfTopLevelPage();
  let cfOrgLevelPage: CfOrgLevelPage;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgName: string;
  let secondOrgName: string;
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
      secondOrgName = orgName + '2';
      quotaName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'quota');
      secondQuotaName = '2' + quotaName;

      cfHelper = new CFHelpers(e2eSetup);
      return promise.all([
        cfHelper.addOrgQuota(cfGuid, quotaName),
        cfHelper.addOrgQuota(cfGuid, secondQuotaName)
      ]);
    });
  });

  describe('#create', () => {
    beforeEach(() => {
      orgFormPage = new OrgFormPage(`/cloud-foundry/${cfGuid}/add-org`);
      orgFormPage.navigateTo();
      orgFormPage.waitForPage();
    });

    it('- should reach create organization page', () => {
      expect(orgFormPage.isActivePage()).toBeTruthy();

      // should go to organizations when cancelled
      orgFormPage.stepper.cancel();
      orgFormPage.stepper.waitUntilNotShown();
      expect(cfTopLevelPage.subHeader.getTitleText()).toBe('Organizations');
    });

    it('- should create organization with default quota', () => {
      orgFormPage.stepper.setOrg(orgName);
      orgFormPage.submit();
      orgFormPage.stepper.waitUntilNotShown();
      expect(cfTopLevelPage.subHeader.getTitleText()).toBe('Organizations');
      cfTopLevelPage.clickOnCard(orgName);
    });

    it('- should validate org name', () => {
      expect(orgFormPage.stepper.canNext()).toBeFalsy();

      orgFormPage.stepper.setOrg(secondOrgName);
      expect(orgFormPage.stepper.canNext()).toBeTruthy();

      orgFormPage.stepper.setOrg(orgName);
      expect(orgFormPage.stepper.canNext()).toBeFalsy();
    });

    it('- should create organization with specific quota', () => {
      orgFormPage.stepper.setOrg(secondOrgName);
      orgFormPage.stepper.setQuotaDefinition(quotaName);
      orgFormPage.submit();

      cfTopLevelPage.clickOnCard(secondOrgName);
      expect(element(by.tagName('app-card-cf-org-user-details')).getText()).toContain(quotaName);
    });

  });

  describe('#destroy', () => {
    it('- Go To Org', () => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.waitForChildPage('/summary');
      cfTopLevelPage.goToOrgTab();
    });

    it('- should delete org', () => {
      cfTopLevelPage.deleteOrg(secondOrgName);

      expect(element(by.tagName('app-cards')).getText()).not.toContain(secondOrgName);
    });
  });

  describe('#show', () => {
    it('- Go To Org', () => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.waitForChildPage('/summary');
      cfTopLevelPage.goToOrgTab();
      cfTopLevelPage.clickOnCard(orgName);

      cfOrgLevelPage = new CfOrgLevelPage();
    });

    it('- should show the org CLI commands', () => {
      cfOrgLevelPage.subHeader.clickIconButton('keyboard');

      expect(cfOrgLevelPage.header.getTitleText()).toBe('CLI Info');
      cfOrgLevelPage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
        expect(breadcrumbs.length).toBe(2);
        expect(breadcrumbs[1].label).toBe(orgName);
      });
    });
  });

  describe('#update', () => {
    it('- Go To Org', () => {
      cfTopLevelPage = CfTopLevelPage.forEndpoint(cfGuid);
      cfTopLevelPage.navigateTo();
      cfTopLevelPage.waitForChildPage('/summary');
      cfTopLevelPage.goToOrgTab();
      cfTopLevelPage.clickOnCard(orgName);

      cfOrgLevelPage = new CfOrgLevelPage();
      cfOrgLevelPage.subHeader.clickIconButton('mode_edit');
    });

    it('- should update org name and quota', () => {
      orgFormPage = new OrgFormPage();
      orgFormPage.stepper.setOrg(secondOrgName);
      orgFormPage.stepper.setQuotaDefinition(secondQuotaName);
      orgFormPage.submit();
      orgFormPage.stepper.waitUntilNotShown();

      expect(cfOrgLevelPage.header.getTitleText()).toBe(secondOrgName);
      expect(element(by.tagName('app-card-cf-org-user-details')).getText()).toContain(secondQuotaName);
    });
  });

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, secondOrgName).then(() =>
      promise.all([
        cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, quotaName),
        cfHelper.deleteQuotaDefinitionIfExisting(cfGuid, secondQuotaName)
      ])
    );
  });
});
