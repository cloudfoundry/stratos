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
      adminUser: '',
      adminPassword: '',
      user: '',
      password: ''
    },
    cnsi: {
      hcf: undefined,
      hce: undefined
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
