/* eslint-disable angular/typecheck-function, angular/log, no-console */
(function () {
  'use strict';

  var browserstack = require('browserstack-local');
  var psnode = require('ps-node');

  const BROWSERSTACK_USER = 'BROWSERSTACK_USER';
  const BROWSERSTACK_KEY = 'BROWSERSTACK_KEY';

  // e.g. "Windows 10/Chrome 69", "Window/Chrome 62", "Chrome"
  const BROWSERSTACK_TARGET = 'BROWSERSTACK_TARGET';
  const BROWSERSTACK_BUILD = 'BROWSERSTACK_BUILD';
  const BROWSERSTACK_NAME = 'BROWSERSTACK_NAME';
  const BROWSERSTACK_PROJECT = 'BROWSERSTACK_PROJECT';
  const BROWSERSTACK_RESOLUTION = 'BROWSERSTACK_RESOLUTION';

  const defaultCapabilities = {
    'browserstack.user': process.env[BROWSERSTACK_USER],
    'browserstack.key': process.env[BROWSERSTACK_KEY],
    'acceptSslCerts': true,
    'browserstack.debug': false,
    'resolution': process.env[BROWSERSTACK_RESOLUTION] || '1280x1024',
    'browserstack.local': true,
    'build': process.env[BROWSERSTACK_BUILD] || 'E2E Tests',
    'project': process.env[BROWSERSTACK_PROJECT] || 'Stratos E2E',
    'name': process.env[BROWSERSTACK_NAME] || 'E2E Tests',
    'browserstack.appiumLogs': false
  };

  // Need name and key environment variables set to run with Browserstack
  module.exports.isConfigured = function () {
    return process.env[BROWSERSTACK_USER] && process.env[BROWSERSTACK_KEY] && process.env[BROWSERSTACK_TARGET] ;
  };

  module.exports.configure = function (config) {
    config.seleniumAddress = 'http://hub-cloud.browserstack.com/wd/hub';
    config.capabilities = defaultCapabilities
    config.directConnect = false;
    setCapabilties(config.capabilities);

    // Code to start browserstack local before start of test
    config.beforeLaunch =function() {
      console.log("BrowserStack Connecting local...");
      return new Promise(function (resolve, reject) {
        exports.bs_local = new browserstack.Local();
        exports.bs_local.start({'key': config.capabilities['browserstack.key'] }, function (error) {
          if (error) return reject(error);
          console.log('BrowserStack Connected. Now testing...');

          psnode.lookup({command: 'BrowserStackLocal'}, function (err, list) {
            exports.bs_local_processes = list;
            resolve();
          });
          });
      })
    };

    // Code to stop browserstack local after end of test
    config.afterLaunch = function() {
      return new Promise(function (resolve) {
        exports.bs_local.stop(resolve);
      });
    };

    // Tests run about 4x as slow - so set the timeout to 4.5 x the 40s to compensate
    config.jasmineNodeOpts.defaultTimeoutInterval = 180000;

    // Ensure we kill off an BrowserStack Local proesses if the test fails or CTRL+C is pressed
    process.on('exit', function() {
      killBrowserLocalProcesses(exports.bs_local_processes);
     });

    process.on('SIGINT', function() {
      killBrowserLocalProcesses(exports.bs_local_processes);
      process.exit(1);
    });

    return config;
  };

  function killBrowserLocalProcesses(list) {
    for(let i = 0; i < list.length; i++) {
      psnode.kill(list[i].pid, {signal: 'SIGKILL'});
    }
  }

  function setCapabilties(capabilities) {
    const osAndBrowser = process.env[BROWSERSTACK_TARGET];
    if (!osAndBrowser) {
      capabilities.browserName = 'Chrome';
      capabilities.os = 'Windows';
      return;
    }

    // If there is a '/' then the bit before is the OS and the bit after is the browser, otherwise its just browser
    const parsed = splitInTwo(osAndBrowser, '/', true);
    if (parsed.first) {
      // OS
      const os = splitInTwo(parsed.first, '-');
      capabilities.os = os.first
      if (os.last) {
        capabilities.os_version = os.last
      }
    }
    if (parsed.last) {
      // Browser
      const browser = splitInTwo(parsed.last, ' ');
      capabilities.browserName = browser.first
      if (browser.last) {
        capabilities.browser_version = browser.last
      }
    }

    // Ensure we set an OS
    if (!capabilities.os) {
      capabilities.os = capabilities.browserName === 'Safari' ? 'OS X' : 'Windows';
    }
  }

  function splitInTwo(source, sep, optionalLast) {
    const parts = source.split(sep);
    const result = {
      first: null,
      last: null
    };
    if (parts.length === 2) {
      result.first = parts[0];
      result.last = parts[1];
    } else {
      if (optionalLast) {
        result.last = source;
      } else{
        result.first = source;
      }
    }
    return result;
  }

})();
