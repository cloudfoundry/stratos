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

  describe("while viewing the application gallery", function(){
   beforeAll(function () {
    galleryPage.showApplications();
      browser.pause();
  });
    describe('and you click a card', function () {
       beforeAll(function () {
        galleryPage.showApplicationDetails(0);
       });
       describe('and you click on the services tab',function(){
         beforeAll(function () {
           galleryPage.showServices();
           browser.driver.sleep(1000);
         });
         describe("and you click on 'add service'",function() {
           beforeAll(function() {
             galleryPage.showServiceDetails();
             browser.driver.sleep(1000);
           });

           it("shows the service preview panel", function() {
             galleryPage.applicationServiceFlyout().isDisplayed().toBe(true);
           });

           describe("and you click on add", function() {
            beforeAll(function(){
              galleryPage.serviceAddConfirm();
            });
            it("should hide the service preview panel", function() {
              galleryPage.applicationServiceFlyout().isDisplayed().toBe(false);
            });

           });

         });

       })


    });

  })


});
