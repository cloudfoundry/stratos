(function () {
  'use strict';

  var galleryWall = require('../../po/applications/applications.po');
  var application = require('../../po/applications/application.po');
  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var inputText = require('../../po/widgets/input-text.po');
  var loginPage = require('../../po/login-page.po');

  fdescribe('Application Log Stream', function () {

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
        }).then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          return loginPage.loginAsAdmin();
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

    it('Should stream the log of the "node-env" app', function () {
      // If the node-env app can not be found, this test will just be skipped
      // It does not currently cause a failure in that case
      galleryWall.showApplications();
      galleryWall.resetFilters();
      var appNameSearchBox = inputText.wrap(galleryWall.appNameSearch());
      appNameSearchBox.clear();
      appNameSearchBox.addText('node-env');

      element.all(by.css('application-gallery-card .panel-heading.linked')).then(function (apps) {
        if (apps.length !== 1) {
          // Can't find the app, or too many - so skip the test
          pending('Can not test log stream - can not find the "node-env" application');
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
          pending('Can not test log stream - can not find the "node-env" application');
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
        expect(helpers.hasClass(logStatusIcon, 'helion-icon-Active_S')).toBe(true);
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
  });
})();

