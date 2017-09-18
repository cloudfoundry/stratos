(function () {
  'use strict';

  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var cfHelpers = require('./po/helpers.po');
  var resetTo = require('../../../../app-core/frontend/test/e2e/po/resets.po');
  var loginPage = require('../../../../app-core/frontend/test/e2e/po/login-page.po');
  var proxyModel = require('../../../../app-core/frontend/test/e2e/po/models/proxy-model.po');
  var actionsMenuHelper = require('../../../../app-core/frontend/test/e2e/po/widgets/actions-menu.po');
  var confirmationModalHelper = require('../../../../app-core/frontend/test/e2e/po/widgets/confirmation-modal.po');
  var endpointsListCf = require('./po/endpoints/endpoints-list-cf.po');
  var cfModel = require('./po/models/cf-model.po');
  var clusterActions = require('./po/widgets/cluster-actions.po');
  var orgSpaceTile = require('./po/widgets/cluster-org-space-tile.po');
  var Q = require('q');
  var _ = require('lodash');

  describe('CF - Manage Organizations and Spaces', function () {

    var cfFromConfig = cfHelpers.getCfs().cf1;
    var testOrgName = cfHelpers.getCustomerOrgSpaceLabel(null, 'org');
    var testSpaceName = cfHelpers.getCustomerOrgSpaceLabel(null, 'space');
    var testGuid;

    beforeAll(function () {
      // Reset all cnsi that exist in params and connect
      var init = resetTo.resetAllCnsi()
        .then(function () {
          // Connect the test non-admin user to all cnsis in params
          return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
        })
        .then(function () {
          // Connect the test admin user to all cnsis in params (required to ensure correct permissions are set when
          // creating orgs + spaces)
          return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
        })
        .then(function () {
          return proxyModel.fetchCnsiByName(cfFromConfig.register.cnsi_name)
            .then(function (guid) {
              testGuid = guid;
            });
        });
      // Ensure we don't continue until everything is set up
      return browser.driver.wait(init);
    });

    beforeEach(function () {
      var init = Q.resolve()
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
          // NOTE - This will break if we have multiple cf endpoints...
          return endpointsListCf.showCfEndpoints();
        });
      // Ensure we don't continue until everything is set up
      return browser.driver.wait(init);
    });

    afterAll(function () {
      if (testGuid) {
        browser.driver.wait(
          Q.all([
            cfModel.deleteOrgIfExisting(testGuid, testOrgName),
            cfModel.deleteSpaceIfExisting(testGuid, testSpaceName)
          ])
        );
      }
    });

    it('Create and delete an organization', function () {
      expect(testOrgName).toBeDefined();

      clusterActions.createOrganisation(testOrgName);

      var theTile = orgSpaceTile.getOrgTile(testOrgName);
      helpers.scrollIntoView(theTile);

      orgSpaceTile.clickActionMenu(theTile, 1);
      expect(confirmationModalHelper.isVisible()).toBeTruthy();
      confirmationModalHelper.commit();
    });

    it('should show the CLI commands', function () {
      // Open the first org
      var orgTiles = element.all(by.css('organization-tile .panel-heading.linked'));
      orgTiles.get(0).click();
      var cfAppCliCommands = element(by.linkText('CLI Commands'));
      cfAppCliCommands.click();
      element(by.css('.detail-view-close.close')).click();
    });

    it('Create and delete a space', function () {
      expect(testOrgName).toBeDefined();
      expect(testSpaceName).toBeDefined();

      var testAdminUser, testUser;
      var init = cfModel.fetchUsers(testGuid)
        .then(function (users) {
          testUser = _.find(users, {
            entity: {
              username: cfFromConfig.user.username
            }
          });
          testAdminUser = _.find(users, {
            entity: {
              username: cfFromConfig.admin.username
            }
          });
          expect(testUser).toBeDefined();
          expect(testAdminUser).toBeDefined();
        })
        .then(function () {
          return cfModel.addOrgIfMissing(testGuid, testOrgName, testAdminUser.metadata.guid,
            testUser.metadata.guid);
        })
        .then(function () {
          // Refresh so new org is visible
          return browser.refresh();
        });
      browser.driver.wait(init);

      // Add space
      clusterActions.createSpace(testOrgName, testSpaceName);

      // Should not be able to delete org via org tile
      var orgTile = orgSpaceTile.getOrgTile(testOrgName);
      helpers.scrollIntoView(orgTile);
      orgSpaceTile.clickActionMenu(orgTile, 1);
      expect(confirmationModalHelper.isVisible()).toBeFalsy();

      // Go to org page
      orgTile.click();

      // Should not be able to delete org via org summary tile
      var orgSummaryTile = element(by.css('organization-summary-tile'));
      var orgSummaryActionMenu = orgSummaryTile.element(by.css('.actions-menu'));
      actionsMenuHelper.click(orgSummaryActionMenu);
      actionsMenuHelper.clickItem(orgSummaryActionMenu, 1);
      expect(confirmationModalHelper.isVisible()).toBeFalsy();

      // Delete space via org's space tile
      var spaceTile = orgSpaceTile.getSpaceTile(testSpaceName);
      helpers.scrollIntoView(spaceTile);
      orgSpaceTile.clickActionMenu(spaceTile, 1);
      expect(confirmationModalHelper.isVisible()).toBeTruthy();
      confirmationModalHelper.commit();

      // Should be able to delete org via org summary tile
      actionsMenuHelper.click(orgSummaryActionMenu);
      actionsMenuHelper.clickItem(orgSummaryActionMenu, 1);
      expect(confirmationModalHelper.isVisible()).toBeTruthy();
      confirmationModalHelper.commit();
    });

  }).skipWhen(cfHelpers.skipIfOnlyOneCF);
})();
