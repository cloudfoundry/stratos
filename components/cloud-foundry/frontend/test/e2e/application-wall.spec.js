/* eslint-disable angular/json-functions */
(function () {
  'use strict';
  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var applicationWall = require('./po/applications/applications.po');

  var appWallConfig3 = require('./app-wall/3-apps.js');
  var appWallConfig500 = require('./app-wall/500-apps.js');
  var appWallConfigNoClusters = require('./app-wall/no-clusters.js');
  var appWallConfigNoApps = require('./app-wall/no-apps.js');

  var ngMockE2E = require('../../../../app-core/frontend/test/e2e/po/ng-mock-e2e.po');

  describe('Application Wall', function () {

    describe('When there are no CF Endpoints', function () {
      beforeAll(function () {
        ngMockE2E.init();
        appWallConfigNoClusters(ngMockE2E.$httpBackend);
        helpers.setBrowserNormal();
        helpers.loadApp();
      });

      afterAll(function () {
        ngMockE2E.unload();
      });

      it('The page should have title "Applications"', function () {
        expect(applicationWall.getTitle()).toBe('Applications');
      });

      it('should show application message: "You cannot view any applications."', function () {
        var msgElem = element(by.css('.applications-msg'));
        expect(msgElem.isPresent()).toBeTruthy();
        expect(msgElem.getText()).toBe('You cannot view any applications.');
      });

      it('should not see ADD APPLICATION botton', function () {
        expect(applicationWall.getAddApplicationButton().isDisplayed()).not.toBeTruthy();
      });
    });

    describe('When there are no applications', function () {
      beforeAll(function () {
        ngMockE2E.init();
        appWallConfigNoApps(ngMockE2E.$httpBackend);
        helpers.setBrowserNormal();
        helpers.loadApp();
      });

      afterAll(function () {
        ngMockE2E.unload();
      });

      it('The page should have title "Applications"', function () {
        expect(applicationWall.getTitle()).toBe('Applications');
      });

      /*
       it('should show application message: "You have no applications and cannot add any."', function () {
       var msgElem = element(by.css('.applications-msg'));
       expect(msgElem.isPresent()).toBeTruthy();
       expect(msgElem.getText()).toBe('You have no applications and cannot add any.');
       });
       */
    });

    describe('When there are 3 applications in total, user', function () {
      beforeAll(function () {
        ngMockE2E.init();
        // Configure HTTP responses for all wall with 3 apps
        appWallConfig3(ngMockE2E.$httpBackend);
        helpers.setBrowserNormal();
        helpers.loadApp();
      });

      afterAll(function () {
        ngMockE2E.unload();
      });

      it('should see an ADD APPLICATION button.', function () {
        var btn = applicationWall.getAddApplicationButton();
        expect(btn.isDisplayed()).toBeTruthy();
      });

      it('should not see no-application message.', function () {
        expect(element(by.css('.applications-msg')).isPresent()).toBe(false);
      });

      it('should not see any paginator.', function () {
        expect(element(by.css('.paginator')).isPresent()).toBe(false);
      });

      it('should see 3 applications on the wall', function () {
        applicationWall.setSortOrder('App Name');
        element.all(by.css('.app-gallery-card')).then(function (items) {
          expect(items.length).toBe(3);
        });

        expect(applicationWall.getAppCount()).toBe('3');
      });

      describe('app sorting', function () {

        it('should be able to sort by name, a-z', function () {
          applicationWall.setSortOrder('App Name');
          element.all(by.css('.app-gallery-card')).then(function (items) {
            expect(items.length).toBe(3);
            expect(items[0].element(by.css('.gallery-card-title')).getText()).toBe('abc');
            expect(items[1].element(by.css('.gallery-card-title')).getText()).toBe('opq');
            expect(items[2].element(by.css('.gallery-card-title')).getText()).toBe('xyz');
          });
        });

        it('should be able to sort by name, z-a', function () {
          applicationWall.setSortOrder('App Name');
          applicationWall.toggleSortDirection();
          element.all(by.css('.app-gallery-card')).then(function (items) {
            expect(items.length).toBe(3);
            expect(items[2].element(by.css('.gallery-card-title')).getText()).toBe('abc');
            expect(items[1].element(by.css('.gallery-card-title')).getText()).toBe('opq');
            expect(items[0].element(by.css('.gallery-card-title')).getText()).toBe('xyz');
          });
        });
      });
    });

    describe('When there are 500 applications in total, user', function () {
      beforeAll(function () {
        ngMockE2E.init();
        // Configure HTTP responses for all wall with 500 apps
        appWallConfig500(ngMockE2E.$httpBackend);
        helpers.setBrowserNormal();
        helpers.loadApp();
      });

      afterAll(function () {
        ngMockE2E.unload();
      });

      it('The page should have title "Applications"', function () {
        expect(applicationWall.getTitle()).toBe('Applications');
        expect(applicationWall.getAppCount()).toBe('500');
      });

      it('should see paginator', function () {
        expect(element(by.css('.paginator')).isPresent()).toBe(true);
      });

      it('should see 11 pages available to navigate', function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          expect(items[6].getText()).toBe('11');
        });
      });

      it('should see 48 applications on the wall', function () {
        element.all(by.css('.app-gallery-card')).then(function (items) {
          expect(items.length).toBe(48);
        });
      });

      it('should see the current page is page 1', function () {
        element.all(by.css('.paginator .page-links .current')).then(function (items) {
          expect(items.length).toBe(1);
          expect(items[0].getText()).toBe('1');
        });
      });

      it('should see other buttons in paginator populated correctly', function () {
        element.all(by.css('.paginator .page-links span')).then(function (items) {
          expect(items.length).toBe(7);
          expect(items[0].getText()).toBe('1');
          expect(items[1].getText()).toBe('2');
          expect(items[2].getText()).toBe('3');
          expect(items[3].getText()).toBe('4');
          expect(items[4].getText()).toBe('5');
          expect(items[5].getText()).toBe('...');
          expect(items[6].getText()).toBe('11');
        });
      });

      it('should see a Previous link button', function () {
        var prevBtn = element(by.css('.btn-link.btn-prev'));
        expect(prevBtn.isPresent()).toBe(true);
        expect(prevBtn.getText()).toBe('Previous');
      });

      it('should see a Next link button', function () {
        var nextBtn = element(by.css('.btn-link.btn-next'));
        expect(nextBtn.isPresent()).toBe(true);
        expect(nextBtn.getText()).toBe('Next');
      });

      describe('Then after client on Next button', function () {
        beforeAll(function () {
          element(by.css('.btn-link.btn-next')).click();
        });

        it('should see 48 applications on the wall', function () {
          element.all(by.css('.app-gallery-card')).then(function (items) {
            expect(items.length).toBe(48);
          });
        });

        it('should see the current page is page 11', function () {
          element.all(by.css('.paginator .page-links .current')).then(function (items) {
            expect(items.length).toBe(1);
            expect(items[0].getText()).toBe('2');
          });
        });

        it('should see other buttons in paginator populated correctly', function () {
          element.all(by.css('.paginator .page-links span')).then(function (items) {
            expect(items.length).toBe(7);
            expect(items[0].getText()).toBe('1');
            expect(items[1].getText()).toBe('2');
            expect(items[2].getText()).toBe('3');
            expect(items[3].getText()).toBe('4');
            expect(items[4].getText()).toBe('5');
            expect(items[5].getText()).toBe('...');
            expect(items[6].getText()).toBe('11');
          });
        });
      });

      describe('After client on 11 page button', function () {
        beforeAll(function () {
          element.all(by.css('.paginator .page-links span')).then(function (items) {
            items[6].click();
          });
        });

        it('should see 20 applications on the wall.', function () {
          element.all(by.css('.app-gallery-card')).then(function (items) {
            expect(items.length).toBe(20);
          });
        });

        it('should see the current page is page 11.', function () {
          element.all(by.css('.paginator .page-links .current')).then(function (items) {
            expect(items.length).toBe(1);
            expect(items[0].getText()).toBe('11');
          });
        });

        it('should see other buttons in paginator populated correctly.', function () {
          element.all(by.css('.paginator .page-links span')).then(function (items) {
            expect(items.length).toBe(7);
            expect(items[0].getText()).toBe('1');
            expect(items[1].getText()).toBe('...');
            expect(items[2].getText()).toBe('7');
            expect(items[3].getText()).toBe('8');
            expect(items[4].getText()).toBe('9');
            expect(items[5].getText()).toBe('10');
            expect(items[6].getText()).toBe('11');
          });
        });
      });

      describe('Then after client on Previous button', function () {
        beforeAll(function () {
          element(by.css('.btn-link.btn-prev')).click();
        });

        it('should see 48 applications on the wall.', function () {
          element.all(by.css('.app-gallery-card')).then(function (items) {
            expect(items.length).toBe(48);
          });
        });

        it('should see the current page is page 11.', function () {
          element.all(by.css('.paginator .page-links .current')).then(function (items) {
            expect(items.length).toBe(1);
            expect(items[0].getText()).toBe('10');
          });
        });

        it('should see other buttons in paginator populated correctly.', function () {
          element.all(by.css('.paginator .page-links span')).then(function (items) {
            expect(items.length).toBe(7);
            expect(items[0].getText()).toBe('1');
            expect(items[1].getText()).toBe('...');
            expect(items[2].getText()).toBe('7');
            expect(items[3].getText()).toBe('8');
            expect(items[4].getText()).toBe('9');
            expect(items[5].getText()).toBe('10');
            expect(items[6].getText()).toBe('11');
          });
        });
      });
    });

    describe('Changing the view', function () {
      beforeAll(function () {
        ngMockE2E.init();
        // Configure HTTP responses for all wall with 500 apps
        appWallConfig500(ngMockE2E.$httpBackend);
        helpers.setBrowserNormal();
        helpers.loadApp();
        applicationWall.setGridView();
      });

      afterAll(function () {
        ngMockE2E.unload();
      });

      it('Should show the grid view by default', function () {
        // Reload the app to make sure the grid view is maintained
        helpers.loadApp();
        expect(applicationWall.isGridView()).toBe(true);
        expect(applicationWall.isListView()).toBe(false);
      });

      it('Should allow changing to the list view', function () {
        expect(applicationWall.isGridView()).toBe(true);
        applicationWall.setListView();
        expect(applicationWall.isGridView()).toBe(false);
        expect(applicationWall.isListView()).toBe(true);
      });
    });
  });
})();

