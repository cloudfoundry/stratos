// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {
  SpecReporter
} = require('jasmine-spec-reporter');

const HtmlReporter = require('stratos-protractor-reporter');
const moment = require('moment');
const skipPlugin = require('./src/test-e2e/skip-plugin.js');
const globby = require('globby');
const timeReporterPlugin = require('./src/test-e2e/time-reporter-plugin.js');

// Test report folder name
var timestamp = moment().format('YYYYDDMM-hh.mm.ss');
var reportFolderName = timestamp + '-e2e-report';

const SECRETS_FILE = 'secrets.yaml';

const E2E_REPORT_FOLDER = process.env['E2E_REPORT_FOLDER'] || './e2e-reports/' + reportFolderName;

var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

const secretsPath = path.join(__dirname, SECRETS_FILE)
if (!fs.existsSync(secretsPath)) {
  console.log('No secrets.yaml found at ... ', secretsPath);
  console.log('Please provide a secrets.yaml, see `src/test-e2e/secrets.yaml.example` as reference.');
  process.exit(1);
}

let secrets = {};
try {
  secrets = yaml.safeLoad(fs.readFileSync(secretsPath, 'utf8'));
} catch (e) {
  console.log('Invalid e2e secrets.yaml configuration file');
  console.log(e);
  process.exit(1);
}

// This is the maximum amount of time ALL before/after/it's must execute in
let timeout = 40000;
const checkSuiteGlob = './src/test-e2e/check/*-e2e.spec.ts';

if (process.env.STRATOS_SCRIPTS_TIMEOUT) {
  timeout = parseInt(process.env.STRATOS_SCRIPTS_TIMEOUT);
  console.log('Setting allScriptsTimeout to: ' + timeout);
}

// Allow test report to show relative times of tests
const specReporterCustomProcessors = [];
if (process.env.STRATOS_E2E_LOG_TIME) {
  specReporterCustomProcessors.push(timeReporterPlugin);
}

exports.config = {
  allScriptsTimeout: timeout,
  // Exclude the dashboard tests from all suites for now
  exclude: [
    './src/test-e2e/dashboard/dashboard-e2e.spec.ts',
  ],
  // Suites - use globby to give us more control over included test specs
  suites: {
    e2e: globby.sync([
      './src/test-e2e/**/*-e2e.spec.ts',
      '!./src/test-e2e/login/*-sso-e2e.spec.ts',
      '!' + checkSuiteGlob
    ]),
    sso: globby.sync([
      './src/test-e2e/**/*-e2e.spec.ts',
      '!./src/test-e2e/login/login-e2e.spec.ts',
      '!' + checkSuiteGlob
    ]),
    check: checkSuiteGlob,
  },
  // Default test suite is the E2E test suite
  suite: 'e2e',
  capabilities: {
    'browserName': 'chrome',
    chromeOptions: {
      useAutomationExtension: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-infobars']
    },
    acceptInsecureCerts: true
  },
  directConnect: true,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: timeout,
    print: function () {}
  },
  params: secrets,
  onPrepare() {
    skipPlugin.install(jasmine);
    require('ts-node').register({
      project: 'src/test-e2e/tsconfig.e2e.json'
    });
    jasmine.getEnv().addReporter(new HtmlReporter({
      baseDirectory: E2E_REPORT_FOLDER,
      takeScreenShotsOnlyForFailedSpecs: true,
      docTitle: 'E2E Test Report: ' + timestamp,
      docName: 'index.html',
      logIgnore: [
        /\/auth\/session\/verify - Failed to load resource/g
      ]
    }).getJasmine2Reporter());
    jasmine.getEnv().addReporter(new SpecReporter({
      spec: {
        displayStacktrace: true
      },
      customProcessors: specReporterCustomProcessors
    }));
    jasmine.getEnv().addReporter(skipPlugin.reporter());
  }
};

// Should we run e2e tests in headless Chrome?
const headless = secrets.headless || process.env['STRATOS_E2E_HEADLESS'];
if (headless) {
  exports.config.capabilities.chromeOptions.args = ['--headless', '--allow-insecure-localhost', '--disable-gpu', '--window-size=1366,768', '--no-sandbox'];
}
