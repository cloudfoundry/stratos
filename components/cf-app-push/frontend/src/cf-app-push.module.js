(function () {
  'use strict';

  angular
    .module('cf-app-push', [ 'cloud-foundry' ])
    .run(register);

  /* eslint-disable no-unused-vars */
  // Ensure that an instance of appDeployAppService is created by injecting it here.
  function register(appDeployAppService) { }
  /* eslint-enable no-unused-vars */

})();
