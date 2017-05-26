(function () {
  'use strict';

  angular
    .module('service-manager.view.service.detail.services', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.detail.services', {
      url: '/services',
      templateUrl: 'plugins/service-manager/view/service/detail/services/service-manager.services.html',
      controller: ServiceManagerServicesController,
      controllerAs: 'servicesCtrl',
      ncyBreadcrumb: {
        label: '{{ smCtrl.endpoint.name || "..." }}',
        parent: 'sm.tiles'
      }
    });
  }

  function ServiceManagerServicesController($state) {
    this.$state = $state;
  }

})();
