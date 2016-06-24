(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints')
    .directive('developerEndpointsView', developerEndpointsView);

  function developerEndpointsView() {
    return {
      controller: DeveloperEndpointsController,
      controllerAs: 'devEndpointsCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/developer/developer-endpoints-view.html'
    };
  }

  DeveloperEndpointsController.$inject = [
    'app.model.modelManager'
  ];

  function DeveloperEndpointsController(modelManager) {
    this.modelManager = modelManager;
  }

  angular.extend(DeveloperEndpointsController.prototype, {
  });

})();
