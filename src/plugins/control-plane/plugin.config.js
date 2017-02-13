(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'controlPlane',           // plugin application identity
      'control-plane',          // plugin application's root angular module name
      'plugins/control-plane/'  // plugin application's base path
    );
  }

}());
