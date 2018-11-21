/* eslint-disable angular/typecheck-function, angular/log, no-console */
(function () {
  'use strict';

  var lastTestName = 'Initializing';

  module.exports.install = function (ja, br) {
    const _super = browser.get;
    browser.get = function() {
      const retVal = _super.apply(browser, arguments);
      log(lastTestName);
      return retVal;
    }
  };

  // Custom reporter to show current test in the browser as an overlay
  module.exports.reporter = function () {
    return {
      jasmineStarted: function () {},
      suiteStarted: function (suite) {
        lastTestName = 'Suite started: ' + suite.fullName;
        log(lastTestName);
      },
      specStarted: function (spec) {
        lastTestName = 'Spec started: ' + spec.fullName;
        log(lastTestName);
      },
      specDone: function (spec) {
        lastTestName = 'Spec ended: ' + spec.fullName;
        log(lastTestName);
      },
      suiteDone: function (suite) {
        lastTestName = 'Suite ended: ' + suite.fullName;
        log(lastTestName);
      },
      jasmineDone: function () {}
    };
  };

  function log(msg) {
    const script = 'var div = document.getElementById("stratosTestReporter") || document.createElement("div");' + 
    'div.id = "stratosTestReporter"; div.innerHTML = "' + msg + '"; div.style.padding = "4px";' +
    'div.style.color = "red"; div.style.backgroundColor = "white"; div.style.zIndex = "2000"; div.style.pointerEvents = "none"; div.style.position = "absolute"; div.style.left = "0px"; div.style.top = "0px"; document.body.appendChild(div);';
    browser.driver.executeScript(script);
  }
})();

