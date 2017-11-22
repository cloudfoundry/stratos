/* eslint-disable angular/di,angular/document-service,no-sync,no-console,no-process-exit,angular/log */
(function () {
  'use strict';

  var skipPlugin = require('../components/app-core/frontend/test/e2e/po/skip-plugin.js');
  var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');
  var path = require('path');
  var reporterPath = path.resolve(__dirname, '..', 'out/e2e-failures');
  var components = require('./components');
  var _ = require('lodash');

  var reporter = new HtmlScreenshotReporter({
    dest: reporterPath,
    filename: 'test-report.html',
    ignoreSkippedSpecs: true,
    captureOnlyFailedSpecs: true,
    showQuickLinks: true
  });

  var fs = require('fs');

  if (!fs.existsSync(path.join(__dirname, 'secrets.json'))) {
    console.log('No secrets.json was found! Please provide a secrets.json, see `secrets.json.sample` as reference.');
    process.exit(1);
  }

  var secrets = require('./secrets.json');

  exports.config = {

    suites: {
      components: '',
      screenshots: [
        '../test/e2e/screenshots/*.spec.js'
      ]
    },

    // Default suite to run
    suite: 'components',

    framework: 'jasmine2',

    directConnect: true,

    capabilities: {
      browserName: 'chrome',
      version: '',
      platform: 'ANY',
      chromeOptions: {
        args: ['--no-sandbox']
      }
    },

    // Default is 11000
    allScriptsTimeout: 20000,

    params: {
      protocol: 'https://',
      host: secrets.console.host || 'localhost',
      port: secrets.console.port || '4000',
      uaa: {
        apiUrl: secrets.uaa.url,
        clientId: secrets.uaa.clientId,
        adminUsername: secrets.uaa.adminUsername,
        adminPassword: secrets.uaa.adminPassword
      },
      credentials: {
        admin: secrets.console.admin,
        user: secrets.console.user
      },
      skipSSlValidation: true,
      caCert: '',
      appWithLogStream: 'node-env',
      cnsi: {
        cf: {
          cf1: {
            register: {
              api_endpoint: secrets.cloudFoundry.url,
              cnsi_name: 'cf',
              skip_ssl_validation: 'true'
            },
            admin: secrets.cloudFoundry.admin,
            user: secrets.cloudFoundry.user,
            testOrgName: secrets.cloudFoundry.org || 'e2e',
            testSpaceName: secrets.cloudFoundry.space || 'e2e',
            supportsVersions: false
          }
        }
      },
      github: {
        valid: {
          tokenName: 'e2e-test',
          newTokenName: 'e2e-test-renamed',
          token: secrets.githubPat
        },
        repository: 'node-env',
        invalid: {
          tokenName: 'invalid-e2e-test',
          token: '0d3d0e1c098676c1f366f18a2836ebcddb3cde69 '
        }

      },
      pipelineDetails: {
        branchNames: ['e2e-1', 'e2e-2', 'e2e-3', 'e2e-4', 'e2e-5'],
        buildContainer: 'NodeJS build container'
      }
    },

    beforeLaunch: function () {
      return new Promise(function (resolve) {
        reporter.beforeLaunch(resolve);
      });
    },

    onPrepare: function () {

      skipPlugin.install(jasmine);

      // // Not quite sure we need this, could be helpful.
      // var jasmineReporters = require('jasmine-reporters');
      // jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
      //   savePath: 'e2e-results'
      // }));

      // Disable animations so e2e tests run more quickly
      var disableNgAnimate = function () {
        angular.module('disableNgAnimate', []).run(['$animate', function ($animate) {
          $animate.enabled(false);
          // disable css animations
          var style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = '* {' +
            '-webkit-transition: none !important;' +
            '-moz-transition: none !important;' +
            '-o-transition: none !important;' +
            '-ms-transition: none !important;' +
            'transition: none !important;' +
            '}';
          document.getElementsByTagName('head')[0].appendChild(style);
        }]);
      };

      browser.addMockModule('disableNgAnimate', disableNgAnimate);

      var setLocale = function () {
        angular.module('setLocale', []).config(['$injector', function ($injector) {
          // Override whatever language the running browser is in, this removes unexpected http request to
          // locale_<browser locale>.json
          var languageServiceProvider = $injector.get('languageServiceProvider');
          languageServiceProvider.setBrowserLocale('en_US');
        }]);
      };

      browser.addMockModule('setLocale', setLocale);

      // Optional. Really nice to see the progress of the tests while executing
      var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
      jasmine.getEnv().addReporter(new SpecReporter({
        displayPendingSpec: false,
        displayPendingSummary: false,
        displayStacktrace: 'specs'
      }));
      jasmine.getEnv().addReporter(reporter);
      jasmine.getEnv().addReporter(skipPlugin.reporter());
    },

    afterLaunch: function (exitCode) {
      return new Promise(function (resolve) {
        reporter.afterLaunch(resolve.bind(this, exitCode));
      });
    },

    jasmineNodeOpts: {
      defaultTimeoutInterval: 45000,
      // disable default jasmine report (using jasmine-spec-reporter)
      print: function () {
      }
    }
  };

  if (secrets.headless) {
    exports.config.capabilities.chromeOptions.args = [ '--headless', '--ignore-certificate-errors', '--disable-gpu', '--window-size=1280,800', '--no-sandbox' ];
  }

  var componentTestFiles = components.removeEmptyGlobs(components.getGlobs(['test/e2e/**/*.spec.js']).local);
  exports.config.suites.components = _.map(componentTestFiles, function (glob) {
    return '../' + glob;
  });
})();
