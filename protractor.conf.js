// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {
  SpecReporter
} = require('jasmine-spec-reporter');

var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');

var reportFolderName = 'stratos-e2e-' + new Date();

var screenshotReporter = new HtmlScreenshotReporter({
  dest: './e2e-reports/' + reportFolderName,
  filename: 'index.html',
  captureOnlyFailedSpecs: true,
  reportTitle: 'Stratos E2E Test Report: ' + new Date(),
  inlineImages: true,
  reportFailedUrl: true  
});

const SECRETS_FILE = 'secrets.yaml';

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
  allScriptsTimeout: 11000,
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
      args: ['--no-sandbox']
    }
  },
  // Setup the report before any tests start
  beforeLaunch: function() {
    return new Promise(function(resolve){
      screenshotReporter.beforeLaunch(resolve);
    });
  },
  // Close the report after all tests finish
  afterLaunch: function(exitCode) {
    return new Promise(function(resolve){
      screenshotReporter.afterLaunch(resolve.bind(this, exitCode));
    });
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
    require('ts-node').register({
      project: 'src/test-e2e/tsconfig.e2e.json'
    });
    jasmine.getEnv().addReporter(screenshotReporter);
    jasmine.getEnv().addReporter(new SpecReporter({
      spec: {
        displayStacktrace: true
      }
    }));
  }
};

if (secrets.headless) {
  exports.config.capabilities.chromeOptions.args = ['--headless', '--allow-insecure-localhost', '--disable-gpu', '--window-size=1366,768', '--no-sandbox'];
}
