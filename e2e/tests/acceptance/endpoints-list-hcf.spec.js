(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var endpointsHcf = require('../../po/endpoints/endpoints-list-hcf.po');
  var Q = require('../../../tools/node_modules/q');

  describe('HCF Endpoints Dashboard', function () {

    function resetToLoggedIn(loginAsFunc, connectToCnsi, registerMultipleHcf) {
      return browser.driver.wait(resetTo.resetAllCnsi(null, null, registerMultipleHcf))
        .then(function () {
          if (connectToCnsi) {
            return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
          } else {
            return Q.resolve();
          }
        })
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginAsFunc();
        });
    }

    describe('No endpoints', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin)
          .then(function () {
            return endpointsHcf.showHcfEndpoints();
          });
      });

      it('should be the HCF Endpoints page', function () {
        endpointsHcf.isHcfEndpoints();
      });

      it('should show the `no registered endpoints` message', function () {
        element(by.css('.view-msg')).getText().then(function (text) {
          expect(text).toEqual('There are no registered Helion Cloud Foundry endpoints.');
        });
      });
    });

    describe('Single endpoint', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin, true)
          .then(function () {
            return endpointsHcf.showHcfEndpoints();
          });
      });

      it('should be the HCF Organizations details page', function () {
        endpointsHcf.isHcfOganizationsDetails();
      });
    });

    describe('Multiple endpoints', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin, true, true)
          .then(function () {
            return endpointsHcf.showHcfEndpoints();
          });
      });

      it('should be the HCF Endpoints page', function () {
        endpointsHcf.isHcfEndpoints();
      });

    });
  });
})();
