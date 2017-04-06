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
    var vm = this;

    vm.space = space;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = $stateParams.space;
    vm.stateInitialised = false;

    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);

    function space() {
      return spaceModel.fetchSpace(vm.clusterGuid, vm.spaceGuid);
    }

    function init() {
      vm.stateInitialised = true;
      spaceModel.uncacheAllServiceInstancesForSpace(vm.clusterGuid, vm.spaceGuid);
      spaceModel.uncacheRoutesForSpace(vm.clusterGuid, vm.spaceGuid);
      return $q.resolve();
    }

  }
})();
