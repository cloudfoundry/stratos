'use strict';

exports.config = {

  specs: ['../e2e/**/applications-service*.spec.js'],

  framework: 'jasmine2',

  directConnect: true,

  capabilities: {
    'browserName': 'chrome',
    'version': '',
    'platform': 'ANY',
    'chromeOptions': {
      args: ['--no-sandbox']
    }
  }
};
