(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space', [
      'app.view.endpoints.clusters.cluster.organization.space.detail'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space', {
      url: '/:space',
      abstract: true,
      template: '<ui-view/>',
      controller: ClusterSpaceController
    });
  }

  ClusterSpaceController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterSpaceController(modelManager, $stateParams) {
    var clusterGuid = $stateParams.guid;
    var spaceGuid = $stateParams.space;

    // Fetch all space related data for this space. Some stats may also fetch additional data
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    spaceModel.listAllServiceInstancesForSpace(clusterGuid, spaceGuid);
    spaceModel.listAllRoutesForSpace(clusterGuid, spaceGuid);
  }

  angular.extend(ClusterSpaceController.prototype, {});
})();
