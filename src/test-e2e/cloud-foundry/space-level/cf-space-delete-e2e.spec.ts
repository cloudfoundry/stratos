import { by, element, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { CFHelpers } from '../../helpers/cf-e2e-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { CFPage } from '../../po/cf-page.po';
import { ConfirmDialogComponent } from '../../po/confirm-dialog';
import { ListComponent } from '../../po/list.po';
import { MetaCardTitleType } from '../../po/meta-card.po';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from '../cf-level/cf-top-level-page.po';
import { CfOrgLevelPage } from './../org-level/cf-org-level-page.po';

describe('Delete Space', () => {
  let e2eSetup;
  let cfGuid: string;
  let orgGuid: string;
  let orgName: string;
  let spaceName: string;
  let appName: string;

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
      appName = E2EHelpers.createCustomName(E2EHelpers.e2eItemPrefix + 'app');
      const cfHelper = new CFHelpers(e2eSetup);
      return cfHelper.baseAddOrg(cfGuid, orgName).then(org => {
        orgGuid = org.metadata.guid;
        return cfHelper.baseAddSpace(cfGuid, orgGuid, spaceName).then(space => {
          return cfHelper.basicCreateApp(cfGuid, space.metadata.guid, appName);
        });
      });
    });
  });

  afterAll(() => {
    const cfHelper = new CFHelpers(e2eSetup);
    // Delete org and space (in case the test errored)
    return cfHelper.deleteSpaceIfExisting(cfGuid, orgGuid, spaceName).then(() => cfHelper.deleteOrgIfExisting(cfGuid, orgName));
  });

  it('Should be able to delete space that contains a route', () => {
    const page = new CFPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    return CfTopLevelPage.detect().then(cfPage => {
      cfPage.waitForPageOrChildPage();
      cfPage.loadingIndicator.waitUntilNotShown();
      cfPage.goToOrgTab();

      // Find the Org and click on it
      const list = new ListComponent();
      return list.cards.findCardByTitle(orgName, MetaCardTitleType.CUSTOM, true).then(card => {
        expect(card).toBeDefined();
        card.click();

        return CfOrgLevelPage.detect().then(o => {
          const orgPage = o;
          orgPage.waitForPageOrChildPage();
          orgPage.loadingIndicator.waitUntilNotShown();
          orgPage.goToSpacesTab();
          return list.cards.findCardByTitle(spaceName, MetaCardTitleType.CUSTOM, true).then(spaceCard => {
            expect(spaceCard).toBeDefined();
            spaceCard.openActionMenu().then(menu => {
              menu.waitUntilShown();
              menu.clickItem('Delete');
              ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Space', spaceName);
              spaceCard.waitUntilNotShown();
              // Space should have been deleted
              expect(element(by.tagName('app-cards')).getText()).not.toContain(spaceName);
            });
          });
        });
      });
    });
  });
});
