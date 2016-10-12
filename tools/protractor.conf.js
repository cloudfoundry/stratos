'use strict';

// Maintain Order
var acceptanceTests = [
  '../e2e/acceptance/login-page.spec.js',
  '../e2e/acceptance/service-instance-registration.spec.js',
  '../e2e/acceptance/endpoints-dashboard.spec.js'
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
    hostProtocol: '',
    hostIp: '',
    port: '',
    credentials: {
      admin: {
        username: '',
        password: ''
      },
      user: {
        username: '',
        password: ''
      }
    },
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
          }
        }
      },
      hce: {
        hce1: {
          register: {
            api_endpoint: 'https://hce.julbra.stacktest.io',
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
    //
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'specs'}));
  },

  jasmineNodeOpts: {
    // disable default jasmine report (using jasmine-spec-reporter
    print: function () { }
  }
};
