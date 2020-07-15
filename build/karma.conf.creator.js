module.exports = function (project) {
  var path = require('path')
  var repoRoot = path.join(__dirname, '..')
  return function (config) {

    var testReportFile = process.env.NG_TEST_SUITE || 'report';
    testReportFile = `stratos-unittest-${testReportFile}.txt`;
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage-istanbul-reporter'),
        require('karma-spec-reporter'),
        require('@angular-devkit/build-angular/plugins/karma'),
        require(path.join(repoRoot, 'build/karma.test.reporter.js'))
      ],
      client: {
        clearContext: false, // leave Jasmine Spec Runner output visible in browser
        captureConsole: true,
        jasmine: {
          random: false
        }
      },
      coverageIstanbulReporter: {
        dir: path.join(repoRoot, 'coverage', project),
        reports: ['html', 'lcovonly', 'json'],
        fixWebpackSourcePaths: true,
        'report-config': {
          json: {
            // Collate all coverage-final files into a single dir for nyc to combine (it can't pick them out from `coverage`)
            file: path.join('..', 'nyc', project + '-coverage-final.json')
          }
        },
      },
      reporters: ['spec', 'kjhtml', 'stratos'],
      specReporter: {
        suppressSkipped: true, // skip result of skipped tests
      },
      stratosReporter: {
        reportFile: path.join(repoRoot, 'coverage', testReportFile),
        jsonFile: path.join(repoRoot, 'coverage', 'stratos-unittests.json'),
        summaryFile: path.join(repoRoot, 'coverage', 'stratos-unittests.txt'),
        exitCodeFile: path.join(repoRoot, 'coverage', 'stratos-exitcode.txt')
      },
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: process.env.HEADLESS ? ['StratosChromeHeadless'] : ['Chrome'],
      customLaunchers: {
        StratosChromeHeadless: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox']
        },
        ChromeDebugging: {
          base: 'Chrome',
          flags: ['--remote-debugging-port=9333']
        }
      },
      singleRun: process.env.CI_ENV ? true : false,
      files: [{
        pattern: path.join(repoRoot, 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css')
      }],
      exclude: [
        '**/*-e2e.spec.ts'
      ]
    });
  };
}
