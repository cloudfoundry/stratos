'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var endpointsDashboardPage = require('../po/endpoints-dashboard.po.js');
var registerEndpoint = require('../po/register-endpoint.po.js');

describe('Endpoints Dashboard', function () {

  function resetToLoggedIn() {
    return browser.driver.wait(resetTo.removeAllCnsi())
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.loginAsAdmin();
      });
  }

  describe('No clusters', function () {

    it('should show welcome endpoints page', function () {
      resetToLoggedIn().then(function () {
        endpointsDashboardPage.showEndpoints();
        endpointsDashboardPage.isEndpoints();
        expect(endpointsDashboardPage.welcomeMessage().isDisplayed()).toBeTruthy();
        expect(endpointsDashboardPage.registerCloudFoundryTile().isDisplayed()).toBeTruthy();
        expect(endpointsDashboardPage.registerCodeEngineTile().isDisplayed()).toBeTruthy();
      });
    });

    function registerTests(type) {
      beforeAll(function () {
        resetToLoggedIn();
      });

      beforeEach(function () {
        registerEndpoint.safeClose();
      });

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
        var service = type === 'hcf' ? helpers.getHcfs().hcf1 : helpers.getHces().hce1;

        beforeEach(function () {
          endpointsDashboardPage.clickAddClusterInTile(type)
            .then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
              expect(registerEndpoint.getEndpointType()).toBe(type);

              browser.driver.sleep(500);
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

          var invalidUrl = 'This is an invalid URL';

          beforeEach(function () {
            // Enter a name so the form will become valid on valid address
            registerEndpoint.enterName('abc').then(function () {
              return registerEndpoint.registerEnabled(false);
            });
          });

          it('Incorrect format', function () {
            registerEndpoint.enterAddress(invalidUrl)
              .then(function () {
                return registerEndpoint.isAddressValid(false);
              })
              .then(function () {
                registerEndpoint.registerEnabled(false);
              });
          });

          it('Valid format', function () {
            registerEndpoint.enterAddress(service.register.api_endpoint)
              .then(function () {
                return registerEndpoint.isAddressValid(true);
              })
              .then(function () {
                registerEndpoint.registerEnabled(true);
              });
          });

          it('Invalid to valid to invalid', function () {
            registerEndpoint.enterAddress(invalidUrl)
              .then(function () {
                return registerEndpoint.isAddressValid(false);
              })
              .then(function () {
                return registerEndpoint.registerEnabled(false);
              })
              .then(function () {
                return registerEndpoint.clearAddress();
              })
              .then(function () {
                return registerEndpoint.enterAddress(service.register.api_endpoint);
              })
              .then(function () {
                return registerEndpoint.isAddressValid(true);
              })
              .then(function () {
                return registerEndpoint.registerEnabled(true);
              })
              .then(function () {
                return registerEndpoint.clearAddress();
              })
              .then(function () {
                return registerEndpoint.enterAddress(invalidUrl);
              })
              .then(function () {
                return registerEndpoint.isAddressValid(false);
              })
              .then(function () {
                return registerEndpoint.registerEnabled(false);
              });
          });
        });

        describe('Invalid name', function () {

          beforeEach(function () {
            // Enter a url so the form will become valid on valid Name
            registerEndpoint.enterAddress(service.register.api_endpoint).then(function () {
              return registerEndpoint.registerEnabled(false);
            });
          });

          it('Valid', function () {
            registerEndpoint.enterName(service.register.cnsi_name)
              .then(function () {
                registerEndpoint.isNameValid(true);
                registerEndpoint.registerEnabled(true);
              });
          });

          it('Invalid to valid to invalid', function () {
            registerEndpoint.enterName(service.register.cnsi_name)
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
                return registerEndpoint.enterName(service.register.cnsi_name);
              })
              .then(function () {
                registerEndpoint.isNameValid(true);
                registerEndpoint.registerEnabled(true);
              });
          });
        });

        it('Successful register', function () {
          expect(endpointsDashboardPage.hasRegisteredTypes(type)).toBeFalsy();

          registerEndpoint.populateAndRegister(service.register.api_endpoint, service.register.cnsi_name,
            service.register.skip_ssl_validation)
            .then(function () {
              return registerEndpoint.safeClose();
            })
            .then(function () {
              expect(endpointsDashboardPage.hasRegisteredTypes(type)).toBeTruthy();
              endpointsDashboardPage.getTileStats(type).then(function (stats) {
                expect(stats[1]).toEqual('1');
              });
            });
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
      expect(endpointsDashboardPage.welcomeMessage().isPresent()).toBeFalsy();
      expect(endpointsDashboardPage.registerCloudFoundryTile().isPresent()).toBeFalsy();
      expect(endpointsDashboardPage.registerCodeEngineTile().isPresent()).toBeFalsy();

      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.isEndpoints();

      expect(endpointsDashboardPage.hasRegisteredTypes('hcf')).toBeTruthy();
      endpointsDashboardPage.getTileStats('hcf').then(function (stats) {
        expect(stats[1]).toEqual('1');
      });

      expect(endpointsDashboardPage.hasRegisteredTypes('hce')).toBeTruthy();
      endpointsDashboardPage.getTileStats('hce').then(function (stats) {
        expect(stats[1]).toEqual('1');
      });

    });

  });

});
