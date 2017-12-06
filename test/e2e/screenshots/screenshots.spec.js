(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var mkdirp = require('mkdirp');
  var components = require('../../../build/components');
  var imagemin = require('imagemin');
  var imageminPngquant = require('imagemin-pngquant');

  function requirePo(component, po) {
    var c = components.getComponents()[component];
    var base = c.frontend && c.frontend.base ? '/' + c.frontend.base : '';
    var path = '../../../components/' + component + base + '/test/e2e/po/' + po;
    return require(path);
  }

  // Page Objects from the components

  var helpers = requirePo('app-core', 'helpers.po');
  var loginPage = requirePo('app-core', 'login-page.po');
  var endpointsDashboard = requirePo('endpoints-dashboard', 'endpoints/endpoints-dashboard.po');
  var applicationWall = requirePo('cloud-foundry', 'applications/applications.po');
  var application = requirePo('cloud-foundry', 'applications/application.po');
  var endpointsListCf = requirePo('cloud-foundry', 'endpoints/endpoints-list-cf.po');
  var endpointsOrgsSpace = requirePo('cloud-foundry', 'endpoints/endpoints-org-spaces.po');

  // Screen shot folder in the docs folder

  var screenShotFolder = path.resolve('./docs/images/screenshots');
  mkdirp(screenShotFolder);

  // Intiial markdown contents
  var markdown = '# Stratos UI Screenshots\n\n';

  // Org and Space to use for the Cloud Foundry Space view
  var ORG_NAME = 'SUSE';
  var SPACE_NAME = 'dev';

  // Take a screen shot and optimize the png to reduce file size
  function screenshot(name, title) {
    function writeScreenshot(data, filename) {
      return imagemin.buffer(new Buffer(data, 'base64'), {
        use: imageminPngquant()
      }).then(function (img) {
        var stream = fs.createWriteStream(filename);
        stream.write(img);
        stream.end();
      });
    }

    var filename = name + '.png';
    browser.driver.sleep(1000);
    browser.takeScreenshot().then(function (png) {
      markdown += '## ' + title + '\n\n';

      markdown += '![' + title + '](' + filename + ')\n';
      markdown += '\n\n';
      return writeScreenshot(png, path.join(screenShotFolder, filename));
    });
  }

  // Screen Shot Tests

  // Note: this assumes that these tests run in the sequence declared here
  describe('Screen shots', function () {
    beforeAll(function () {
      helpers.setBrowserSize(1280, 1024);
      helpers.loadApp();
    });

    afterAll(function () {
      // Write the markdown file
      /* eslint-disable no-sync */
      fs.writeFileSync(path.join(screenShotFolder, 'README.md'), markdown);
      /* eslint-enable no-sync */
    });

    it('show login page', function () {
      expect(loginPage.loginPanel().isDisplayed()).toBeTruthy();
      screenshot('login-page', 'Login Page');
    });

    it('show applicaton wall', function () {
      loginPage.enterLogin(helpers.getAdminUser(), helpers.getAdminPassword());
      loginPage.loginButton().click();
      applicationWall.setListView();
      screenshot('app-wall', 'Application Wall');
    });

    it('show applicaton summary', function () {
      applicationWall.setGridView();
      applicationWall.showApplicationDetails(0);
      screenshot('app-summary', 'Application Summary');
    });

    it('show applicaton log stream', function () {
      application.showLogView();
      // Let some logging build up
      browser.driver.sleep(1000);
      screenshot('app-log-stream', 'Application Log Stream');
    });

    it('show applicaton events', function () {
      application.goToTab(4);
      screenshot('app-events', 'Application Events');
    });

    it('show applicaton ssh', function () {
      application.goToTab(5);

      element(by.css('.app-instance-item')).click();

      var term = element(by.css('.terminal.xterm'));
      browser.driver.sleep(5000);
      //term.sendKeys('ls -al\n');
      term.sendKeys('top\n');
      browser.driver.sleep(2000);
      screenshot('app-ssh', 'Application SSH');
    });

    it('show cloud foundry dashboard', function () {
      endpointsListCf.showCfEndpoints();
      browser.driver.sleep(2000);
      screenshot('cloud-foundry', 'Cloud Foundry Cluster Management');
    });

    it('show cloud foundry spaces', function () {
      endpointsOrgsSpace.goToOrg(ORG_NAME);
      browser.driver.sleep(2000);
      endpointsOrgsSpace.goToSpace(SPACE_NAME);
      screenshot('cloud-foundry-space', 'Cloud Foundry Space Management');
    });

    it('show endpoints dashboard', function () {
      endpointsDashboard.showEndpoints();
      screenshot('endpoints', 'Endpoints Dashboard');
    });

  });
})();
