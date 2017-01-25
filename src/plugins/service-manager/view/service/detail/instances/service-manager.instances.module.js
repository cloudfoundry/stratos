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
        parent: 'sm.endpoint.detail'
      }
    });
  }

  ServiceManagerInstancesController.$inject = [
    '$state'
  ];

  function ServiceManagerInstancesController($state) {
    this.$state = $state;
  }

  angular.extend(ServiceManagerInstancesController.prototype, {
    open: function (endpoint) {
      this.$state.go('sm.endpoint.instance.components', {id: endpoint.instance_id});
    }
  });

})();
