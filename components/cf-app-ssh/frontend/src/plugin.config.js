(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'cfAppSsh', // plugin application identity
      'cf-app-ssh', // plugin application's root angular module name
      'cf-app-ssh/', // plugin application's base path
      '' // plugin applications's start state
    );
  }

}());
