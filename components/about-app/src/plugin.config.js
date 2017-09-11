(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'aboutApp', // plugin application identity
      'about-app', // plugin application's root angular module name
      'plugins/about-app/', // plugin application's base path
      'about-app' // plugin applications's start state
    );
  }

}());
