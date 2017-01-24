(function () {
  'use strict';

  angular
    .module('service-manager.view.service.detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.detail', {
      url: '',
      abstract: true,
      templateUrl: 'plugins/service-manager/view/service/detail/detail.html',
      ncyBreadcrumb: {
        label: gettext('Service Manager'),
        parent: 'sm.tiles'
      }
    });
  }

})();
