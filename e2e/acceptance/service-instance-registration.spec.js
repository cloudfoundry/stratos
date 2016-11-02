'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var navbar = require('../po/navbar.po');
var loginPage = require('../po/login-page.po');
var registration = require('../po/endpoints/service-instance-registration.po');
var applications = require('../po/applications/applications.po');

describe('Service Instance Registration', function () {

  describe('As Admin (Ensure service registration page is skipped correctly)', function () {

    describe('No registered endpoints', function () {
      beforeAll(function () {
        browser.driver.wait(resetTo.removeAllCnsi()).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
        });
      });

      it('Should reach endpoints dashboard after log in', function () {
        expect(applications.isApplicationWallNoClusters()).toBeTruthy();
      });

    });

    describe('Some registered endpoints', function () {
      beforeAll(function () {
        browser.driver.wait(resetTo.resetAllCnsi()).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
        });
      });

      it('Should reach application wall with \'no clusters\' message after log in', function () {
        expect(applications.isApplicationWallNoClusters()).toBeTruthy();
      });

    });

  });

  describe('As Non-Admin', function () {

    describe('No registered endpoints', function () {
      beforeAll(function () {
        browser.driver.wait(resetTo.removeAllCnsi()).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsNonAdmin();
        });
      });

      it('Should not display service registration', function () {
        expect(registration.registrationOverlay().isPresent()).toBeFalsy();
      });
    });

    describe('Some registered endpoints', function () {

      function ConfirmFirstService(service) {
        // Confirm the first row is the required one (to match creds later)
        var serviceInstancesTable = registration.serviceInstancesTable();
        // There's hidden warning tr, so actual row index is *2
        helpers.getTableCellAt(serviceInstancesTable, 2, 2).getText().then(function (partUrl) {
          var fullUrl = service.register.api_endpoint;
          expect(fullUrl.slice(partUrl.length * -1)).toEqual(partUrl);
        });
      }

      beforeAll(function () {
        browser.driver.wait(resetTo.resetAllCnsi()).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsNonAdmin();
        });
      });

      describe('service instances table', function () {
        it('should be displayed', function () {
          expect(registration.registrationOverlay().isDisplayed()).toBeTruthy();
        });

        it('should show at least one service instance', function () {
          var serviceInstancesTable = registration.serviceInstancesTable();
          expect(helpers.getTableRows(serviceInstancesTable).count()).toBeGreaterThan(0);
        });

        it('should show `Connect` link for each service instance', function () {
          var serviceInstancesTable = registration.serviceInstancesTable();
          var serviceInstanceRows = helpers.getTableRows(serviceInstancesTable);
          for (var i = 0; i < serviceInstanceRows.count(); i++) {
            expect(registration.connectLink(i).isDisplayed()).toBeTruthy();
          }
        });

        it('should have the `Done` button enabled initially', function () {
          expect(registration.doneButton().isEnabled()).toBeTruthy();
        });
      });

      var hcf = helpers.getHcfs().hcf1;
      // Each cnsi has two rows (one normally hidden). So actual row is index * 2
      var hcfRow = 2;

      describe('service instance `Connect` clicked', function () {

        beforeAll(function (done) {
          ConfirmFirstService(hcf);
          registration.connect(hcfRow).then(done);
        });

        it('should open the credentials form', function () {
          expect(registration.credentialsForm().isDisplayed()).toBeTruthy();
        });

        it('should show the cluster name and URL as readonly in the credentials form', function () {
          var serviceInstancesTable = registration.serviceInstancesTable();
          var name = helpers.getTableCellAt(serviceInstancesTable, hcfRow, 1).getText();
          var url = helpers.getTableCellAt(serviceInstancesTable, hcfRow, 2).getText();

          var fields = registration.credentialsFormFields();
          expect(fields.get(0).getAttribute('value')).toBe(name);
          expect(fields.get(1).getAttribute('value')).toBe(url);
          expect(fields.get(2).getAttribute('value')).toBe('');
          expect(fields.get(3).getAttribute('value')).toBe('');
        });

        it('should disable connect button if username and password are blank', function () {
          expect(registration.connectButton().isEnabled()).toBeFalsy();
        });

        it('should enable connect button if username and password are not blank', function () {
          registration.fillCredentialsForm(hcf.admin.username, hcf.admin.password);
          expect(registration.connectButton().isEnabled()).toBeTruthy();
        });

        it('should update service instance data on register', function () {
          registration.connectServiceInstance().then(function () {
            var serviceInstancesTable = registration.serviceInstancesTable();
            expect(helpers.getTableCellAt(serviceInstancesTable, hcfRow, 3).getText()).not.toBe('');
            expect(helpers.getTableCellAt(serviceInstancesTable, hcfRow, 4).getText()).toBe('DISCONNECT');
            expect(registration.serviceInstanceStatus(hcfRow, 'helion-icon-Active_L').isDisplayed()).toBeTruthy();
          });
        });

        it('should show `1 ENDPOINT REGISTERED` next to `Done` button', function () {
          expect(registration.registrationNotification().getText()).toEqual('1 ENDPOINT REGISTERED');
        });

        it('`Done` button should always be enabled', function () {
          expect(registration.doneButton().isEnabled()).toBeTruthy();
        });
      });

      describe('service instance `Disconnect`', function () {
        it('should update row in table when disconnected', function () {
          registration.disconnect(hcfRow)
            .then(function () {
              var serviceInstancesTable = registration.serviceInstancesTable();
              expect(helpers.getTableCellAt(serviceInstancesTable, hcfRow, 3).getText()).toBe('');
              expect(helpers.getTableCellAt(serviceInstancesTable, hcfRow, 4).getText()).toBe('CONNECT');
            });
        });

        it('`Done` button should always be enabled', function () {
          expect(registration.doneButton().isEnabled()).toBeTruthy();
        });
      });

      describe('service instance - complete registration', function () {
        var hcf = helpers.getHcfs().hcf1;

        beforeAll(function () {
          ConfirmFirstService(hcf);
          registration.connect(hcfRow);
        });

        it('should show applications view when `Done` clicked', function () {
          registration.fillCredentialsForm(hcf.admin.username, hcf.admin.password);
          registration.connectServiceInstance()
            .then(function () {
              return registration.completeRegistration();
            })
            .then(function () {
              expect(registration.registrationOverlay().isPresent()).toBeFalsy();
              expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
            });
        });

        it('should go directly to applications view on logout and login', function () {
          // Wait for the register service notification to go away
          browser.driver.sleep(5000);

          navbar.logout();
          loginPage.login(helpers.getUser(), helpers.getPassword());

          expect(registration.registrationOverlay().isPresent()).toBeFalsy();
          expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
        });

        it('should go directly to applications view on logout and login (as admin)', function () {
          // Wait for the register service notification to go away
          browser.driver.sleep(5000);

          // This would be better in the 'non admin' section, however it's easier to test here with a service registered
          // This removes the need to go through/test the endpoint dashboard registration process alongside this test
          navbar.logout();
          loginPage.login(helpers.getAdminUser(), helpers.getAdminPassword());

          expect(registration.registrationOverlay().isPresent()).toBeFalsy();
          expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
        });
      });
    });

  });
});
