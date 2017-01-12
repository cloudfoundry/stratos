(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var appSetupHelper = require('../../po/app-setup.po');
  var endpointsDashboard = require('../../po/endpoints/endpoints-dashboard.po');
  var registerVcsToken = require('../../po/applications/register-vcs-token.po');
  var renameVcsToken = require('../../po/applications/rename-vcs-token.po');
  var manageVcsToken = require('../../po/applications/manage-vcs-token.po');

  var Q = require('../../../tools/node_modules/q');

  describe('Endpoints Personal Access Tokens test', function () {

    var gitHubRowIndex;

    function resetToLoggedIn(stateSetter, isAdmin) {
      return browser.driver.wait(stateSetter())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          return isAdmin ? loginPage.loginAsAdmin() : loginPage.loginAsNonAdmin();
        });
    }

    afterAll(function () {
      return Q.all([
        appSetupHelper.deletePat(helpers.getGithubInvalidTokenName()),
        appSetupHelper.deletePat(helpers.getGithubTokenName())
      ]);
    });

    describe('PAT Management', function () {

      beforeAll(function () {
        resetToLoggedIn(resetTo.resetAllCnsi, false);
      });

      it('should be the Endpoints Dashboard page', function () {
        expect(endpointsDashboard.isEndpoints()).toBe(true);
      });

      it('should have a `Github` entry', function () {
        gitHubRowIndex = endpointsDashboard.getRowWithEndpointType('github');
        expect(gitHubRowIndex).toBeDefined();
      });

      it('should have a `disconnected` state', function () {
        expect(endpointsDashboard.endpointIsDisconnected(gitHubRowIndex)).toBe(true);
      });

      it('should have an `Add Token` action', function () {
        endpointsDashboard.endpointActionButton(gitHubRowIndex)
          .then(function (button) {
            expect(button.element(by.css('span')).getText()).toBe('ADD TOKEN');
          });
      });

      it('should display the `Register Token form` when `add token` is clicked', function () {
        endpointsDashboard.endpointActionButton(gitHubRowIndex)
          .then(function (button) {
            button.click();
            expect(registerVcsToken.isRegisterTokenView()).toBe(true);
          });
      });

      it('should be able to open GitHub.com when clicking on description', function () {
        expect(registerVcsToken.getGitHubLink().isPresent()).toBe(true);
        registerVcsToken.getGitHubLink().click().then(function () {
          browser.getAllWindowHandles().then(function (handles) {
            var githubWindowHandler = handles[1];
            browser.switchTo().window(githubWindowHandler).then(function () {
              expect(browser.driver.getCurrentUrl()).toBe('https://github.com/');
              browser.driver.close();
              // Switch back for tests to continue;
              browser.switchTo().window(handles[0]);
            });
          });
        });
      });

      it('should be able to open GitHub PAT page when clicking on description', function () {
        // browser.pause();
        expect(registerVcsToken.getGitHubPATLink().isPresent()).toBe(true);
        registerVcsToken.getGitHubPATLink().click().then(function () {
          browser.getAllWindowHandles().then(function (handles) {
            var githubWindowHandler = handles[1];
            browser.switchTo().window(githubWindowHandler).then(function () {
              expect(browser.driver.getCurrentUrl()).toBe('https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fsettings%2Ftokens');
              browser.driver.close();
              browser.switchTo().window(handles[0]);
            });
          });
        });
      });

      it('should disable submission with invalid data', function () {
        registerVcsToken.enterToken('foo', 'foo');
        expect(registerVcsToken.isRegisterTokenEnabled()).toBe(false);
      });

      it('should enable submission for valid data', function () {
        registerVcsToken.enterToken(helpers.getGithubInvalidTokenName(), helpers.getGithubInvalidToken());
        expect(registerVcsToken.isRegisterTokenEnabled()).toBe(true);
        registerVcsToken.registerTokenButton().click();
      });

      it('should `critical` state in the `Endpoints Dashboard`', function () {
        expect(endpointsDashboard.endpointIsCritical(gitHubRowIndex)).toBe(true);
      });

      it('should have an `Manage Token` action', function () {
        endpointsDashboard.endpointActionButton(gitHubRowIndex)
          .then(function (button) {
            expect(button.element(by.css('span')).getText()).toBe('MANAGE TOKENS');
          });
      });

      describe('Manage tokens interface', function () {

        it('should take to `manage tokens` view', function () {
          endpointsDashboard.endpointActionButton(gitHubRowIndex)
            .then(function (button) {
              button.click();
              expect(manageVcsToken.isManageTokensDialog()).toBe(true);
            });
        });

        it('should have an `Add new Token` action', function () {
          expect(manageVcsToken.addNewTokenButton().isDisplayed()).toBe(true);
        });

        it('should have a `critical` icon for the invalid token', function () {
          manageVcsToken.getRowWithTokenName(helpers.getGithubInvalidTokenName())
            .then(function (tokenRow) {
              expect(manageVcsToken.isTokenInvalid(tokenRow)).toBe(true);
            });
        });

        it('should have one token', function () {
          expect(manageVcsToken.getTokensCount()).toBe(1);
        });

        it('should show `Register Tokens` view when clicking`Add New Token`', function () {
          manageVcsToken.addNewTokenButton().click();
          expect(registerVcsToken.isRegisterTokenView()).toBe(true);
        });

        it('should enable form submission with valid token data', function () {
          registerVcsToken.enterToken(helpers.getGithubTokenName(), helpers.getGithubToken());
          expect(registerVcsToken.tokenFormFields().get(1).getAttribute('class')).toContain('ng-valid');
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(true);
        });

        it('should be add new token and increment token cound', function () {
          registerVcsToken.registerTokenButton().click();
          expect(manageVcsToken.getTokensCount()).toBe(2);
        });

        it('should be a valid token', function () {
          manageVcsToken.getRowWithTokenName(helpers.getGithubTokenName())
            .then(function (tokenRow) {
              expect(manageVcsToken.isTokenValid(tokenRow)).toBe(true);
            });
        });

        describe('Action menu tests', function () {

          it('should have two operations in the action menu', function () {
            manageVcsToken.getRowWithTokenName(helpers.getGithubInvalidTokenName())
              .then(function (tokenRow) {
                manageVcsToken.clickActionsMenu(tokenRow).click();
                expect(manageVcsToken.getActionMenuItems(tokenRow).count()).toBe(2);
                expect(manageVcsToken.getActionMenuItemText(tokenRow, 0)).toBe('Rename');
                expect(manageVcsToken.getActionMenuItemText(tokenRow, 1)).toBe('Delete');
              });
          });

          it('should show confirmation modal when deleting a token', function () {
            manageVcsToken.getRowWithTokenName(helpers.getGithubInvalidTokenName())
              .then(function (tokenRow) {
                manageVcsToken.clickActionMenuItem(tokenRow, 1);
                expect(manageVcsToken.isDeleteModalPresent()).toBe(true);
              });
          });

          it('should delete token after confirming model', function () {
            manageVcsToken.confirmModal();
            expect(manageVcsToken.getTokensCount()).toBe(1);
          });

          it('should show form to rename a token', function () {
            manageVcsToken.getRowWithTokenName(helpers.getGithubTokenName())
              .then(function (tokenRow) {
                manageVcsToken.clickActionsMenu(tokenRow).click();
                manageVcsToken.clickActionMenuItem(tokenRow, 0);
                expect(renameVcsToken.getRenameTokenForm().isPresent()).toBe(true);
              });
          });

          it('should disable save if form is invalid', function () {
            renameVcsToken.getRenameTokenFormFields().get(0).clear();
            expect(renameVcsToken.isSaveEnabled()).toBe(false);
          });

          it('should rename successfully with valid information', function () {
            renameVcsToken.enterToken(helpers.getGithubTokenName());
            expect(renameVcsToken.isSaveEnabled()).toBe(true);
            renameVcsToken.saveButton().click();
          });
        });

        it('should not allow addition of duplicate token', function () {
          manageVcsToken.addNewTokenButton().click();
          registerVcsToken.enterToken(helpers.getGithubTokenName(), helpers.getGithubToken());
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(false);
        });

      });
    });
  });
})();
