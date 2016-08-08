(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [
      'cloud-foundry.view.applications.application',
      'cloud-foundry.view.applications.list',
      'cloud-foundry.view.applications.workflows'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications', {
      url: '/applications',
      templateUrl: 'plugins/cloud-foundry/view/applications/applications.html',
      data: {
        activeMenuState: 'cf.applications'
      }
    });
  }

})();
