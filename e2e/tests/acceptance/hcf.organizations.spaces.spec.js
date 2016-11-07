(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var navBar = require('../../po/navbar.po');
  var inputText = require('../../po/widgets/input-text.po');
  var actionsMenuHelper = require('../../po/widgets/actions-menu.po');
  var confirmationModalHelper = require('../../po/widgets/confirmation-modal.po');
  var endpointsHcf = require('../../po/endpoints/endpoints-list-hcf.po');
  var endpointDashboard = require('../../po/endpoints/endpoints-dashboard.po');

  var _ = require('../../../tools/node_modules/lodash');
  var Q = require('../../../tools/node_modules/q');

  describe('HCF - Manage Organizations', function () {

    /**
     * This spec will ..
     * - Create a random e2e org
     * - Delete it
     * - Create it again
     * - Add spaces
     * - Check we cannot delete the non-empty org
     * - Manage roles for users
     */

    var testOrgName, testSpaceName;
    var hcfFromConfig = helpers.getHcfs().hcf1;

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
        }).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
          navBar.goToView('Endpoints');
          endpointDashboard.getCloudFoundryTile().click();
          expect(endpointsHcf.getTileTitle(0).then(function (title) {
            return title.toLowerCase();
          })).toBe(hcfFromConfig.register.cnsi_name.toLowerCase());
          return endpointsHcf.getTiles().get(0).click();
        });
      // Ensure we don't continue until everything is set up
      return browser.driver.wait(init);
    });

    it('Create and delete an organization', function () {
      // Fetch the e2e org and space names
      testOrgName = hcfFromConfig.testOrgName;
      testSpaceName = hcfFromConfig.testSpaceName;
      expect(testOrgName).toBeDefined();
      expect(testSpaceName).toBeDefined();

      testOrgName += '-' + new Date().toISOString();

      // Do we need a mock for the Org summary tile?
      element(by.buttonText('Create Organization')).click();
      // var orgNameField = inputText.wrap(element(by.name('orgName')));
      var orgNameField = inputText.wrap(element(by.name('form.createOrganization')));
      orgNameField.addText(testOrgName);
      element(by.buttonText('Create')).click();
      helpers.checkAndCloseToast(/Organisation '.*' successfully created/);

      function returnIfMatch(tile) {
        return function (titleText) {
          if (titleText === testOrgName) {
            return tile;
          }
        };
      }

      element.all(by.repeater('organization in clusterDetailController.organizations')).then(function (tiles) {
        var promises = [];
        for (var i = 0; i < tiles.length; i++) {
          var tile = tiles[i];
          var title = tile.element(by.css('.panel-heading span:first-of-type')).getText();
          promises.push(title.then(returnIfMatch(tile)));
        }
        return Q.all(promises).then(function (tileMatch) {
          var theTile;
          for (var i = 0; i < tileMatch.length; i++) {
            theTile = tileMatch[i];
            if (theTile) {
              break;
            }
          }
          expect(theTile).toBeDefined();
          var actionMenu = theTile.element(by.css('.actions-menu'));
          actionsMenuHelper.click(actionMenu);
          actionsMenuHelper.clickItem(actionMenu, 1);
          expect(confirmationModalHelper.isVisible()).toBeTruthy();
          return confirmationModalHelper.primary().then(function () {
            return helpers.checkAndCloseToast(/Organization '.*' successfully deleted/);
          });
        });
      });

    });

  });

})();
