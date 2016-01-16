(function () {
  'use strict';

  // register this plugin application to the platform
  env && env.registerApplication && env.registerApplication(
    'cloudFoundry',           // plugin application identity
    'cloud-foundry',          // plugin applications's root angular module name
    'plugins/cloud-foundry/'  // plugin applications's base path
  );

}());
