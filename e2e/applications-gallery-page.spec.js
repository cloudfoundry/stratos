'use strict';

var helpers = require('./po/helpers.po');
var galleryPage = require('./po/application-card-gallery.po');

describe('Application Gallery Page', function () {
  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
  });

  describe('content', function () {
    it('should go to application detail if card clicked', function () {
      galleryPage.showAppDetails();
    });
  });
});
