(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var credentialsFormHelper = require('../../po/widgets/credentials-form.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var actionsMenuHelper = require('../../po/widgets/actions-menu.po');
  var confirmationModalHelper = require('../../po/widgets/confirmation-modal.po');
  var registerEndpoint = require('../../po/endpoints/register-endpoint.po');
  var endpointsHcf = require('../../po/endpoints/endpoints-list-hcf.po');

  describe('Endpoints - List HCFs', function () {

    function resetToLoggedIn(loginAsFunc) {
      return browser.driver.wait(resetTo.resetAllCnsi())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginAsFunc();
        });
    }

    var hcf = helpers.getHcfs().hcf1;

    describe('Admin', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin)
          .then(function () {
            return endpointsHcf.showHcfEndpoints();
          })
          .then(function () {
            endpointsHcf.isHcfEndpoints();

            // Confirm the first tile is the required one (to match creds later)
            expect(endpointsHcf.getTileTitle(0)).toEqual(hcf.register.cnsi_name.toUpperCase());
            expect(endpointsHcf.isTileConnected(0)).toBeFalsy();
          });
      });

      describe('Connect + Disconnect', function () {

        it('Correct action menu items - before connect', function () {
          var actionMenu = endpointsHcf.getTileActionMenu(0);
          expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
          expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
          expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
        });

        it('Execute Connect', function () {
          // More detailed tests for the credentials form can be found in service-instance-registration.spec

          var actionMenu = endpointsHcf.getTileActionMenu(0);
          // Open the action menu
          actionsMenuHelper.click(actionMenu)
            .then(function () {
              // Click on connect
              return actionsMenuHelper.clickItem(actionMenu, 0);
            })
            .then(function () {
              // Run through the credentials form + register
              expect(credentialsFormHelper.credentialsForm().isDisplayed()).toBeTruthy();
              credentialsFormHelper.credentialsFormFill(hcf.admin.username, hcf.admin.password);
              return credentialsFormHelper.connect();
            })
            .then(function () {
              helpers.checkAndCloseToast("Successfully connected to 'hcf'");
              // Should now show as 'connected'
              expect(endpointsHcf.isTileConnected(0)).toBeTruthy();
            });
        });

        it('Correct action menu items - before disconnect', function () {
          var actionMenu = endpointsHcf.getTileActionMenu(0);
          expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
          expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Disconnect');
          expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
        });

        it('Execute Disconnect', function () {

          var actionMenu = endpointsHcf.getTileActionMenu(0);
          // Open the action menu
          actionsMenuHelper.click(actionMenu)
            .then(function () {
              // Click on connect
              return actionsMenuHelper.clickItem(actionMenu, 0);
            })
            .then(function () {
              helpers.checkAndCloseToast('Helion Cloud Foundry endpoint successfully disconnected');
              // Should now show as 'Disconnected'
              expect(endpointsHcf.isTileConnected(0)).toBeFalsy();
            });
        });

        it('Correct action menu items - after disconnect', function () {
          var actionMenu = endpointsHcf.getTileActionMenu(0);
          expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
          expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
          expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
        });

      });

      describe('Unregister + Register', function () {
        it('Correct state - before unregister', function () {
          var actionMenu = endpointsHcf.getTileActionMenu(0);
          expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
          expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
          expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');

          expect(endpointsHcf.getTiles().count()).toBe(1);
        });

        it('Execute Unregister', function () {
          expect(endpointsHcf.getTiles().count()).toBe(1);

          var actionMenu = endpointsHcf.getTileActionMenu(0);
          // Open the action menu
          actionsMenuHelper.click(actionMenu)
            .then(function () {
              // Click on unregister
              return actionsMenuHelper.clickItem(actionMenu, 1);
            })
            .then(function () {
              expect(confirmationModalHelper.isVisible()).toBeTruthy();
              // click on modal cancel
              return confirmationModalHelper.credentialsFormCancel();
            })
            .then(function () {
              // Open the action menu
              return actionsMenuHelper.click(actionMenu);
            })
            .then(function () {
              // Click on unregister
              return actionsMenuHelper.clickItem(actionMenu, 1);
            })
            .then(function () {
              expect(confirmationModalHelper.isVisible()).toBeTruthy();
              // Click on modal unregister
              return confirmationModalHelper.primary();
            })
            .then(function () {
              helpers.checkAndCloseToast('Helion Cloud Foundry endpoint successfully unregistered');
              expect(endpointsHcf.getTiles().count()).toBe(0);
            });
        });

        it('Execute Register', function () {
          expect(endpointsHcf.getTiles().count()).toBe(0);

          // Click register that's now appeared in centre screen message
          endpointsHcf.inlineRegister()
            .then(function () {
              // Validate the register slide out is shown, add details and continue
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
              expect(registerEndpoint.getEndpointType()).toBe('hcf');
              return registerEndpoint.populateAndRegister(hcf.register.api_endpoint, hcf.register.cnsi_name,
                hcf.register.skip_ssl_validation);
            })
            .then(function () {
              helpers.checkAndCloseToast("Helion Cloud Foundry endpoint '" + hcf.register.cnsi_name + "' successfully registered");
              expect(endpointsHcf.getTiles().count()).toBe(1);
            });
        });

      });

      describe('Permissions', function () {
        it('Register should be visible to console admins', function () {
          expect(endpointsHcf.headerRegisterVisible()).toBeTruthy();
        });
      });
    });

    describe('Non-Admin', function () {

      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsNonAdmin)
          .then(function () {
            // return serviceRegistration.completeRegistration();
          })
          .then(function () {
            return endpointsHcf.showHcfEndpoints();
          })
          .then(function () {
            endpointsHcf.isHcfEndpoints();
          });
      });

      describe('Permissions', function () {
        it('Register should not be visible to non-console admins', function () {
          expect(endpointsHcf.headerRegisterVisible()).toBeFalsy();
        });
      });
    });

  });
})();
