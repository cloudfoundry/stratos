(function () {
  'use strict';

  angular
    .module('service-manager.view.service.detail.instances', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.detail.instances', {
      url: '/instances',
      templateUrl: 'plugins/service-manager/view/service/detail/instances/service-manager.instances.html',
      controller: ServiceManagerInstancesController,
      controllerAs: 'instancesCtrl',
      ncyBreadcrumb: {
        label: '{{ smCtrl.endpoint.name || "..." }}',
        parent: 'sm.tiles'
      }
    });
  }

  ServiceManagerInstancesController.$inject = [
    '$state'
  ];

  function ServiceManagerInstancesController($state) {
    this.$state = $state;
  }

})();
