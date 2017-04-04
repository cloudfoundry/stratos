(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail', [
      'app.view.endpoints.clusters.cluster.organization.space.detail.applications',
      'app.view.endpoints.clusters.cluster.organization.space.detail.services',
      'app.view.endpoints.clusters.cluster.organization.space.detail.routes',
      'app.view.endpoints.clusters.cluster.organization.space.detail.users'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/cluster-space-detail.html',
      controller: ClusterSpaceController,
      controllerAs: 'clusterSpaceController'
    });
  }

  function ClusterSpaceController($q, $state, $stateParams, modelManager, appUtilsService) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    this.stateInitialised = false;

    function init() {
      that.stateInitialised = true;
      that.spaceModel.uncacheAllServiceInstancesForSpace(that.clusterGuid, that.spaceGuid);
      that.spaceModel.uncacheRoutesForSpace(that.clusterGuid, that.spaceGuid);
      return $q.resolve();
    }

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);
  }

  angular.extend(ClusterSpaceController.prototype, {
    space: function () {
      return this.spaceModel.fetchSpace(this.clusterGuid, this.spaceGuid);
    }

  });
})();
