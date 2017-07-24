(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space.detail', [
      'cloud-foundry.view.dashboard.cluster.organization.space.detail.applications',
      'cloud-foundry.view.dashboard.cluster.organization.space.detail.services',
      'cloud-foundry.view.dashboard.cluster.organization.space.detail.routes',
      'cloud-foundry.view.dashboard.cluster.organization.space.detail.users'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail', {
      url: '',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/space/detail/cluster-space-detail.html',
      controller: ClusterSpaceController,
      controllerAs: 'clusterSpaceController'
    });
  }

  function ClusterSpaceController($q, $state, $stateParams, modelManager, appUtilsService, cfTabs) {
    var vm = this;

    vm.space = space;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = $stateParams.space;
    vm.stateInitialised = false;
    vm.cfTabs = cfTabs;

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
