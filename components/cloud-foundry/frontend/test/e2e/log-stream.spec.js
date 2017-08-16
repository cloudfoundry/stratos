(function () {
  'use strict';

  var galleryWall = require('./po/applications/applications.po');
  var application = require('./po/applications/application.po');
  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var cfHelpers = require('./po/helpers.po');
  var resetTo = require('../../../../app-core/frontend/test/e2e/po/resets.po');
  var inputText = require('../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var loginPage = require('../../../../app-core/frontend/test/e2e/po/login-page.po');

  describe('Application Log Stream', function () {

    var haveAppWithLogStream = false;

    beforeAll(function () {
      // Reset all cnsi that exist in params and connect
      var init = resetTo.resetAllCnsi()
        .then(function () {
          // Connect the test non-admin user to all cnsis in params
          return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
        })
        .then(function () {
          // Connect the test admin user to all cnsis in params (required to ensure correct permissions are set when
          // creating orgs + spaces)
          return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
        })
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          return loginPage.loginAsAdmin();
        })
        .then(function () {
          // Ensure that no org or space is selected when we come into the app wall
          galleryWall.resetFilters();
          return galleryWall.setGridView();
        });
      // Ensure we don't continue until everything is set up
      return browser.driver.wait(init);
    });

    afterAll(function () {
      galleryWall.showApplications();
    });

    function getLogViewerScrollTop() {
      return browser.executeScript('return $(".log-container").scrollTop()');
    }

    it('Should stream the log of an app', function () {
      // If the node-env app can not be found, this test will just be skipped
      // It does not currently cause a failure in that case
      galleryWall.showApplications();
      galleryWall.resetFilters();
      var appNameSearchBox = inputText.wrap(galleryWall.appNameSearch());
      appNameSearchBox.clear();
      appNameSearchBox.addText(cfHelpers.getAppNameWithLogStream());

      element.all(by.css('application-gallery-card .panel-heading.linked')).then(function (apps) {
        if (apps.length !== 1) {
          // Can't find the app, or too many - so skip the test
          pending('Can not test log stream - can not find the application: ' + cfHelpers.getAppNameWithLogStream());
        } else {
          // Go into the app view for the app
          apps[0].click();
          application.showLogView();
          haveAppWithLogStream = true;
        }
      });
    });

    // This must run after the previous test
    describe('with a log streaming', function () {
      beforeAll(function () {
        if (!haveAppWithLogStream) {
          pending('Can not test log stream - can not find the application: ' + cfHelpers.getAppNameWithLogStream());
        }
      });

      it('should be showing the log stream', function () {
        // Let the log stream for a short time
        browser.driver.sleep(500);
        // Should be scrolling
        var initialScroll = getLogViewerScrollTop();
        browser.driver.sleep(1000);
        var nextScroll = getLogViewerScrollTop();
        expect(initialScroll).toBeLessThan(nextScroll);
      });

      it('show a green indicator to show log is being streamed', function () {
        // Check icon is green
        var logStatusIcon = element(by.css('.app-log-stream-indicator'));
        expect(helpers.hasClass(logStatusIcon, 'text-primary')).toBe(true);
        expect(helpers.hasClass(logStatusIcon, 'log-stream-ok')).toBe(true);
      });

      /*

      it('should stop scrolling when manually scrolled', function () {
        // Move the scroll to the top to stop auto-scroll
        browser.executeScript('$(".log-container").scrollTop(0);');
        var initialScroll = getLogViewerScrollTop();
        browser.driver.sleep(500);
        var nextScroll = getLogViewerScrollTop();
        expect(initialScroll).toBe(nextScroll);
      });

      it('should continue to scroll when auto scroll is clicked', function () {
        element(by.css('.app-log-stream-autoScroll')).click();
        // Should be scrolling
        var initialScroll = getLogViewerScrollTop();
        browser.driver.sleep(1000);
        var nextScroll = getLogViewerScrollTop();
        expect(initialScroll).toBeLessThan(nextScroll);
      });
      */
    });
  }).skipWhen(cfHelpers.skipIfNoAppWithLogStream);
})();

