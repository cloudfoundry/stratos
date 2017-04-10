(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'codeEngine',          // plugin application identity
      'code-engine',         // plugin application's root angular module name
      'plugins/code-engine'  // plugin application's base path
    );
  }

})();
