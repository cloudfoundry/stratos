(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'serviceManager',           // plugin application identity
      'service-manager',          // plugin application's root angular module name
      'plugins/service-manager/'  // plugin application's base path
    );
  }

}());
