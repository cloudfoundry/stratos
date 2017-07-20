(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'userInfo',            // plugin application identity
      'user-info',           // plugin application's root angular module name
      'user-info/',          // plugin application's base path
      ''                     // plugin applications's start state
    );
  }

}());
