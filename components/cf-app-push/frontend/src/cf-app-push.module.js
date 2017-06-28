(function () {
  'use strict';

  angular
    .module('cf-app-push', [ 'cloud-foundry' ])
    .run(register);

  function register(appDeployAppService) {
    appDeployAppService.register();
  }

})();
