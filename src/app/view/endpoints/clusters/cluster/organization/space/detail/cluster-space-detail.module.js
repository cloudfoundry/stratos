(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/cluster-space-detail.html',
      controller: ClusterSpaceController,
      controllerAs: 'clusterSpaceController'
    });
  }

  ClusterSpaceController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterSpaceController(modelManager, $stateParams) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
  }

  angular.extend(ClusterSpaceController.prototype, {
    space: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
