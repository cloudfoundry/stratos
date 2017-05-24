(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list.gallery-view', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list.gallery-view', {
      url: '/gallery-view',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/gallery-view/gallery-view.html'
    });
  }

})();
