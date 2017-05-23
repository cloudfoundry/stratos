(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'github',         // plugin application identity
      'github',         // plugin application's root angular module name
      'plugins/github'  // plugin application's base path
    );
  }

})();
