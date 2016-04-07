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
   jasmineNodeOpts: {
    showColors: true,
    isVerbose: true,
    includeStackTrace: true
  }
};
