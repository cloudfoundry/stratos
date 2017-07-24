(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'appSetup',             // plugin application identity
      'app-setup',            // plugin application's root angular module name
      'plugins/app-setup/',   // plugin application's base path
      'setup'                 // Main start state
    );
  }

})();
