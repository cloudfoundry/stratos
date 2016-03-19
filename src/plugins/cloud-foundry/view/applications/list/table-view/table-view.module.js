(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list.table-view', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list.table-view', {
      url: '/table-view',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/table-view/table-view.html'
    });
  }

})();
