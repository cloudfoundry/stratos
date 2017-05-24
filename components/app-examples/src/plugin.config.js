(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'appExamples',           // plugin application identity
      'app-examples',          // plugin application's root angular module name
      'plugins/app-examples/',  // plugin application's base path
      'examples' // plugin applications's start state
    );
  }

}());
