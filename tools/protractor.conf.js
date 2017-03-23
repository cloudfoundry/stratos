/* eslint-disable angular/di,angular/document-service */
(function () {
  'use strict';

  // Maintain Order
  var acceptanceTests = [
    '../e2e/tests/acceptance/login-page.spec.js',
    '../e2e/tests/acceptance/endpoints-dashboard.spec.js',
    '../e2e/tests/acceptance/endpoints-list-hcf.spec.js',
    '../e2e/tests/acceptance/endpoints-pat.spec.js',
    '../e2e/tests/acceptance/applications.add-app.spec.js',
    '../e2e/tests/acceptance/application.delivery-pipeline.spec.js',
    '../e2e/tests/acceptance/application.spec.js',
    '../e2e/tests/acceptance/hcf.organizations.spaces.spec.js',
    '../e2e/tests/acceptance/application-wall.spec.js',
    '../e2e/tests/acceptance/navbar.spec.js',
    '../e2e/tests/acceptance/log-stream.spec.js'
  ];

  var skipPlugin = require('../e2e/po/skip-plugin.js');

  exports.config = {

    suites: {
      all: '../e2e/tests/**/*.spec.js',
      localhost: '../e2e/tests/localhost/**/*.spec.js',
      other: '../e2e/tests/other/**/*.spec.js',
      acceptance: acceptanceTests
    },

    // Default suite to run
    suite: 'acceptance',

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

    params: {
      protocol: 'https://',
      host: 'localhost',
      port: '3100',
      credentials: {
        admin: {
          username: 'admin',
          password: 'hscadmin'
        },
        user: {
          username: 'user',
          password: 'hscuser'
        }
      },
      skipSSlValidation: true,
      caCert: 'ssl/stackatoCA.pem',
      appWithLogStream: 'node-env',
      cnsi: {
        hcf: {
          hcf1: {
            register: {
              api_endpoint: 'https://api.10.4.21.240.nip.io:8443',
              cnsi_name: 'hcf',
              skip_ssl_validation: 'true'
            },
            admin: {
              username: 'admin',
              password: 'hscadmin'
            },
            user: {
              username: 'e2e',
              password: 'changeme'
            },
            testOrgName: 'e2e',
            testSpaceName: 'e2e'
          }
        }
      },
      github: {
        valid: {
          tokenName: 'e2e-test',
          newTokenName: 'e2e-test-renamed',
          token: 'my-pat-token'
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

      // Optional. Really nice to see the progress of the tests while executing
      var SpecReporter = require('jasmine-spec-reporter');
      jasmine.getEnv().addReporter(new SpecReporter({
        displayPendingSpec: false,
        displayPendingSummary: false,
        displayStacktrace: 'specs'
      }));
      jasmine.getEnv().addReporter(skipPlugin.reporter());
    },

    jasmineNodeOpts: {
      // disable default jasmine report (using jasmine-spec-reporter)
      print: function () {
      }
    }
  };
})();
