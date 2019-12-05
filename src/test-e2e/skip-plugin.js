/* eslint-disable angular/typecheck-function, angular/log, no-console */
(function () {
  'use strict';

  module.exports.install = function (jasmine) {
    const global = jasmine.getGlobal();
    const _super = {
      describe: global.describe,
      fdescribe: global.fdescribe,
      xdescribe: global.xdescribe
    };

    function checkSuiteSkipped(suite, skipFn) {
      if (!skipFn) {
        return;
      }
      // Add a method to the suite object to allow the suite to be skipped on a condition
      function markDisabled(testSuite) {
        if (testSuite && testSuite.children) {
          for (let i = 0; i < testSuite.children.length; i++) {
            const item = testSuite.children[i];
            item.disabled = true;
            markDisabled(item);
          }
        }
      }
      let skipped = false;
      if (typeof skipFn === 'function') {
        skipped = skipFn();
        if (skipped) {
          markDisabled(suite);
        }
      }
      return suite;
    }

    global.describe = function (desc, skipWhen, specDefinition) {
      let args = [desc, skipWhen];
      if (skipWhen && specDefinition) {
        args = [desc, specDefinition];
      }
      const suite = _super.describe.apply(this, args);
      return checkSuiteSkipped(suite, (skipWhen && specDefinition) ? skipWhen : null);
    };

    global.fdescribe = function (desc, skipWhen, specDefinition) {
      let args = [desc, skipWhen];
      if (skipWhen && specDefinition) {
        args = [desc, specDefinition];
      }
      const suite = _super.fdescribe.apply(this, args);
      return checkSuiteSkipped(suite, (skipWhen && specDefinition) ? skipWhen : null);
    };

    global.xdescribe = function (desc, skipWhen, specDefinition) {
      let args = [desc, skipWhen];
      if (skipWhen && specDefinition) {
        args = [desc, specDefinition];
      }
      const suite = _super.xdescribe.apply(this, args);
      return checkSuiteSkipped(suite, (skipWhen && specDefinition) ? skipWhen : null);
    };

  };

  // Custom reporter to summarize skipped tests
  module.exports.reporter = function () {
    var total = 0;
    var skipped = 0;

    const ansi = {
      green: '\x1B[32m',
      red: '\x1B[31m',
      yellow: '\x1B[33m',
      none: '\x1B[0m'
    };

    function colorize(color, str) {
      return ansi[color] + str + ansi.none;
    }

    return {
      jasmineStarted: function () {},
      suiteStarted: function () {},
      specStarted: function () {},
      specDone: function (result) {
        if (result.status === 'disabled') {
          skipped++;
        }
        total++;
      },
      suiteDone: function () {},
      jasmineDone: function () {
        if (skipped > 0) {
          console.log(colorize('yellow', '-------------------------------------------'));
          console.log(colorize('yellow', 'WARNING: Some tests were skipped: ' + skipped + '/' + total));
          console.log(colorize('yellow', '-------------------------------------------'));
        }
      }
    };
  };
})();
