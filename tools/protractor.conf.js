'use strict';

exports.config = {

  specs: ['../e2e/**/*.spec.js'],

  framework: 'jasmine2',

  directConnect: true,

  capabilities: {
    'browserName': 'chrome',
    'version': '',
    'platform': 'ANY',
    'chromeOptions': {
      args: ['--no-sandbox']
    }
  },

  params: {
    hostIp: 'localhost',
    port: '',
    adminUser: '',
    adminPassword: ''
  },

  onPrepare: function () {
    // Optional. Really nice to see the progress of the tests while executing
    var SpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'specs'}));
  },

  jasmineNodeOpts: {
    // disable default jasmine report (using jasmine-spec-reporter)
    print: function () { }
  }
};
