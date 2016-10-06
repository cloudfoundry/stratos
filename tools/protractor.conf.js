'use strict';

exports.config = {

  suites: {
    all: '../e2e/**/*.spec.js',
    // Tests in the Acceptance suite are executed in order and depend on the state of the test system from previous tests
    acceptance: '../e2e/acceptance/**/*.spec.js'
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
            api_endpoint: 'https://api.hcf.hsc.stacktest.io',
            cnsi_name: 'hcf',
            skip_ssl_validation: 'true'
          },
          admin: {
            username: 'hseadmin',
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
    //{displayStacktrace: 'all'}
    jasmine.getEnv().addReporter(new SpecReporter());
  }
};
