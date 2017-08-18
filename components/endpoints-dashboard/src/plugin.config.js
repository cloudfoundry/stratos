(function () {
  'use strict';

  // register this plugin application to the platform
  if (env && env.registerApplication) {
    env.registerApplication(
      'endpointsDashboard', // plugin application identity
      'endpoints-dashboard', // plugin application's root angular module name
      'plugins/endpoints-dashboard', // plugin application's base path
      'endpoint.dashboard' // Main start state
    );
  }

})();
