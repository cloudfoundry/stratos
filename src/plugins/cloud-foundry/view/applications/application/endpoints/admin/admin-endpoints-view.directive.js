(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints')
    .directive('adminEndpointsView', adminEndpointsView);

  function adminEndpointsView() {
    return {
      controller: AdminEndpointsController,
      controllerAs: 'adminEndpointsCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/admin/admin-endpoints-view.html'
    };
  }

  AdminEndpointsController.$inject = [
    'app.model.modelManager'
  ];

  function AdminEndpointsController(modelManager) {
    this.modelManager = modelManager;
  }

  angular.extend(AdminEndpointsController.prototype, {
  });

})();
