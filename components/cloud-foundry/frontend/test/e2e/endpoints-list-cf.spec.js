(function () {
  'use strict';

  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var cfHelpers = require('./po/helpers.po');
  var resetTo = require('../../../../app-core/frontend/test/e2e/po/resets.po');
  var loginPage = require('../../../../app-core/frontend/test/e2e/po/login-page.po');
  var endpointsCf = require('./po/endpoints/endpoints-list-cf.po');
  var Q = require('q');

  describe('CF Endpoints Dashboard', function () {

    function resetToLoggedIn(loginAsFunc, connectToCnsi, registerMultipleCf) {
      return browser.driver.wait(resetTo.resetAllCnsi(null, null, registerMultipleCf))
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
            return endpointsCf.showCfEndpoints();
          });
      });

      it('should be the CF Endpoints page', function () {
        endpointsCf.isCfEndpoints();
      });

      it('should show the `no registered endpoints` message', function () {
        element(by.css('.applications-msg')).getText().then(function (text) {
          expect(text).toEqual('No connected Cloud Foundry endpoints.');
        });
      });
    });

    describe('Single endpoint', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin, true)
          .then(function () {
            return endpointsCf.showCfEndpoints();
          });
      });

      it('should be the CF Organizations details page', function () {
        endpointsCf.isCfOganizationsDetails();
      });

      it('should have breadcrumb to `Endpoints`', function () {
        expect(endpointsCf.getBreadcrumb(0).getText()).toBe('Endpoints');
      });

      it('should go to Endpoints page when appropriate breadcrumb is clicked', function () {
        endpointsCf.clickBreadcrumb(0).then(function () {
          endpointsCf.isEndpoints();
          // Go back
          endpointsCf.showCfEndpoints();
        });
      });

      it('should have breadcrumb to `Cloud Foundry`', function () {
        expect(endpointsCf.getBreadcrumb(1).getText()).toBe('Cloud Foundry');
      });

      it('should go to `Cloud Foundry` page when appropriate breadcrumb is clicked', function () {
        endpointsCf.clickBreadcrumb(1).then(function () {
          endpointsCf.isCfEndpoints();
        });
      });
    });

    describe('Multiple endpoints', function () {
      beforeAll(function () {
        resetToLoggedIn(loginPage.loginAsAdmin, true, true)
          .then(function () {
            return endpointsCf.showCfEndpoints();
          });
      });

      it('should be the CF Endpoints page', function () {
        endpointsCf.isCfEndpoints();
      });

    }).skipWhen(cfHelpers.skipIfOnlyOneCF);
  }).skipWhen(cfHelpers.skipIfNoCFOrInCF);
})();
