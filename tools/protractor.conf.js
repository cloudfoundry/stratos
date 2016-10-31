'use strict';

// Maintain Order
var acceptanceTests = [
  '../e2e/acceptance/login-page.spec.js',
  '../e2e/acceptance/service-instance-registration.spec.js',
  '../e2e/acceptance/endpoints-dashboard.spec.js',
  '../e2e/acceptance/endpoints-list-hce.spec.js',
  '../e2e/acceptance/endpoints-list-hcf.spec.js',
  '../e2e/acceptance/applications.add-app.spec.js',
  '../e2e/acceptance/applications.gallery.spec.js'
];

exports.config = {

  suites: {
    all: acceptanceTests.concat('../e2e/**/*.spec.js'),
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
    protocol: '',
    host: '',
    port: '',
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
    cnsi: {
      hcf: {
        hcf1: {
          register: {
            api_endpoint: 'https://api.hcf.hsc.stacktest.io',
            cnsi_name: 'hcf',
            skip_ssl_validation: 'true'
          },
          admin: {
            username: 'admin',
            password: 'hscadmin'
          },
          user: {
            username: 'rcox',
            password: 'changeme'
          },
          testOrgName:  'e2e',
          testSpaceName: 'e2e'
        }
      },
      hce: {
        hce1: {
          register: {
            api_endpoint: 'https://hce.hscdemo.stacktest.io',
            cnsi_name: 'hce',
            skip_ssl_validation: 'true'
          },
          admin: {
            username: 'hceadmin',
            password: 'hscadmin'
          }
        }
      }
    }
  },

  onPrepare: function () {
    // // Not quite sure we need this, could be helpful.
    // var jasmineReporters = require('jasmine-reporters');
    // jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
    //   savePath: 'e2e-results'
    // }));

    // Optional. Really nice to see the progress of the tests while executing
    var SpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'specs'}));
  },

  jasmineNodeOpts: {
    // disable default jasmine report (using jasmine-spec-reporter
    print: function () { }
  }
};
