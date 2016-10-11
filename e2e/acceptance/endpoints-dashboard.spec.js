'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var endpointsDashboardPage = require('../po/endpoints-dashboard.po.js');
var registerEndpoint = require('../po/register-endpoint.po.js');

describe('Endpoints Dashboard', function () {

  function resetToDashboard() {
    return browser.driver.wait(resetTo.removeAllCnsi())
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.loginAsAdmin();
      });
  }

  describe('No clusters', function () {

    it('should show welcome endpoints page', function () {
      resetToDashboard().then(function () {
        endpointsDashboardPage.showEndpoints();
        endpointsDashboardPage.isEndpoints();
        expect(endpointsDashboardPage.welcomeMessage().isDisplayed()).toBeTruthy();
        expect(endpointsDashboardPage.registerCloudFoundryTile().isDisplayed()).toBeTruthy();
        expect(endpointsDashboardPage.registerCodeEngineTile().isDisplayed()).toBeTruthy();
      });
    });

    function registerTests(type) {
      beforeAll(function () {
        resetToDashboard();
      });

      beforeEach(function () {
        endpointsDashboardPage.goToEndpoints();
      })

      it('should show add form detail view when btn in welcome is pressed', function () {
        endpointsDashboardPage.showEndpoints();
        endpointsDashboardPage.clickAddClusterInWelcomeMessage(type).then(function () {
          expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
          expect(registerEndpoint.getEndpointType()).toBe(type);
        });
      });

      it('should show add form detail view when btn in tile is pressed', function () {
        endpointsDashboardPage.showEndpoints();
        endpointsDashboardPage.clickAddClusterInTile(type).then(function () {
          expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
          expect(registerEndpoint.getEndpointType()).toBe(type);
        });
      });

      describe('Form', function () {
        var hcf = type === 'hcf' ? helpers.getHcfs().hcf1 : helpers.getHces().hce1;

        beforeEach(function () {
          endpointsDashboardPage.clickAddClusterInTile(type)
            .then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
              expect(registerEndpoint.getEndpointType()).toBe(type);

              browser.driver.sleep(1000);
            });
        });

        describe('Initial button state', function () {

          it('Cancel is enabled', function () {
            registerEndpoint.closeEnabled(true);
          });

          it('Register is initially disabled', function () {
            registerEndpoint.registerEnabled(false);
          });
        });

        describe('Invalid address', function () {

          var invalidUrl = 'Oxford Utd are a terrible football club';

          beforeEach(function () {
            // Enter a name so the form will become valid on valid address
            registerEndpoint.enterName('abc');

            registerEndpoint.registerEnabled(false);
          });

          it('Incorrect format', function () {
            registerEndpoint.enterAddress(invalidUrl)
              .then(function () {

                // browser.driver.sleep('2000');

                registerEndpoint.isAddressValid(false);
                registerEndpoint.registerEnabled(false);
              });
          });

          it('Valid Valid', function () {
            registerEndpoint.enterAddress(hcf.register.api_endpoint)
              .then(function () {
                registerEndpoint.isAddressValid(true);
                registerEndpoint.registerEnabled(true);
              });
          });

          it('Invalid to valid to invalid', function () {
            registerEndpoint.enterAddress(invalidUrl)
              .then(function () {
                registerEndpoint.isAddressValid(false);
                registerEndpoint.registerEnabled(false);
              })
              .then(function () {
                return registerEndpoint.clearAddress();
              })
              .then(function () {
                return registerEndpoint.enterAddress(hcf.register.api_endpoint);
              })
              .then(function () {
                registerEndpoint.isAddressValid(true);
                registerEndpoint.registerEnabled(true);
              })
              .then(function () {
                return registerEndpoint.clearAddress();
              })
              .then(function () {
                return registerEndpoint.enterAddress(invalidUrl);
              })
              .then(function () {
                registerEndpoint.isAddressValid(false);
                registerEndpoint.registerEnabled(false);
              });
          });
        });

        it('Invalid name', function () {

          beforeEach(function () {
            // Enter a url so the form will become valid on valid Name
            registerEndpoint.enterAddress(hcf.register.api_endpoint);

            registerEndpoint.registerEnabled(false);
          });

          it('Valid Valid', function () {
            registerEndpoint.enterName(hcf.register.cnsi_name)
              .then(function () {
                registerEndpoint.isNameValid(true);
                registerEndpoint.registerEnabled(true);
              });
          });

          it('Invalid to valid to invalid', function () {
            registerEndpoint.enterName(hcf.register.cnsi_name)
              .then(function () {
                registerEndpoint.isNameValid(true);
                registerEndpoint.registerEnabled(true);
              })
              .then(function () {
                return registerEndpoint.clearName();
              })
              .then(function () {
                registerEndpoint.isNameValid(false);
                registerEndpoint.registerEnabled(false);
              })
              .then(function () {
                return registerEndpoint.enterName(hcf.register.cnsi_name);
              })
              .then(function () {
                registerEndpoint.isNameValid(true);
                registerEndpoint.registerEnabled(true);
              });
          });
        });

        it('Successful register', function () {

          registerEndpoint.populateAndRegister(hcf.register.api_endpoint, hcf.register.cnsi_name,
            hcf.register.skip_ssl_validation);

          registerEndpoint.close();
          fail('TODO: RC Add test for newly added hcf (tile contents changed and numbers correct');
        });
      });
    }

    describe('Register hce', function () {
      registerTests('hce');
    });

    describe('Register hcf', function () {
      registerTests('hcf');
    });

  });

  describe('With clusters', function () {

    beforeAll(function () {
      browser.driver.wait(resetTo.resetAllCnsi())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
        });
    });

    it('should show welcome endpoints page', function () {
      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.isEndpoints();
      expect(endpointsDashboardPage.welcomeMessage().isDisplayed()).toBeFalsy();
      expect(endpointsDashboardPage.registerCloudFoundryTile().isDisplayed()).toBeFalsy();
      expect(endpointsDashboardPage.registerCodeEngineTile().isDisplayed()).toBeFalsy();
      fail('TODO: RC test once hcf is back up');
    });

  });

});
