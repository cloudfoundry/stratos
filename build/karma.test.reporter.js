(function () {
  'use strict';

  var fs = require('fs');

  /**
   * Custom spec reporter that will fail the tests if any are skipped
   * 
   * It only does this if the CI_ENV environment variable is set to 'true'
   * 
   */
  var StratosSpecReporter = function (baseReporterDecorator, config) {
    baseReporterDecorator(this);

    const reporterConfig = Object.assign({}, config.stratosReporter);
    this.file = reporterConfig.reportFile || './stratos-test-report.log';
    this.jsonFile = reporterConfig.jsonFile || './stratos-test-report.json';
    this.summaryFile = reporterConfig.summaryFile || './stratos-test-report.txt';
    this.exitCodeFile = reporterConfig.exitCodeFile || './stratos-test.exitcode';

    this.skipped = 0;
    this.total = 0;
    this.failed = [];

    this.bold = '\x1b[1m';
    this.red = '\x1b[31m';
    this.cyan = '\x1b[96m';
    this.yellow = '\x1b[33m';
    this.reset = '\x1b[0m';
    this.bluebg = '\x1b[44m';
    this.grey = '\x1b[90m';

    // Running totals accumated across other test runs
    this.runningTotals = {};

    this.exitCode = 0;

    if (fs.existsSync(this.jsonFile)) {
      let rawdata = fs.readFileSync(this.jsonFile);
      this.runningTotals = JSON.parse(rawdata);
    } else {
      this.runningTotals = {
        total: 0,
        passed: 0,
        skipped: 0,
        failed: 0,
      };
    }

    if (fs.existsSync(this.exitCodeFile)) {
      let rawdata = fs.readFileSync(this.exitCodeFile);
      this.exitCode = parseInt(rawdata);
    }

    this.writeFile = (msg) => {
      fs.appendFileSync(this.file, `${msg}\n`);
    }

    this.writeSummaryFile = (msg) => {
      fs.appendFileSync(this.summaryFile, `${msg}\n`);
    }

    this.onSpecComplete = (browser, result) => {
      this.total = this.total + 1;
      this.skipped += result.skipped ? 1 : 0;
      if (!result.success) {
        this.failed.push(result);
      }
    };

    this.generateSummary = () => {

      if (fs.existsSync(this.summaryFile)) {
        fs.unlinkSync(this.summaryFile);
      }

      const all = this.runningTotals;

      this.writeSummaryFile(`${this.bold}${this.cyan}================================================================================${this.reset}`);
      this.writeSummaryFile(`${this.bold}${this.cyan}Test Summary${this.reset}`);
      this.writeSummaryFile(`${this.bold}${this.cyan}================================================================================${this.reset}`);
      this.writeSummaryFile(`Total    : ${this.bold}${this.cyan}${all.total}${this.reset}`)
      this.writeSummaryFile(`Passed   : ${this.bold}${this.cyan}${all.passed}${this.reset}`)
      this.writeSummaryFile(`Failed   : ${this.bold}${this.red}${all.failed}${this.reset}`)
      this.writeSummaryFile(`Skipped  : ${this.bold}${this.yellow}${all.skipped}${this.reset}`)
    }

    this.onRunComplete = (browser, result) => {

      if (fs.existsSync(this.file)) {
        fs.unlinkSync(this.file);
      }

      let passed = this.total - this.failed.length - this.skipped;
      if (process.env['CHECK_TESTS'] === 'true' && this.skipped !== 0) {
        // result.exitCode = 1;
        console.log('\x1b[41m\x1b[97m\x1b[1m');
        console.log('');
        console.log(' WARNING: ' + this.skipped + ' tests were skipped');
        console.log('');
        console.log(' Check that you have not used fdescribe, fit, xdescribe or xit by mistake');
        console.log('');
        console.log('\x1b[0m');
      }

      try {

        this.writeFile(`${this.bold}${this.cyan}Test results for package ${this.bluebg} ${process.env.NG_TEST_SUITE} ${this.reset}`);
        this.writeFile(`Total    : ${this.bold}${this.cyan}${this.total}${this.reset}`)
        this.writeFile(`Passed   : ${this.bold}${this.cyan}${passed}${this.reset}`)
        this.writeFile(`Failed   : ${this.bold}${this.red}${this.failed.length}${this.reset}`)
        this.writeFile(`Skipped  : ${this.bold}${this.yellow}${this.skipped}${this.reset}`)

        if (this.failed.length === 0) {
          fs.appendFileSync(this.file, 'All tests passed\n')
        } else {
          this.writeFile('Test failures:');
          this.failed.forEach(f => {
            this.writeFile(`${this.red}${this.bold} - ${f.fullName}${this.reset}`);
            const logs = f.log || [];
            logs.forEach(l => fs.appendFileSync(this.file, `${this.grey}    ${l}${this.reset}`));
            // Add empty line
            this.writeFile('');
          });
        }

        // Update running totals JSON
        this.runningTotals.total += this.total;
        this.runningTotals.passed += passed;
        this.runningTotals.failed += this.failed.length;
        this.runningTotals.skipped += this.skipped;
        fs.writeFileSync(this.jsonFile, JSON.stringify(this.runningTotals));

        this.generateSummary();

        // Write exit code
        let newExitCode = this.exitCode;
        if (result.exitCode > 0) {
          newExitCode = result.exitCode
        }

        fs.writeFileSync(this.exitCodeFile, newExitCode.toString());

        // Dump the summary for this test suite
        var contents = fs.readFileSync(this.file, 'utf8');
        console.log(contents);

      } catch (e) {
        console.log('ERROR while reporting test result');
        console.log(e);
      }
    };
  };

  StratosSpecReporter.$inject = ['baseReporterDecorator', 'config'];

  module.exports = {
    'reporter:stratos': ['type', StratosSpecReporter]
  };
}());
