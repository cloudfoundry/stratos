import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CfTopLevelPage } from './cf-top-level-page.po';


describe('CF - Top Level - ', () => {

  let cfPage: CfTopLevelPage;
  let e2eSetup: E2ESetup;
  let defaultCf: E2EConfigCloudFoundry;

  function setup(user: ConsoleUserType) {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(user)
      .loginAs(user)
      .getInfo(user);
  }


  function navToCfPage() {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    cfPage = CfTopLevelPage.forEndpoint(endpointGuid);
    cfPage.navigateTo();
    cfPage.waitForPageOrChildPage();
  }

  function testTitle() {
    expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
  }


  describe('As Admin', () => {
    beforeEach(() => {
      setup(ConsoleUserType.admin);
    });

    describe('Basic Tests - ', () => {

      beforeEach(navToCfPage);

      it('Breadcrumb', testTitle);

      it('Summary Panel', () => {
        expect(cfPage.getInstanceAddress().getValue()).toBe(defaultCf.url);
        expect(cfPage.getUsername().getValue()).toBe(defaultCf.creds.admin.username);
        expect(cfPage.getAdministrator().getValue()).toBe('Yes');
      });

      // fit('Walk Tabs', () => {
      //   cfPage.goToOrgTab();
      //   cfPage.goToUsersTab();
      //   cfPage.goToFirehoseTab();
      //   cfPage.goToFeatureFlagsTab();
      //   cfPage.goToBuildPacksTab();
      //   cfPage.goToStacksTab();
      //   cfPage.goToSecurityGroupsTab();
      //   cfPage.goToSummaryTab();
      // });

    });

  });

  describe('As User', () => {
    beforeEach(() => {
      setup(ConsoleUserType.user);
    });

    describe('Basic Tests - ', () => {

      beforeEach(navToCfPage);

      it('Breadcrumb', () => {
        expect(cfPage.header.getTitleText()).toBe(defaultCf.name);
      });

      it('Summary Panel', () => {
        expect(cfPage.getInstanceAddress().getValue()).toBe(defaultCf.url);
        expect(cfPage.getUsername().getValue()).toBe(defaultCf.creds.nonAdmin.username);
        expect(cfPage.getAdministrator().getValue()).toBe('No');
      });

      it('Walk Tabs', () => {
        cfPage.goToOrgTab();
        cfPage.goToUsersTab();
        // cfPage.goToFirehoseTab();
        cfPage.goToFeatureFlagsTab();
        cfPage.goToBuildPacksTab();
        cfPage.goToStacksTab();
        cfPage.goToSecurityGroupsTab();
        cfPage.goToSummaryTab();
      });

    });
  });

});
