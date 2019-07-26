import { e2e } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { ConsoleUserType } from '../../helpers/e2e-helpers';
import { CFPage } from '../../po/cf-page.po';
import { ConfirmDialogComponent } from '../../po/confirm-dialog';
import { SideNavMenuItem } from '../../po/side-nav.po';
import { CfTopLevelPage } from './cf-top-level-page.po';
import { ConfigInviteClientDialog } from './config-invite-client-dialog.po';

/**
 * Test the invite user config process.
 * Note - We test non-admin disabled case in `src/test-e2e/cloud-foundry/cf-level/cf-top-level-e2e.spec.ts`
 */
describe('CF - Invite User Configuration - ', () => {
  let defaultCf: E2EConfigCloudFoundry = e2e.secrets.getDefaultCFEndpoint();

  let cfPage: CfTopLevelPage;

  beforeAll(() => {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user);
  });

  describe('Configure - ', () => {

    beforeEach(() => {
      // There is only one CF endpoint registered (since that is what we setup)
      const page = new CFPage();
      page.sideNav.goto(SideNavMenuItem.CloudFoundry);
      return CfTopLevelPage.detect().then(p => {
        cfPage = p;
        cfPage.waitForPageOrChildPage();
        cfPage.loadingIndicator.waitUntilNotShown();
      });
    });

    beforeEach(() => cfPage.isUserInviteConfigured().then(configured => {
      if (configured) {
        cfPage.clickInviteDisable();
        return ConfirmDialogComponent.expectDialogAndConfirm('Disable', 'Disable User Invitations');
      }
    })
    );

    it('Bad Creds', () => {
      expect(cfPage.isUserInviteConfigured(true)).toBeFalsy();
      expect(cfPage.canConfigureUserInvite()).toBeTruthy();

      cfPage.clickInviteConfigure();
      const dialog = new ConfigInviteClientDialog();
      expect(dialog.canConfigure()).toBeFalsy();
      dialog.form.fill({ clientid: 'clientid' });
      expect(dialog.canConfigure()).toBeFalsy();
      dialog.form.fill({ clientsecret: 'clientsecret' });
      expect(dialog.canConfigure()).toBeTruthy();
      dialog.configure();
      dialog.snackBar.waitForMessage('Could not check Client: Bad credentials');
      dialog.snackBar.close();
      dialog.cancel();
      expect(cfPage.isUserInviteConfigured(true)).toBeFalsy();
      expect(cfPage.canConfigureUserInvite()).toBeTruthy();
    });

    it('Good Creds', () => {
      expect(cfPage.isUserInviteConfigured(true)).toBeFalsy();
      expect(cfPage.canConfigureUserInvite()).toBeTruthy();

      cfPage.clickInviteConfigure();
      const dialog = new ConfigInviteClientDialog();
      expect(dialog.canConfigure()).toBeFalsy();
      dialog.form.fill({ clientid: defaultCf.invite.clientId, clientsecret: defaultCf.invite.clientSecret });
      expect(dialog.canConfigure()).toBeTruthy();
      dialog.configure();
      expect(cfPage.isUserInviteConfigured(true)).toBeTruthy();
      expect(cfPage.canConfigureUserInvite()).toBeFalsy();
    });
  });

  describe('UnConfigure - ', () => {
    it('UnConfigure', () => {
      // Initial state
      expect(cfPage.isUserInviteConfigured(true)).toBeTruthy();
      expect(cfPage.canConfigureUserInvite()).toBeFalsy();

      cfPage.clickInviteDisable();
      ConfirmDialogComponent.expectDialogAndConfirm('Disable', 'Disable User Invitations');

      // End State
      expect(cfPage.isUserInviteConfigured(true)).toBeFalsy();
      expect(cfPage.canConfigureUserInvite()).toBeTruthy();
    });
  });

});
