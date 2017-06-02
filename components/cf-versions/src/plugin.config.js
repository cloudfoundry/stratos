(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'cfVersions',           // plugin application identity
      'cf-versions',          // plugin application's root angular module name
      'plugins/cf-versions/'  // plugin application's base path
    );
  }

}());
