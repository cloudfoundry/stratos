/* eslint-disable angular/typecheck-function, angular/log, no-console */
(function () {
  'use strict';

  module.exports.install = function (jasmine) {
    var global = jasmine.getGlobal();
    var _super = {
      describe: global.describe,
      fdescribe: global.fdescribe,
      xdescribe: global.xdescribe
    };

    function extendSuite(suite) {
      suite.skipWhen = function (skipFn) {
        var skipped = false;

        if (typeof skipFn === 'function') {
          skipped = skipFn();
        }
        this.disabled = this.disabled || skipped;
      };
      return suite;
    }

    global.describe = function () {
      var suite = _super.describe.apply(this, arguments);
      return extendSuite(suite);
    };

    global.fdescribe = function () {
      var suite = _super.fdescribe.apply(this, arguments);
      return extendSuite(suite);
    };

    global.xdescribe = function () {
      var suite = _super.xdescribe.apply(this, arguments);
      return extendSuite(suite);
    };
  };

  module.exports.reporter = function () {

    var total = 0;
    var skipped = 0;

    var ansi = {
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
