/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  var path = require('path');
  var _ = require('../tools/node_modules/lodash');

  var currentFile;
  var currentTest;
  var spaces = 0;

  var INDENT = 4;

  function newTestRecord(name) {
    return {
      name: name,
      total: 0,
      suites: [],
      tests: []
    };
  }

  var root = newTestRecord('ROOT');
  currentTest = root;

  console.log('Listing tests');

  // Lasr arg is the protractor config file
  var configFile = process.argv[2];
  configFile = path.resolve(process.cwd(), configFile);
  var config = require(configFile).config;
  var suite = config.suites[config.suite];

  global.browser = {
      params: config.params
  };

  global.describe = function(name, fn) {
      console.log(_.padStart('', spaces) + name);
      var current = currentTest;
      currentTest = newTestRecord(name);
      if (current === root) {
        // First test for this file
        currentTest.file = currentFile;
      }
      // Add this suite to the parent
      current.suites.push(currentTest);
      spaces += INDENT;
      fn();
      spaces -= INDENT;
      current.total += currentTest.total;
      currentTest = current;

      return {
          skipWhen: function(skipFn) {}
      };
  };

  global.beforeAll = function() {};
  global.afterAll = function() {};
  global.beforeEach = function() {};
  global.afterEach = function() {};

  global.it = function(name, fn) {
      //current.tests = current.tests || {};
      //current.tests.push(name);
      console.log('Processing test file: ' + _.padStart('', spaces) + name);
      currentTest.tests.push(name);
      currentTest.total++;
  };

  var suites = [
    '../e2e/tests/acceptance/login-page.spec.js'
  ];

  _.each(suite, function (testFile) {
      console.log(_.padStart('', spaces) + testFile);
      currentFile = testFile;
      require(testFile);
  });

  //console.log(JSON.stringify(root, undefined, 4));
  //console.log('-----')

  console.log('\n' + _.padEnd('Test File', 72) + 'Tests\n');

  _.each(root.suites, function(tests) {
    var name = tests.file.substr(0, 70);
    console.log(_.padEnd(name, 72) + tests.total);
  });

  console.log('');

  console.log(_.padEnd('Total', 72) + root.total);

})();