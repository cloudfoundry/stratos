'use strict';

var helpers = require('./po/helpers.po');
var galleryPage = require('./po/application-card-gallery.po');

describe('Application Gallery Page', function () {
  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
    galleryPage.login();
    browser.driver.sleep(1000);
  });

  describe('content', function () {
   describe('applications tab', function(){
     it("should show the applications gallery", function(){
      galleryPage.showApplicationsGallery();  
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() +'/#/cf/applications/list/gallery-view');
     });
     describe("and you click a card", function(){
        it('should go to application detail', function () {
          galleryPage.showApplicationDetails();
          expect(browser.getCurrentUrl()).toMatch(/summary$/);
        });
     })
   });
   
  });
});
