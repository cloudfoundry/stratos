/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  var path = require('path');
  var _ = require('../tools/node_modules/lodash');
  var skipPlugin = require('./po/skip-plugin.js');

  var currentFile, currentTest;
  var spaces = 0;
  var INDENT = 4;

  var ansi = {
    green: '\x1B[32m',
    red: '\x1B[31m',
    yellow: '\x1B[33m',
    cyan: '\x1B[36m',
    none: '\x1B[0m'
  };

  function colorize(color, str) {
    return ansi[color] + str + ansi.none;
  }

  function newTestRecord(name) {
    return {
      name: name,
      total: 0,
      suites: [],
      tests: []
    };
  }

  function checkSkipped(suite) {
    var skipped = 0;
    _.each(suite.suites, function (s) {
      skipped += checkSkipped(s);
    });
    if (suite.disabled) {
      skipped += suite.total;
    }
    suite.skipped = skipped;
    return skipped;
  }

  var root = newTestRecord('ROOT');
  currentTest = root;

  console.log('Listing tests');

  // Lasr arg is the protractor config file
  var configFile = process.argv[2];
  configFile = path.resolve(process.cwd(), configFile);
  var config = require(configFile).config;
  var suite = config.suites[config.suite];

  var jasmine = {
    getGlobal: function () {
      return global;
    }
  };

  global.browser = {
    params: config.params
  };

  global.describe = function (name, fn) {
    var current = currentTest;
    var thisSuite = newTestRecord(name);
    currentTest = thisSuite;
    if (current === root) {
      // First test for this file
      currentTest.file = currentFile;
      console.log(colorize('cyan', 'Processing test file: ' + currentFile));
    }
    console.log(_.padStart('', spaces) + name);
    // Add this suite to the parent
    current.suites.push(currentTest);
    spaces += INDENT;
    fn();
    spaces -= INDENT;
    current.total += currentTest.total;
    currentTest = current;

    // return {
    //   skipWhen: function () {}
    // };
    return thisSuite;
  };

  global.beforeAll = function () {};
  global.afterAll = function () {};
  global.beforeEach = function () {};
  global.afterEach = function () {};

  global.it = function (name) {
    console.log(_.padStart('', spaces) + colorize('green', name));
    currentTest.tests.push(name);
    currentTest.total++;
  };

  skipPlugin.install(jasmine);

  _.each(suite, function (testFile) {
    //console.log(_.padStart('', spaces) + testFile);
    currentFile = testFile;
    require(testFile);
  });

  // Calculate number of skipped tests
  checkSkipped(root);

  console.log('\n' + colorize('cyan', _.padEnd('Test File', 72)) + colorize('green', 'Tests') + '    ' + colorize('yellow', 'Skipped') + '\n');

  _.each(root.suites, function (tests) {
    var name = tests.file.substr(0, 70);
    console.log(_.padEnd(name, 72) + colorize('green', _.padEnd(tests.total, 5)) + '    ' + colorize('yellow', tests.skipped));
  });

  //console.log(JSON.stringify(root.suites, undefined, 4));

  console.log('');
  console.log(_.padEnd('Total', 72) + colorize('green', _.padEnd(root.total, 5)) + '    ' + colorize('yellow', root.skipped));

})();
