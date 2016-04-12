'use strict';

var helpers = require('./po/helpers.po');
var galleryPage = require('./po/application-card-gallery.po');
var registration = require('./po/service-instance-registration.po');


describe('Applications - Gallery View', function () {
  beforeEach(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
    registration.loginAndConnect();
  });

  afterEach(function () {
    registration.disconnectAndLogout();
    helpers.resetDatabase();
  });


  describe("while viewing the application gallery", function () {
    beforeEach(function () {
      galleryPage.showApplications();
      browser.driver.sleep(1000);
    });

    it('should show applications as cards', function () {
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/list/gallery-view');
    });

    describe('and you click a card', function () {
      beforeEach(function () {
        galleryPage.showApplicationDetails(0);
      });
      describe('and you click on the services tab', function () {
        beforeEach(function () {
          galleryPage.showServices();
        });
        it('should show application services URL', function () {
          expect(browser.getCurrentUrl()).toMatch(/services$/);
        });
        it('should show render multiple service panels', function () {
          expect(galleryPage.servicePanelsAddServiceButtons().count()).toBeGreaterThan(0);
        });
        describe('and you click on add service', function () {
          beforeEach(function () {
            galleryPage.showServiceDetails();
            browser.driver.sleep(1000);
          });

          afterEach(function () {
            galleryPage.closeFlyout();
          });

          it("shows the service preview panel", function () {
            expect(galleryPage.applicationServiceFlyout().isDisplayed()).toBe(true);
          });

          it("shows an add and cancel button", function () {
            expect(galleryPage.serviceDetailsActions().count()).toEqual(2);
          });
        });
        describe('and you click on add service', function () {
          beforeEach(function () {
            galleryPage.showServiceDetails();
            browser.driver.sleep(1000);
          });
          describe("and you click on cancel", function () {
            beforeEach(function () {
              galleryPage.serviceAddCancel();
              browser.driver.sleep(1000);
              browser.takeScreenshot().then(function (png) {
                writeScreenShot(png, 'cancel.png');
              });
            });
            it("hides the service preview panel", function () {
              expect(galleryPage.applicationServiceFlyout().isDisplayed()).toBe(false);
            });
          });
          describe("and you click on add", function () {
            beforeEach(function () {
              galleryPage.serviceAddConfirm();
              browser.driver.sleep(1000);
            });
            it("hides the service preview panel", function () {
              expect(galleryPage.applicationServiceFlyout().isDisplayed()).toBe(false);
            });
          });
        })

      })
    });
  })
});
