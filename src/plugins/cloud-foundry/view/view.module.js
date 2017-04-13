(function () {
  'use strict';

  angular
    .module('cloud-foundry.view', [
      'cloud-foundry.view.applications'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf', {
      url: '/cf',
      templateUrl: 'plugins/cloud-foundry/view/view.html'
    });
  }

})();
