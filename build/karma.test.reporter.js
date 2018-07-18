(function () {
  'use strict';

  /**
   * Custom spec reporter that will fail the tests if ant are skipped
   * 
   * It only does this if the CI_ENV environment variable is set to 'true'
   * 
   */
  var StratosSpecReporter = function (baseReporterDecorator) {
    baseReporterDecorator(this);

    this.skipped = 0;

    this.onSpecComplete = function (browser, result) {
      this.skipped += result.skipped ? 1 : 0;
    };

    this.onRunComplete = function (browser, result) {
      if (process.env['CHECK_TESTS'] === 'true' && this.skipped !== 0) {
        result.exitCode = 1;
        console.log('\x1b[41m\x1b[97m\x1b[1m');
        console.log('');
        console.log(' ERROR: ' + this.skipped + ' tests were skipped');
        console.log('');
        console.log(' Check that you have not used fdescribe, fit, xdescribe or xit by mistake');
        console.log('');
        console.log('\x1b[0m');
      }
    };
  };

  StratosSpecReporter.$inject = ['baseReporterDecorator'];

  module.exports = {
    'reporter:stratos': ['type', StratosSpecReporter]
  };
}());
