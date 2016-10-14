'use strict';

var utils = require('./utils');

describe('Application wall', function () {
  beforeAll(function () {
    utils.loadE2eClient();
  });

  afterAll(function () {
   utils.unloadE2eClient();
  });

  it('should show application message: "You cannot view any applications."', function () {
    utils.loadMock('app-wall');
    browser.get('http://localhost/index.e2e.html');
    var msgElem = element(by.css('.applications-msg'));
    expect(msgElem.isPresent()).toBeTruthy();
    expect(msgElem.getText()).toBe('You cannot view any applications.');
  });
});
