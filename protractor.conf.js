// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {
  SpecReporter
} = require('jasmine-spec-reporter');

const HtmlReporter = require('stratos-protractor-reporter');
const moment = require('moment');
const skipPlugin = require('./src/test-e2e/skip-plugin.js');

var timestamp = moment().format('DD_MM_YYYY-hh.mm.ss');

var reportFolderName = 'stratos-e2e-' + timestamp;

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


exports.config = {
  allScriptsTimeout: 30000,
  suites: {
    e2e: [
      './src/test-e2e/login/*-e2e.spec.ts',
      './src/test-e2e/endpoints/*-e2e.spec.ts',
      './src/test-e2e/application/*-e2e.spec.ts',
      './src/test-e2e/applications/*-e2e.spec.ts',
      './src/test-e2e/cloud-foundry/*-e2e.spec.ts',
    ],
    check: './src/test-e2e/check/*-e2e.spec.ts',
  },
  suite: 'e2e',
  capabilities: {
    'browserName': 'chrome',
    chromeOptions: {
      useAutomationExtension: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    },
    acceptInsecureCerts: true
  },
  directConnect: true,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
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
      }
    }));
    jasmine.getEnv().addReporter(skipPlugin.reporter());
  }
};

// Should we run e2e tests in headless Chrome?
const headless = secrets.headless || process.env['STRATOS_E2E_HEADLESS'];
if (headless) {
  exports.config.capabilities.chromeOptions.args = ['--headless', '--allow-insecure-localhost', '--disable-gpu', '--window-size=1366,768', '--no-sandbox'];
}
