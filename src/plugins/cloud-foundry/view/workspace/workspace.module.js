(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.workspace', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.workspace', {
      url: '/workspace',
      templateUrl: 'plugins/cloud-foundry/view/workspace/workspace.html'
    });
  }

})();
