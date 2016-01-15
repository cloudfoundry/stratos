(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.services', {
      url: '/services',
      templateUrl: 'plugins/cloud-foundry/view/services/services.html'
    });
  }

})();
