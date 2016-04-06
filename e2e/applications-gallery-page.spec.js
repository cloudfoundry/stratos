'use strict';

var helpers = require('./po/helpers.po');
var galleryPage = require('./po/application-card-gallery.po');
var registration = require('./po/service-instance-registration.po');

describe('Applications - Gallery View', function () {
  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
    registration.loginAndConnect();
  });

  afterAll(function () {
    registration.disconnectAndLogout();
    helpers.resetDatabase();
  });

  it('should show applications as cards', function() {
    galleryPage.showApplications();
    expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() +'/#/cf/applications/list/gallery-view');
    expect(galleryPage.applicationGalleryCards().isDisplayed()).toBeTruthy();
  });

  describe('on card click', function () {
    it('should show application details', function () {
      galleryPage.showApplicationDetails(0);
      expect(browser.getCurrentUrl()).toMatch(/summary$/);
    });
  });
});
