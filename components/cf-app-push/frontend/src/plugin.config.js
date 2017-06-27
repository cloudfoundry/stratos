(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'cfAppPush',           // plugin application identity
      'cf-app-push',          // plugin application's root angular module name
      'plugins/cf-app-push/',  // plugin application's base path
      '' // plugin applications's start state
    );
  }

}());
