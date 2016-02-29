var helpers = require('./po/helpers.po');
var loginPage = require('./po/login-page.po');
var registration = require('./po/service-instance-registration.po');

describe('Service Instance Registration', function () {
  var registrationOverlay, serviceInstancesTable;

  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();

    registration.login();
    registrationOverlay = registration.registrationOverlay();
    serviceInstancesTable = registration.serviceInstancesTable();
  });

  describe('service instances table', function () {
    it('should be displayed', function () {
      expect(registrationOverlay.isDisplayed()).toBeTruthy();
    });

    it('should show at least one service instance', function () {
      expect(helpers.getTableRows(serviceInstancesTable).count()).toBeGreaterThan(0);
    });

    it('should show `Provide Credentials` link for each service instance', function () {
      var serviceInstanceRows = helpers.getTableRows(serviceInstancesTable);
      for (var i = 0; i < serviceInstanceRows.count(); i++) {
        expect(registration.provideCredentialsLink(i).isDisplayed()).toBeTruthy();
      }
    });

    it('should have the `Done` button disabled initially', function () {
      expect(registration.doneButton().isEnabled()).toBeFalsy();
    });

    it('should not show credentials form initially', function () {
      expect(registration.credentialsFlyout().isDisplayed()).toBeFalsy();
    });
  });

  describe('service instance `Provide Credentials` clicked', function () {
    beforeAll(function () {
      registration.provideCredentials(0);
      browser.driver.sleep(1000);
    });

    it('should show credentials form in flyout', function () {
      expect(registration.credentialsFlyout().isDisplayed()).toBeTruthy();
    });

    it('should show `Service` and `URL` as readonly, and `Username` and `Password` as text/password fields', function () {
      var fields = registration.credentialsFormFields();
      expect(fields.get(0).getTagName()).toBe('input');
      expect(fields.get(0).getAttribute('readonly')).toBe('true');
      expect(fields.get(0).getAttribute('type')).toBe('text');
      expect(fields.get(1).getTagName()).toBe('input');
      expect(fields.get(1).getAttribute('readonly')).toBe('true');
      expect(fields.get(1).getAttribute('type')).toBe('text');
      expect(fields.get(2).getTagName()).toBe('input');
      expect(fields.get(2).getAttribute('readonly')).toBe(null);
      expect(fields.get(2).getAttribute('type')).toBe('text');
      expect(fields.get(3).getTagName()).toBe('input');
      expect(fields.get(3).getAttribute('readonly')).toBe(null);
      expect(fields.get(3).getAttribute('type')).toBe('password');
    });

    it('should show/hide password in plain text when eye icon toggled', function () {
      registration.togglePassword();

      var fields = registration.credentialsFormFields();
      expect(fields.get(3).getAttribute('type')).toBe('text');

      registration.togglePassword();
      expect(fields.get(3).getAttribute('type')).toBe('password');
    });

    it('should enable `Register` button when all required fields filled out', function () {
      expect(registration.registerButton().isEnabled()).toBeFalsy();

      var fields = registration.credentialsFormFields();
      fields.get(2).sendKeys('username');
      fields.get(3).sendKeys('password');

      expect(registration.registerButton().isEnabled()).toBeTruthy();
    });

    it('should close flyout and not save data when cancelled', function () {
      registration.cancel();

      browser.driver.sleep(1000);

      expect(registration.credentialsFlyout().isDisplayed()).toBeFalsy();
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toBe('sparklePony');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 3).getText()).toBe('');
    });

    it('should close flyout and update row in table when registered', function () {
      registration.provideCredentials(0);
      browser.driver.sleep(1000);

      var fields = registration.credentialsFormFields();
      fields.get(2).sendKeys('username');
      fields.get(3).sendKeys('password');

      registration.register();
      browser.driver.sleep(1000);

      expect(registration.credentialsFlyout().isDisplayed()).toBeFalsy();
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toBe('username');

      var registeredCol = helpers.getTableCellAt(serviceInstancesTable, 0, 3);
      expect(registeredCol.element(by.css('span.helion-icon-Active_L')).isDisplayed()).toBeTruthy();
    });
  });

  describe('service instance `Unregister`', function () {
    it('should update row in table when unregistered', function () {
      registration.unregister(0);

      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toBe('');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 3).getText()).toBe('');
    });

    it('should disable `Done` button if no service instances registered', function () {
      expect(registration.doneButton().isEnabled()).toBeFalsy();
    });
  });

  describe('on service instance registered', function () {
    beforeAll(function () {
      registration.provideCredentials(0);
      browser.driver.sleep(1000);

      var fields = registration.credentialsFormFields();
      fields.get(2).sendKeys('username');
      fields.get(3).sendKeys('password');

      registration.register();
      browser.driver.sleep(1000);
    });

    it('should enable `Done` button', function () {
      expect(registration.doneButton().isEnabled()).toBeTruthy();
    });

    it('should show `1 CLUSTER REGISTERED` next to `Done` button', function () {
      expect(registration.registrationNotification().getText()).toBe('1 CLUSTER REGISTERED');
    });

    it('should show applications view when `Done` clicked', function () {
      registration.completeRegistration();
      browser.driver.sleep(1000);

      expect(registrationOverlay.isPresent()).toBeFalsy();
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications');
    });
  });
});
